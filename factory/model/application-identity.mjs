import { createHash } from 'node:crypto';

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'sealed',
  'permits', 'var', 'yield', 'true', 'false', 'null', '_',
]);

function digest(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 10);
}

/** Bounds a machine identifier without making truncation collisions silent. */
export function bounded(value, maximum) {
  if (value.length <= maximum) return value;
  return `${value.slice(0, maximum - 11).replace(/[-_.]+$/u, '')}-${digest(value)}`;
}

function words(value) {
  return value.split('-').filter(Boolean);
}

function title(value) {
  return words(value).map((part) => (part === 'api'
    ? 'API'
    : `${part[0].toUpperCase()}${part.slice(1)}`)).join(' ');
}

function pascal(value) {
  return words(value).map((part) => {
    const safe = /^[0-9]/u.test(part) ? `x${part}` : part;
    return `${safe[0].toUpperCase()}${safe.slice(1)}`;
  }).join('');
}

function javaSegment(value) {
  const safe = /^[0-9]/u.test(value) || JAVA_KEYWORDS.has(value) ? `x${value}` : value;
  return safe;
}

function dotted(value) {
  return words(value).map(javaSegment).join('.');
}

function assertUnique(applications, field, read) {
  const seen = new Map();
  for (const application of applications) {
    const value = read(application.identity);
    const prior = seen.get(value);
    if (prior) {
      throw new Error(`Application identity collision for ${field}: ${prior} and ${application.id} -> ${value}`);
    }
    seen.set(value, application.id);
  }
}

/**
 * Derives ecosystem identities from CSM metadata and the canonical application id.
 * No starter name participates: runtimes select a representation, never an identity.
 */
export function deriveApplicationIdentity({ project, displayName, application }) {
  const workload = bounded(`${project}-${application.id}`, 63);
  const javaProject = dotted(project);
  const javaApplication = dotted(application.id);
  const nativeId = `app.${javaProject}.${javaApplication}`;
  const label = `${displayName} — ${title(application.id)}`;
  const dartName = bounded(`${project}_${application.id}`.replaceAll('-', '_'), 64)
    .replace(/-([a-f0-9]{10})$/u, '_$1');

  return {
    canonical: workload,
    displayName: label,
    serviceName: workload,
    npm: { packageName: `@${project}/${application.id}` },
    maven: {
      groupId: `app.${javaProject}`,
      artifactId: workload,
      packageName: nativeId,
      mainClass: `${pascal(project)}${pascal(application.id)}Application`,
    },
    python: { distributionName: workload },
    angular: { projectName: workload, outputPath: `dist/${workload}` },
    expo: {
      name: label,
      slug: workload,
      scheme: workload,
      androidPackage: nativeId,
      iosBundleIdentifier: nativeId,
    },
    dart: { packageName: dartName },
    android: { namespace: nativeId, applicationId: nativeId, label },
  };
}

/** Derives and collision-checks every application identity in one system. */
export function withApplicationIdentities({ project, displayName, applications }) {
  const identified = applications.map((application) => ({
    ...application,
    identity: deriveApplicationIdentity({ project, displayName, application }),
  }));
  const fields = [
    ['canonical', (identity) => identity.canonical],
    ['npm.packageName', (identity) => identity.npm.packageName],
    ['maven coordinates', (identity) => `${identity.maven.groupId}:${identity.maven.artifactId}`],
    ['maven.packageName', (identity) => identity.maven.packageName],
    ['expo.androidPackage', (identity) => identity.expo.androidPackage],
    ['dart.packageName', (identity) => identity.dart.packageName],
  ];
  for (const [field, read] of fields) assertUnique(identified, field, read);
  return identified;
}
