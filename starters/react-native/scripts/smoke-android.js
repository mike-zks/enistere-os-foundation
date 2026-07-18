#!/usr/bin/env node
/* global console, process, require, setTimeout */

const { execFile, spawn } = require('node:child_process');
const http = require('node:http');
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const AUTH_PORT = Number(process.env.RN_SMOKE_AUTH_PORT || '3000');
const REPORT_PATH =
  process.env.RN_SMOKE_REPORT_PATH || join('/tmp', 'enistere-mobile-rn29-smoke-report.json');
const STEP_TIMEOUT_MS = Number(process.env.RN_SMOKE_STEP_TIMEOUT_MS || '45000');
const BOOT_TIMEOUT_MS = Number(process.env.RN_SMOKE_BOOT_TIMEOUT_MS || '120000');

// Smoke credentials — used only with the local mock auth server (no real backend).
// Override via env; defaults are non-sensitive placeholders that match the mock.
const SMOKE_EMAIL = process.env.RN_SMOKE_EMAIL || 'smoke@example.com';
const SMOKE_PASSWORD = process.env.RN_SMOKE_PASSWORD || 'smoke';

const state = {
  startedAt: new Date().toISOString(),
  status: 'running',
  steps: [],
  mock: {
    loginCount: 0,
    refreshCount: 0,
    uploadCount: 0,
  },
  blockers: [],
  warnings: [],
};

let mockServer;
let expoProcess;
let expoExited = false;
let resolveExpoReady;

const expoReady = new Promise((resolve) => {
  resolveExpoReady = resolve;
});

function record(kind, detail) {
  const entry = {
    at: new Date().toISOString(),
    kind,
    ...detail,
  };
  state.steps.push(entry);
  console.log(JSON.stringify(entry));
}

function failBlocker(message, detail) {
  state.status = 'blocked';
  state.blockers.push({ message, detail });
  record('blocked', { message, detail });
  writeReport();
  process.exitCode = 2;
}

function failSmoke(message, detail) {
  state.status = 'failed';
  state.blockers.push({ message, detail });
  record('failed', { message, detail });
  writeReport();
  process.exitCode = 1;
}

function writeReport() {
  state.finishedAt = new Date().toISOString();
  writeFileSync(REPORT_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify({ kind: 'report', path: REPORT_PATH, status: state.status }));
}

async function run(command, args, options = {}) {
  record('command', { command: [command, ...args].join(' ') });
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      timeout: options.timeout || STEP_TIMEOUT_MS,
      maxBuffer: options.maxBuffer || 1024 * 1024 * 4,
    });
    return {
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
    };
  } catch (error) {
    const stdout = error.stdout ? error.stdout.toString() : '';
    const stderr = error.stderr ? error.stderr.toString() : '';
    const message = error.code === 'ENOENT' ? `${command} not found` : error.message;
    throw new Error(`${message}\n${stdout}\n${stderr}`.trim());
  }
}

async function checkCommand(command, args) {
  try {
    await run(command, args);
    record('preflight-pass', { check: command });
    return true;
  } catch (error) {
    failBlocker(`Missing or unusable command: ${command}`, String(error.message));
    return false;
  }
}

async function getDevice() {
  let stdout;
  try {
    ({ stdout } = await run('adb', ['devices', '-l']));
  } catch (error) {
    failBlocker('Unable to query adb devices.', String(error.message));
    return undefined;
  }

  const devices = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('List of devices'))
    .filter((line) => /\sdevice\s/.test(line));

  if (devices.length === 0) {
    failBlocker('No Android device/emulator connected via adb.', stdout.trim());
    return undefined;
  }

  const serial = devices[0].split(/\s+/)[0];
  record('preflight-pass', { check: 'adb-device', serial, deviceCount: devices.length });
  return serial;
}

