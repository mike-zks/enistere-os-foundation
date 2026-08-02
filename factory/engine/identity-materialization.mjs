import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

function stable(value) { return `${JSON.stringify(value, null, 2)}\n`; }

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function updateJson(path, update) {
  const value = await readJson(path);
  await writeFile(path, stable(update(value) ?? value));
}

async function replaceKnown(path, replacements) {
  let value = await readFile(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!value.includes(from)) throw new Error(`${path}: expected identity field not found: ${from}`);
    value = value.split(from).join(to);
  }
  await writeFile(path, value);
}

async function replaceWhenPresent(path, replacements) {
  let value = await readFile(path, 'utf8');
  for (const [from, to] of replacements) value = value.split(from).join(to);
  await writeFile(path, value);
}

async function filesUnder(root, extensions) {
  const files = [];
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (extensions.has(extname(entry.name))) files.push(path);
    }
  };
  await walk(root);
  return files;
}

function replaceJsonStrings(value, replacements) {
  if (Array.isArray(value)) return value.map((item) => replaceJsonStrings(item, replacements));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      replacements.get(key) ?? key,
      replaceJsonStrings(item, replacements),
    ]));
  }
  if (typeof value !== 'string') return value;
  let result = value;
  for (const [from, to] of replacements) result = result.split(from).join(to);
  return result;
}

async function materializeNpm(application, directory) {
  await updateJson(join(directory, 'package.json'), (manifest) => {
    manifest.name = application.identity.npm.packageName;
  });
}

async function materializeNestjs(application, directory) {
  await materializeNpm(application, directory);
  const { serviceName, displayName } = application.identity;
  await replaceKnown(join(directory, '.env.example'), [['SERVICE_NAME=api-nestjs-core', `SERVICE_NAME=${serviceName}`]]);
  for (const relative of [
    'src/config/configuration.ts',
    'src/config/env.validation.ts',
    'src/common/logging/logging.constants.ts',
    'test/setup-e2e.ts',
    'test/app.e2e-spec.ts',
    'test/logging.e2e-spec.ts',
  ]) {
    await replaceKnown(join(directory, relative), [['api-nestjs-core', serviceName]]);
  }
  for (const path of await filesUnder(join(directory, 'src'), new Set(['.ts']))) {
    const value = await readFile(path, 'utf8');
    if (value.includes('api-nestjs-core')) {
      await writeFile(path, value.split('api-nestjs-core').join(serviceName));
    }
  }
  await replaceKnown(join(directory, 'src/common/openapi/openapi-document.ts'), [
    ['Enistere API Core NestJS', displayName],
  ]);
  await updateJson(join(directory, 'openapi/openapi.json'), (document) => replaceJsonStrings(document, new Map([
    ['Enistere API Core NestJS', displayName],
    ['api-nestjs-core', serviceName],
  ])));
}

async function materializeNextjs(application, directory) {
  await materializeNpm(application, directory);
  const label = application.identity.displayName;
  await replaceKnown(join(directory, 'src/core/config/metadata.ts'), [
    ['Enistère — Web Core', label],
    ['%s · Enistère', `%s · ${label}`],
    ['Starter minimal du Web Core Enistère (Next.js App Router).', `${label} (Next.js App Router).`],
    ['applicationName: "Enistère"', `applicationName: ${JSON.stringify(label)}`],
  ]);
  await replaceKnown(join(directory, 'src/app/(public)/page.tsx'), [
    ['Enistère OS Foundation', label],
    ['Socle technique Next.js — baseline modulaire, TypeScript strict, TanStack Query et UI Kit maison.', `${label} — application Web Next.js.`],
  ]);
  await replaceKnown(join(directory, 'src/app/manifest.ts'), [
    ['Enistère — Web Core', label],
    ['Starter minimal du Web Core Enistère.', `${label}.`],
  ]);
  await replaceKnown(join(directory, 'src/core/foundation-status/foundation-status.tsx'), [
    ['Enistère — Web Core', label],
  ]);
  await replaceKnown(join(directory, 'src/app/(public)/layout.tsx'), [
    ['© Enistère OS Foundation', `© ${label}`],
  ]);
  await replaceKnown(join(directory, 'test/metadata.test.ts'), [
    ['Enistère — Web Core', label],
    ['appMetadata.title.template.includes("Enistère")', `appMetadata.title.template.includes(${JSON.stringify(label)})`],
  ]);
  await replaceKnown(join(directory, 'Dockerfile'), [
    ['--workspace=@enistere/web-nextjs', `--workspace=${application.identity.npm.packageName}`],
  ]);
}

