#!/usr/bin/env node
/**
 * audit-check.mjs — `npm audit` par exceptions documentées, sans désactivation globale.
 *
 * Le gate échoue si :
 *   - une vulnérabilité n'est couverte par AUCUNE exception documentée ;
 *   - une vulnérabilité dépasse la sévérité documentée par son exception ;
 *   - l'exception ne s'applique pas à la composition auditée (portée `appliesTo`) ;
 *   - l'échéance d'une exception utilisée est dépassée (revue forcée).
 *
 * Aucun `--audit-level` permissif, aucun `audit fix --force`, aucune suppression
 * d'advisory : les exceptions sont explicites, scopées et datées
 * (factory/quality/audit-exceptions.json).
 *
 * Usage : node factory/quality/scripts/audit-check.mjs <projectDir> [--targets nestjs,nextjs,react-native]
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const EXCEPTIONS_PATH = resolve(HERE, '../audit-exceptions.json');

const SEVERITY_ORDER = ['info', 'low', 'moderate', 'high', 'critical'];
const rank = (severity) => SEVERITY_ORDER.indexOf(severity);

export function loadExceptions(path = EXCEPTIONS_PATH) {
  return JSON.parse(readFileSync(path, 'utf8')).exceptions ?? [];
}

/**
 * Pure evaluation of an `npm audit --json` payload against the exception list.
 * `targets` are the starter ids present in the audited composition.
 */
export function evaluateAudit(auditJson, exceptions, { targets = [], now = new Date() } = {}) {
  const vulnerabilities = auditJson?.vulnerabilities ?? {};
  const violations = [];
  const accepted = [];

  for (const [name, info] of Object.entries(vulnerabilities)) {
    const severity = info?.severity ?? 'unknown';
    const exception = exceptions.find((item) => item.package === name);
    if (!exception) {
      violations.push({ package: name, severity, reason: 'no documented exception' });
      continue;
    }
    const scoped = (exception.appliesTo ?? []).some((target) => targets.includes(target));
    if (!scoped) {
      violations.push({
        package: name, severity,
        reason: `exception is scoped to ${(exception.appliesTo ?? []).join(', ') || 'nothing'} but composition targets ${targets.join(', ') || 'none'}`,
      });
      continue;
    }
    if (rank(severity) > rank(exception.maxSeverity)) {
      violations.push({ package: name, severity, reason: `severity exceeds documented ${exception.maxSeverity}` });
      continue;
    }
    const deadline = exception.deadline ? new Date(`${exception.deadline}T23:59:59Z`) : null;
    if (deadline && now > deadline) {
      violations.push({ package: name, severity, reason: `exception expired on ${exception.deadline} (review required)` });
      continue;
    }
    accepted.push({ package: name, severity, deadline: exception.deadline });
  }

  return { ok: violations.length === 0, violations, accepted, total: Object.keys(vulnerabilities).length };
}

/** Runs `npm audit --json` in a project directory (never mutates the project). */
export function runNpmAudit(projectDir) {
  const result = spawnSync('npm', ['audit', '--json'], { cwd: projectDir, encoding: 'utf8', shell: false });
  if (!result.stdout) throw new Error(`npm audit produced no output in ${projectDir}: ${result.stderr ?? ''}`);
  return JSON.parse(result.stdout);
}

function main() {
  const [projectDir, ...rest] = process.argv.slice(2);
  if (!projectDir) {
    console.error('Usage: audit-check.mjs <projectDir> [--targets a,b]');
    process.exit(1);
  }
  const targetsFlag = rest.indexOf('--targets');
  const targets = targetsFlag >= 0 ? (rest[targetsFlag + 1] ?? '').split(',').filter(Boolean) : [];

  const audit = runNpmAudit(resolve(projectDir));
  const report = evaluateAudit(audit, loadExceptions(), { targets });

  console.log(JSON.stringify({
    project: resolve(projectDir), targets,
    total: report.total,
    accepted: report.accepted,
    violations: report.violations,
  }, null, 2));

  if (!report.ok) {
    console.error(`\n❌ npm audit: ${report.violations.length} vulnérabilité(s) non couverte(s) par une exception documentée.`);
    process.exit(1);
  }
  console.log(`\n✓ npm audit: ${report.total} advisory(ies), toutes couvertes par une exception documentée et non expirée.`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