function startMockAuthServer() {
  const response = JSON.stringify({
    success: true,
    data: {
      accessToken: 'rn29-smoke-access-token',
      refreshToken: 'rn29-smoke-refresh-token',
      accessTokenExpiresIn: 900,
    },
    message: 'ok',
  });

  mockServer = http.createServer((request, result) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk.toString();
    });
    request.on('end', () => {
      const method = request.method || 'GET';
      const url = request.url || '/';
      if (method === 'POST' && url === '/auth/login') {
        state.mock.loginCount += 1;
        record('mock-request', { method, url });
        result.writeHead(200, { 'content-type': 'application/json' });
        result.end(response);
        return;
      }
      if (method === 'POST' && url === '/auth/refresh') {
        state.mock.refreshCount += 1;
        record('mock-request', { method, url });
        result.writeHead(200, { 'content-type': 'application/json' });
        result.end(response);
        return;
      }
      if (method === 'POST' && url === '/files') {
        state.mock.uploadCount += 1;
        record('mock-request', { method, url });
        result.writeHead(201, { 'content-type': 'application/json' });
        result.end(
          JSON.stringify({
            success: true,
            data: {
              id: 'smoke-diagnostic-id',
              category: 'DOCUMENT',
              createdAt: new Date().toISOString(),
              extension: 'txt',
              mimeType: 'text/plain',
              originalName: 'smoke-file',
              size: '25',
            },
            timestamp: new Date().toISOString(),
          }),
        );
        return;
      }
      record('mock-request-unhandled', { method, url });
      result.writeHead(404, { 'content-type': 'application/json' });
      result.end(JSON.stringify({ success: false, error: 'not-found' }));
    });
  });

  return new Promise((resolve, reject) => {
    mockServer.once('error', reject);
    mockServer.listen(AUTH_PORT, '127.0.0.1', () => {
      record('mock-started', { host: '127.0.0.1', port: AUTH_PORT });
      resolve();
    });
  });
}

function startExpo() {
  record('expo-start', { command: 'npx expo start --android --localhost -c' });
  expoProcess = spawn('npx', ['expo', 'start', '--android', '--localhost', '-c'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  expoProcess.once('exit', () => {
    expoExited = true;
  });

  expoProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    for (const line of text.split('\n').filter(Boolean)) {
      record('expo-output', { stream: 'stdout', line: line.slice(0, 240) });
      if (line.includes('Waiting on http://localhost') || line.includes('Logs for your project')) {
        resolveExpoReady();
      }
    }
  });
  expoProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    for (const line of text.split('\n').filter(Boolean)) {
      record('expo-output', { stream: 'stderr', line: line.slice(0, 240) });
    }
  });
}

async function waitForExpoReady() {
  await Promise.race([
    expoReady,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Expo CLI did not report a ready Metro server in time.')), BOOT_TIMEOUT_MS);
    }),
  ]);
  record('expo-ready', { note: 'Metro reported ready; waiting briefly for the app reload to settle.' });
  await delay(3000);
}

async function dumpUi() {
  const { stdout } = await run('adb', ['exec-out', 'uiautomator', 'dump', '/dev/tty'], {
    timeout: STEP_TIMEOUT_MS,
    maxBuffer: 1024 * 1024 * 8,
  });
  return stdout;
}

function decodeXml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function findNode(xml, label) {
  const nodePattern = /<node\b[^>]*>/g;
  let match;
  while ((match = nodePattern.exec(xml)) !== null) {
    const node = match[0];
    const text = /text="([^"]*)"/.exec(node);
    const description = /content-desc="([^"]*)"/.exec(node);
    const rawLabel = decodeXml((text && text[1]) || (description && description[1]) || '');
    if (rawLabel !== label) {
      continue;
    }
    const bounds = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node);
    if (!bounds) {
      continue;
    }
    const x1 = Number(bounds[1]);
    const y1 = Number(bounds[2]);
    const x2 = Number(bounds[3]);
    const y2 = Number(bounds[4]);
    return {
      label,
      x: Math.round((x1 + x2) / 2),
      y: Math.round((y1 + y2) / 2),
      bounds: [x1, y1, x2, y2],
    };
  }
  return undefined;
}

async function waitForNode(label, timeoutMs = STEP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastXml = '';
  while (Date.now() < deadline) {
    const xml = await dumpUi();
    lastXml = xml;
    const node = findNode(xml, label);
    if (node) {
      record('ui-found', { label, bounds: node.bounds });
      return node;
    }
    await delay(1000);
  }
  throw new Error(`UI label not found before timeout: ${label}\n${lastXml.slice(0, 2000)}`);
}