async function materializeAngular(application, directory) {
  await materializeNpm(application, directory);
  const oldProject = 'web-angular';
  const { projectName, outputPath } = application.identity.angular;
  await updateJson(join(directory, 'angular.json'), (configuration) => {
    const project = configuration.projects?.[oldProject];
    if (!project || Object.keys(configuration.projects).length !== 1) {
      throw new Error(`${directory}/angular.json: expected the single ${oldProject} project`);
    }
    configuration.projects = { [projectName]: project };
    project.architect.build.options.outputPath = outputPath;
    return replaceJsonStrings(configuration, new Map([[`${oldProject}:`, `${projectName}:`]]));
  });
  await updateJson(join(directory, 'package.json'), (manifest) => {
    manifest.name = application.identity.npm.packageName;
    manifest.scripts = replaceJsonStrings(manifest.scripts, new Map([[`${oldProject}:`, `${projectName}:`]]));
  });
  const label = application.identity.displayName;
  await replaceKnown(join(directory, 'src/index.html'), [['<title>Enistere Angular</title>', `<title>${label}</title>`]]);
  await replaceKnown(join(directory, 'src/app/app.component.ts'), [["'Enistere Angular'", JSON.stringify(label)]]);
  await replaceKnown(join(directory, 'src/app/app.routes.ts'), [["'Enistere Angular'", JSON.stringify(label)]]);
  await replaceKnown(join(directory, 'src/app/app.component.spec.ts'), [["'Enistere Angular'", JSON.stringify(label)]]);
  await replaceKnown(join(directory, 'karma.conf.js'), [['coverage/web-angular', `coverage/${projectName}`]]);
}

async function materializeExpo(application, directory) {
  await materializeNpm(application, directory);
  const identity = application.identity.expo;
  await updateJson(join(directory, 'app.json'), (configuration) => {
    Object.assign(configuration.expo, {
      name: identity.name,
      slug: identity.slug,
      scheme: identity.scheme,
    });
    configuration.expo.android = {
      ...(configuration.expo.android ?? {}),
      package: identity.androidPackage,
    };
    configuration.expo.ios = {
      ...(configuration.expo.ios ?? {}),
      bundleIdentifier: identity.iosBundleIdentifier,
    };
  });
  // A capability may intentionally replace the starter landing screen. The
  // executable Expo identity above remains mandatory; these visible defaults
  // are adapted only while the baseline surface still owns them.
  await replaceWhenPresent(join(directory, 'app/index.tsx'), [
    ["options={{ title: 'Foundation' }}", `options={{ title: ${JSON.stringify(identity.name)} }}`],
    ['Enistère — Mobile Core', identity.name],
  ]);
}

async function rewriteJavaTree(root, fromPackage, toPackage, serviceName) {
  const files = await filesUnder(root, new Set(['.java']));
  for (const path of files) {
    let value = await readFile(path, 'utf8');
    value = value
      .replace(new RegExp(`^package ${fromPackage.replaceAll('.', '\\.')}(?=[.;])`, 'mu'), `package ${toPackage}`)
      .replace(new RegExp(`^import (static )?${fromPackage.replaceAll('.', '\\.')}(?=[.;])`, 'gmu'), (_, prefix = '') => `import ${prefix}${toPackage}`)
      .split('api-spring-core').join(serviceName);
    await writeFile(path, value);
  }
}

async function movePackageRoot(sourceRoot, fromPackage, toPackage) {
  const from = join(sourceRoot, ...fromPackage.split('.'));
  const to = join(sourceRoot, ...toPackage.split('.'));
  await mkdir(dirname(to), { recursive: true });
  await rename(from, to);
  await rm(join(sourceRoot, fromPackage.split('.')[0]), { recursive: true, force: true });
}

