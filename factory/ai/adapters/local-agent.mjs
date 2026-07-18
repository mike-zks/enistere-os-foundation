import { spawn, spawnSync } from 'node:child_process';

const ENV_ALLOWLIST = [
  'PATH', 'HOME', 'CODEX_HOME', 'CLAUDE_CONFIG_DIR', 'XDG_CONFIG_HOME', 'XDG_RUNTIME_DIR',
  'LANG', 'LC_ALL', 'TERM', 'TMPDIR',
];

export const LOCAL_AGENTS = Object.freeze({
  codex: Object.freeze({ command: 'codex', versionArgs: ['--version'], buildArgs: (cwd) => ['exec', '--ephemeral', '--sandbox', 'workspace-write', '--cd', cwd, '--json', '-'] }),
  claude: Object.freeze({ command: 'claude', versionArgs: ['--version'], buildArgs: () => ['-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--no-session-persistence'] }),
  gemini: Object.freeze({ command: 'gemini', versionArgs: ['--version'], buildArgs: () => ['-p'] }),
});

export function sanitizeAgentEnvironment(source = process.env) {
  return Object.fromEntries(ENV_ALLOWLIST.flatMap((key) => source[key] ? [[key, source[key]]] : []));
}

export function probeLocalAgent(id) {
  const definition = LOCAL_AGENTS[id];
  if (!definition) return { id, available: false, version: null, reason: 'unknown_agent' };
  const result = spawnSync(definition.command, definition.versionArgs, { encoding: 'utf8', shell: false, timeout: 5000, env: sanitizeAgentEnvironment() });
  return {
    id,
    available: result.status === 0,
    version: result.status === 0 ? (result.stdout || result.stderr).trim().split('\n')[0] : null,
    reason: result.status === 0 ? null : 'not_available',
  };
}

export function validateMissionEnvelope(value) {
  const issues = [];
  if (!value || typeof value !== 'object') return ['mission must be an object'];
  if (typeof value.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(value.id)) issues.push('mission.id must be kebab-case');
  if (!['analyze', 'implement', 'review'].includes(value.operation)) issues.push('mission.operation is invalid');
  if (typeof value.objective !== 'string' || value.objective.trim() === '') issues.push('mission.objective is required');
  if (!Array.isArray(value.allowedFiles)) issues.push('mission.allowedFiles must be an array');
  if (!Array.isArray(value.forbiddenFiles)) issues.push('mission.forbiddenFiles must be an array');
  if (!Array.isArray(value.gates)) issues.push('mission.gates must be an array');
  return issues;
}

export function renderMissionPrompt(mission) {
  const issues = validateMissionEnvelope(mission);
  if (issues.length) throw new Error(`Invalid mission:\n- ${issues.join('\n- ')}`);
  return JSON.stringify({ schema: 'enistere-mission/v1', ...mission });
}

export function runLocalAgent({ id, mission, cwd, timeoutMs = 900_000, maxOutputBytes = 2_000_000 }) {
  const definition = LOCAL_AGENTS[id];
  if (!definition) return Promise.reject(new Error(`Unknown local agent: ${id}`));
  const prompt = renderMissionPrompt(mission);
  return new Promise((resolve, reject) => {
    const child = spawn(definition.command, definition.buildArgs(cwd), {
      cwd, env: sanitizeAgentEnvironment(), shell: false, stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let bytes = 0;
    let exceeded = false;
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    const collect = (target) => (chunk) => {
      bytes += chunk.length;
      if (bytes > maxOutputBytes) { exceeded = true; child.kill('SIGTERM'); return; }
      target.push(chunk);
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (exceeded) return reject(new Error('Agent output limit exceeded'));
      resolve({ id, code: code ?? 1, signal, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') });
    });
    child.stdin.end(prompt);
  });
}
