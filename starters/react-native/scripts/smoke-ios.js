#!/usr/bin/env node
/* global console, process, require */

const { execFile } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const REPORT_PATH =
  process.env.RN_SMOKE_IOS_REPORT_PATH || join('/tmp', 'enistere-mobile-rn30-ios-smoke-report.json');
const COMMAND_TIMEOUT_MS = Number(process.env.RN_SMOKE_IOS_COMMAND_TIMEOUT_MS || '45000');

const state = {
  startedAt: new Date().toISOString(),
  platform: {
    node: process.version,
    os: process.platform,
    arch: process.arch,
  },
  status: 'running',
  steps: [],
  blockers: [],
  procedure: [
    'Run this command on macOS with Xcode command line tools installed: npm run smoke:ios',
    'Ensure xcrun simctl list devices shows an available iOS Simulator, or connect an iOS device with Expo Go.',
    'Start the local mock auth server (same as smoke-android.js: Node http on port 3000, POST /auth/login + POST /auth/refresh).',
    'Run npx expo start --ios --localhost -c from starters/react-native.',
    'The sign-in screen (RN 32) shows an email/password form — fill with smoke credentials: RN_SMOKE_EMAIL (default smoke@example.com) and RN_SMOKE_PASSWORD (default smoke). The mock auth accepts any credentials.',
    'Replay the full starter parcours: fill sign-in form -> tap Sign in -> Home protected -> Settings protected -> scroll diagnostics -> back Home -> Refresh session -> Sign out.',
    'Do not use a real backend, real secret, SDK, native adapter, or business endpoint for this smoke.',
    'Record the device/simulator name, iOS version, Expo target, result, and any visual/runtime defects in the RN31 report.',
  ],
};

function record(kind, detail) {
  const entry = {
    at: new Date().toISOString(),
    kind,
    ...detail,
  };
  state.steps.push(entry);
  console.log(JSON.stringify(entry));
}

function writeReport() {
  state.finishedAt = new Date().toISOString();
  writeFileSync(REPORT_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify({ kind: 'report', path: REPORT_PATH, status: state.status }));
}

function block(message, detail) {
  state.status = 'blocked';
  state.blockers.push({ message, detail });
  record('blocked', { message, detail });
  writeReport();
  process.exitCode = 2;
}

async function run(command, args) {
  record('command', { command: [command, ...args].join(' ') });
  try {
    const result = await execFileAsync(command, args, {
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 8,
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

async function main() {
  record('preflight-start', { target: 'ios' });

  if (process.platform !== 'darwin') {
    block('iOS Simulator runtime requires macOS/Xcode.', {
      detectedPlatform: process.platform,
      expectedPlatform: 'darwin',
    });
    return;
  }

  try {
    const npx = await run('npx', ['--version']);
    record('preflight-pass', { check: 'npx', version: npx.stdout.trim() });
  } catch (error) {
    block('Missing or unusable npx command.', String(error.message));
    return;
  }

  try {
    const xcrun = await run('xcrun', ['--version']);
    record('preflight-pass', { check: 'xcrun', version: xcrun.stdout.trim() || xcrun.stderr.trim() });
  } catch (error) {
    block('Missing or unusable xcrun command.', String(error.message));
    return;
  }

  try {
    const devices = await run('xcrun', ['simctl', 'list', 'devices', 'available']);
    const availableDevices = devices.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes('(Booted)') || line.includes('(Shutdown)'));

    if (availableDevices.length === 0) {
      block('No available iOS Simulator found via xcrun simctl.', devices.stdout.trim());
      return;
    }

    state.status = 'ready';
    state.availableSimulators = availableDevices.slice(0, 20);
    record('preflight-pass', {
      check: 'ios-simulator',
      availableSimulatorCount: availableDevices.length,
      firstAvailableSimulator: availableDevices[0],
    });
    writeReport();
  } catch (error) {
    block('Unable to query iOS Simulator devices.', String(error.message));
  }
}

main().catch((error) => {
  state.status = 'failed';
  state.blockers.push({ message: 'Unexpected smoke iOS preflight failure.', detail: String(error.message) });
  record('failed', { message: 'Unexpected smoke iOS preflight failure.', detail: String(error.message) });
  writeReport();
  process.exitCode = 1;
});