async function tapLabel(label) {
  const node = await waitForNode(label);
  await run('adb', ['shell', 'input', 'tap', String(node.x), String(node.y)]);
  record('ui-tap', { label });
}

async function getScreenSize() {
  const { stdout } = await run('adb', ['shell', 'wm', 'size']);
  const match = /Physical size:\s*(\d+)x(\d+)/.exec(stdout);
  if (!match) {
    return { width: 1080, height: 1920 };
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

/**
 * Finds a form input field by its accessibilityLabel (content-desc) only.
 *
 * This is distinct from findNode() which matches both text= and content-desc=.
 * The form label text (e.g. "Email") appears as text= on the TextView node,
 * while the actual TextInput appears as content-desc= on its EditText node.
 * Searching by content-desc only avoids tapping the label instead of the input.
 */
function findInputByLabel(xml, label) {
  const nodePattern = /<node\b[^>]*>/g;
  let match;
  while ((match = nodePattern.exec(xml)) !== null) {
    const node = match[0];
    const desc = /content-desc="([^"]*)"/.exec(node);
    if (!desc) continue;
    const rawLabel = decodeXml(desc[1]);
    if (rawLabel !== label) continue;
    const bounds = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node);
    if (!bounds) continue;
    const x1 = Number(bounds[1]);
    const y1 = Number(bounds[2]);
    const x2 = Number(bounds[3]);
    const y2 = Number(bounds[4]);
    return {
      label,
      x: Math.round((x1 + x2) / 2),
      y: Math.round((y1 + y2) / 2),
      bounds: [x1, y1, x2, y2],
    };
  }
  return undefined;
}

async function waitForInputByLabel(label, timeoutMs = STEP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastXml = '';
  while (Date.now() < deadline) {
    const xml = await dumpUi();
    lastXml = xml;
    const node = findInputByLabel(xml, label);
    if (node) {
      record('ui-found-input', { label, bounds: node.bounds });
      return node;
    }
    await delay(1000);
  }
  throw new Error(`Input field "${label}" not found before timeout.\n${lastXml.slice(0, 2000)}`);
}

/** Taps an input field (by accessibilityLabel/content-desc) then types the given text. */
async function tapInputAndType(label, text) {
  const node = await waitForInputByLabel(label);
  await run('adb', ['shell', 'input', 'tap', String(node.x), String(node.y)]);
  record('ui-tap-input', { label });
  await delay(400);
  await run('adb', ['shell', 'input', 'text', text]);
  record('ui-type', { label, length: text.length });
  await delay(300);
}

async function scrollDown() {
  const { width, height } = await getScreenSize();
  await run('adb', [
    'shell',
    'input',
    'swipe',
    String(Math.round(width / 2)),
    String(Math.round(height * 0.82)),
    String(Math.round(width / 2)),
    String(Math.round(height * 0.32)),
    '450',
  ]);
  record('ui-scroll', { direction: 'down', width, height });
}

async function waitForMockCount(field, expected, timeoutMs = STEP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (state.mock[field] >= expected) {
      record('mock-count-ok', { field, expected, actual: state.mock[field] });
      return;
    }
    await delay(500);
  }
  throw new Error(`Mock ${field} did not reach ${expected}; actual=${state.mock[field]}`);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function cleanup() {
  if (expoProcess && !expoExited) {
    expoProcess.stdout.removeAllListeners('data');
    expoProcess.stderr.removeAllListeners('data');
    expoProcess.stdout.destroy();
    expoProcess.stderr.destroy();
    expoProcess.kill('SIGINT');
    await Promise.race([
      new Promise((resolve) => expoProcess.once('exit', resolve)),
      delay(3000).then(() => {
        if (expoProcess && !expoExited) {
          expoProcess.kill('SIGKILL');
        }
      }),
    ]);
  }
  if (mockServer) {
    await new Promise((resolve) => mockServer.close(resolve));
  }
  try {
    await run('adb', ['reverse', '--remove', `tcp:${AUTH_PORT}`], { timeout: 5000 });
  } catch (error) {
    state.warnings.push({ message: 'Unable to remove adb reverse', detail: String(error.message) });
  }
}