async function materializeSpring(application, directory) {
  const identity = application.identity;
  const oldPackage = 'com.enistere.core';
  await replaceKnown(join(directory, 'pom.xml'), [
    ['    <groupId>com.enistere</groupId>', `    <groupId>${identity.maven.groupId}</groupId>`],
    ['    <artifactId>api-spring-core</artifactId>', `    <artifactId>${identity.maven.artifactId}</artifactId>`],
  ]);
  await replaceKnown(join(directory, 'src/main/resources/application.yml'), [
    ['name: enistere-api-spring-core', `name: ${identity.serviceName}`],
    ['service-name: ${SERVICE_NAME:api-spring-core}', `service-name: \${SERVICE_NAME:${identity.serviceName}}`],
  ]);
  for (const source of ['src/main/java', 'src/test/java']) {
    const root = join(directory, source);
    await rewriteJavaTree(root, oldPackage, identity.maven.packageName, identity.serviceName);
  }
  const mainRoot = join(directory, 'src/main/java', ...oldPackage.split('.'));
  const mainFile = join(mainRoot, 'EnistereCoreApplication.java');
  await replaceKnown(mainFile, [
    ['EnistereCoreApplication', identity.maven.mainClass],
  ]);
  await rename(mainFile, join(mainRoot, `${identity.maven.mainClass}.java`));
  await replaceKnown(join(mainRoot, 'config/OpenApiConfig.java'), [
    ['Enistere API Core', identity.displayName],
  ]);
  await movePackageRoot(join(directory, 'src/main/java'), oldPackage, identity.maven.packageName);
  await movePackageRoot(join(directory, 'src/test/java'), oldPackage, identity.maven.packageName);
}

async function materializeFastapi(application, directory) {
  const identity = application.identity;
  await replaceKnown(join(directory, 'pyproject.toml'), [
    ['name = "enistere-api-fastapi-core"', `name = ${JSON.stringify(identity.python.distributionName)}`],
  ]);
  await replaceKnown(join(directory, 'app/main.py'), [
    ['title="Enistere FastAPI Core"', `title=${JSON.stringify(identity.displayName)}`],
  ]);
  for (const path of await filesUnder(directory, new Set(['.py']))) {
    const value = await readFile(path, 'utf8');
    if (value.includes('api-fastapi-core')) {
      await writeFile(path, value.split('api-fastapi-core').join(identity.serviceName));
    }
  }
}

async function materializeFlutter(application, directory) {
  const identity = application.identity;
  await replaceKnown(join(directory, 'pubspec.yaml'), [
    ['name: mobile_flutter', `name: ${identity.dart.packageName}`],
  ]);
  for (const path of await filesUnder(directory, new Set(['.dart']))) {
    let value = await readFile(path, 'utf8');
    value = value.split('package:mobile_flutter/').join(`package:${identity.dart.packageName}/`);
    await writeFile(path, value);
  }
  await replaceKnown(join(directory, 'lib/app.dart'), [["title: 'Enistere'", `title: ${JSON.stringify(identity.displayName)}`]]);
  await replaceKnown(join(directory, 'lib/src/core/navigation/home_screen.dart'), [
    ["const Text('Enistere')", `const Text(${JSON.stringify(identity.displayName)})`],
  ]);
  await replaceKnown(join(directory, 'test/home_screen_test.dart'), [
    ["find.text('Enistere')", `find.text(${JSON.stringify(identity.displayName)})`],
  ]);
  await replaceKnown(join(directory, 'android/app/build.gradle.kts'), [
    ['namespace = "com.enistere.mobile_flutter"', `namespace = ${JSON.stringify(identity.android.namespace)}`],
    ['applicationId = "com.enistere.mobile_flutter"', `applicationId = ${JSON.stringify(identity.android.applicationId)}`],
  ]);
  await replaceKnown(join(directory, 'android/app/src/main/AndroidManifest.xml'), [
    ['android:label="mobile_flutter"', `android:label=${JSON.stringify(identity.android.label)}`],
  ]);
  const oldPackage = 'com.enistere.mobile_flutter';
  const kotlinRoot = join(directory, 'android/app/src/main/kotlin');
  const oldDirectory = join(kotlinRoot, ...oldPackage.split('.'));
  const newDirectory = join(kotlinRoot, ...identity.android.namespace.split('.'));
  const activity = join(oldDirectory, 'MainActivity.kt');
  await replaceKnown(activity, [[`package ${oldPackage}`, `package ${identity.android.namespace}`]]);
  await mkdir(newDirectory, { recursive: true });
  await rename(activity, join(newDirectory, 'MainActivity.kt'));
  await rm(join(kotlinRoot, 'com'), { recursive: true, force: true });
}

const MATERIALIZERS = {
  nestjs: materializeNestjs,
  spring: materializeSpring,
  fastapi: materializeFastapi,
  nextjs: materializeNextjs,
  angular: materializeAngular,
  'react-native': materializeExpo,
  flutter: materializeFlutter,
};

/** Applies plan-owned identities after overlays, before dependency closure and inventory. */
export async function materializeApplicationIdentities(plan, output) {
  for (const application of plan.applications) {
    const materialize = MATERIALIZERS[application.runtime];
    if (!materialize) throw new Error(`No identity materializer for ${application.runtime}`);
    await materialize(application, join(output, application.appDir));
  }
}
