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
  const assessments = new Map();

  function eligibleException(name, severity) {
    const candidates = exceptions.filter((item) => item.package === name);
    if (candidates.length === 0) return { exception: null, reason: 'no documented exception' };

    const scoped = candidates.filter((item) =>
      (item.appliesTo ?? []).some((target) => targets.includes(target)));
    if (scoped.length === 0) {
      const scopes = [...new Set(candidates.flatMap((item) => item.appliesTo ?? []))];
      return {
        exception: null,
        reason: `exception is scoped to ${scopes.join(', ') || 'nothing'} but composition targets ${targets.join(', ') || 'none'}`,
      };
    }

    const severityMatch = scoped.find((item) => rank(severity) <= rank(item.maxSeverity));
    if (!severityMatch) {
      return {
        exception: null,
        reason: `severity exceeds documented ${scoped.map((item) => item.maxSeverity).join(' or ')}`,
      };
    }

    const deadline = severityMatch.deadline
      ? new Date(`${severityMatch.deadline}T23:59:59Z`)
      : null;
    if (deadline && now > deadline) {
      return {
        exception: null,
        reason: `exception expired on ${severityMatch.deadline} (review required)`,
      };
    }
    return { exception: severityMatch, reason: null };
  }

  function assess(name, trail = new Set()) {
    if (assessments.has(name)) return assessments.get(name);
    const info = vulnerabilities[name];
    const severity = info?.severity ?? 'unknown';
    if (!info) return { ok: false, reason: `propagation references unknown package ${name}` };
    if (trail.has(name)) return { ok: false, reason: `cyclic advisory propagation through ${name}` };

    const via = Array.isArray(info.via) ? info.via : [];
    const directAdvisories = via.filter((item) => typeof item === 'object' && item !== null);
    const dependencies = via.filter((item) => typeof item === 'string');

    // npm reports every affected parent as a vulnerability. A parent can inherit
    // an accepted root advisory without repeating one exception per package, but
    // only when the root exception explicitly authorizes that propagation.
    if (directAdvisories.length === 0 && dependencies.length > 0) {
      const nextTrail = new Set(trail).add(name);
      const causes = dependencies.map((dependency) => assess(dependency, nextTrail));
      if (causes.every((cause) => cause.ok && cause.propagationAuthorized)) {
        const result = {
          ok: true,
          propagationAuthorized: true,
          deadline: causes.map((cause) => cause.deadline).filter(Boolean).sort()[0],
          propagatedVia: dependencies,
        };
        assessments.set(name, result);
        return result;
      }
    }

    const { exception, reason } = eligibleException(name, severity);
    const result = exception
      ? {
          ok: true,
          propagationAuthorized: exception.allowPropagation === true,
          deadline: exception.deadline,
        }
      : { ok: false, propagationAuthorized: false, reason };
    assessments.set(name, result);
    return result;
  }

  for (const [name, info] of Object.entries(vulnerabilities)) {
    const severity = info?.severity ?? 'unknown';
    const assessment = assess(name);
    if (!assessment.ok) {
      violations.push({ package: name, severity, reason: assessment.reason });
      continue;
    }
    accepted.push({
      package: name,
      severity,
      deadline: assessment.deadline,
      ...(assessment.propagatedVia ? { propagatedVia: assessment.propagatedVia } : {}),
    });
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