async function main() {
  record('smoke-start', {
    goal: 'starter-public-protected-settings-upload',
    reportPath: REPORT_PATH,
    mode: 'semi-automated',
  });

  if (!(await checkCommand('adb', ['version']))) return;
  if (!(await checkCommand('npx', ['--version']))) return;
  const device = await getDevice();
  if (!device) return;

  try {
    await startMockAuthServer();
  } catch (error) {
    failBlocker(`Unable to start local auth mock on 127.0.0.1:${AUTH_PORT}.`, String(error.message));
    return;
  }

  await run('adb', ['reverse', `tcp:${AUTH_PORT}`, `tcp:${AUTH_PORT}`]);
  record('adb-reverse-ready', { port: AUTH_PORT });

  // Create the upload smoke fixture on device before Expo starts.
  // The file is a plain-text placeholder; the real upload validation is server-side.
  try {
    await run('adb', [
      'shell',
      'sh',
      '-c',
      'echo -n "enistere-smoke-diagnostic" > /sdcard/Download/enistere-smoke.txt',
    ]);
    record('fixture-created', { path: '/sdcard/Download/enistere-smoke.txt' });
  } catch (error) {
    state.warnings.push({
      message: 'Could not create upload fixture file; upload step may fail.',
      detail: String(error.message),
    });
    record('fixture-warn', { message: 'Upload fixture creation failed.' });
  }

  startExpo();
  await waitForExpoReady();

  try {
    await Promise.race([
      waitForNode('Sign in', BOOT_TIMEOUT_MS).catch(async (error) => {
        record('ui-initial-public-not-found', { message: error.message.slice(0, 300) });
        return waitForNode('Open settings', 5000);
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Expo app did not render public or protected shell in time.')), BOOT_TIMEOUT_MS);
      }),
    ]);

    const xml = await dumpUi();
    if (findNode(xml, 'Sign in')) {
      // RN 32: sign-in screen now has email/password form fields.
      // Fill credentials (non-sensitive smoke defaults, mock auth only).
      await tapInputAndType('Email', SMOKE_EMAIL);
      await tapInputAndType('Password', SMOKE_PASSWORD);
      // Press Enter/Send on the password field — triggers onSubmitEditing → form submit.
      await run('adb', ['shell', 'input', 'keyevent', '66']);
      record('ui-submit-form', { method: 'keyevent-enter' });
      await waitForMockCount('loginCount', 1);
      await waitForNode('Open settings', STEP_TIMEOUT_MS);
    } else {
      record('ui-skip-login', { reason: 'protected shell already visible' });
    }

    await tapLabel('Open settings');
    await waitForNode('Settings');

    try {
      await waitForNode('Foundation diagnostics', 5000);
    } catch {
      await scrollDown();
      await waitForNode('Foundation diagnostics');
    }

    await run('adb', ['shell', 'input', 'keyevent', '4']);
    await waitForNode('Open settings');

    // RN36 — upload diagnostics flow
    await tapLabel('Upload diagnostics');
    await waitForNode('Upload diagnostics');
    await tapLabel('Submit diagnostic upload');
    await waitForMockCount('uploadCount', 1);
    await waitForNode('Upload complete');
    await run('adb', ['shell', 'input', 'keyevent', '4']);
    await waitForNode('Open settings');

    await tapLabel('Refresh session');
    await waitForMockCount('refreshCount', 1);
    await waitForNode('Open settings');
    await tapLabel('Sign out');
    await waitForNode('Sign in');

    state.status = 'passed';
    record('smoke-pass', {
      loginCount: state.mock.loginCount,
      refreshCount: state.mock.refreshCount,
      uploadCount: state.mock.uploadCount,
      note: 'Semi-automated smoke passed through visible UI labels.',
    });
  } catch (error) {
    failSmoke('Android runtime smoke did not complete.', String(error.message));
    return;
  } finally {
    await cleanup();
  }

  writeReport();
}

main().catch(async (error) => {
  failSmoke('Unexpected smoke script failure.', String(error && error.stack ? error.stack : error));
  await cleanup();
});
