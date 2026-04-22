import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, cpSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { watch } from 'chokidar';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator, GeneratedLineMapEntry } from './codegen.js';
import { TranspileError, formatMappedError } from './errors.js';

// Parse CLI args: strip `--device <value>` from anywhere, then interpret
// positional args. For `run`, the first positional after `run` can be a target
// keyword (`ios` / `android` / `macos`); otherwise it (or the next one) is the .igni file.
// For `build`, the first positional is the build target (`macos` / `apk` / `web`).
type Target = 'web' | 'ios' | 'android' | 'macos';
type BuildTarget = 'macos' | 'apk' | 'web';
const { command, target, buildTarget, commandArg, deviceFlag } = (() => {
  const raw = process.argv.slice(2);
  const clean: string[] = [];
  let device: string | undefined;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '--device') { device = raw[i + 1]; i++; continue; }
    clean.push(raw[i]);
  }
  const cmd = clean[0];
  let tgt: Target = 'web';
  let buildTgt: BuildTarget | undefined;
  let arg: string | undefined = clean[1];
  if (cmd === 'run' && (arg === 'ios' || arg === 'android' || arg === 'macos')) {
    tgt = arg as Target;
    arg = clean[2];
  }
  if (cmd === 'build' && (arg === 'macos' || arg === 'apk' || arg === 'web')) {
    buildTgt = arg as BuildTarget;
    arg = clean[2];
  }
  return { command: cmd, target: tgt, buildTarget: buildTgt, commandArg: arg, deviceFlag: device };
})();

const cwd = process.cwd();
const igniDir = join(cwd, '.igni');

interface SourceFileInfo {
  file: string;
  source: string;
  startLine: number;
  endLine: number;
}

interface TranspileResult {
  dart: string;
  lineMap: GeneratedLineMapEntry[];
  sourceFiles: SourceFileInfo[];
}

function printUsage(): void {
  console.log('Usage: igni <command>');
  console.log('  igni run              Run app.igni in Chrome (default)');
  console.log('  igni run hello.igni   Run a specific file in Chrome');
  console.log('  igni run ios          Run app.igni on iOS simulator');
  console.log('  igni run android      Run app.igni on Android emulator');
  console.log('  igni run macos        Run app.igni as a macOS desktop app');
  console.log('  igni run ios --device "iPhone 17"       Target a specific iOS device');
  console.log('  igni run android --device "Pixel 8a"    Target a specific Android device');
  console.log('  igni build macos      Build a standalone macOS .app in dist/');
  console.log('  igni build apk        Build a standalone Android .apk in dist/');
  console.log('  igni build web        Build a static web bundle in dist/web/');
  console.log('  igni new my-app       Create a new Igni app');
}

// --- Find .igni files ---

function findIgniFiles(): string[] {
  const entries = readdirSync(cwd);
  const files = entries.filter(f => {
    if (!f.endsWith('.igni') || f.startsWith('.')) return false;
    try { return statSync(join(cwd, f)).isFile(); } catch { return false; }
  });
  if (files.length === 0) {
    console.error('No .igni files found in current directory.');
    process.exit(1);
  }

  // Determine entry point
  const entry = commandArg || 'app.igni';
  if (!files.includes(entry)) {
    if (commandArg) {
      console.error(`File not found: ${entry}`);
    } else {
      console.error('No app.igni found. Create one or specify a file: igni run hello.igni');
    }
    process.exit(1);
  }

  const rest = files.filter(f => f !== entry).sort();
  return [entry, ...rest];
}

// --- Transpile ---

function buildSourceFiles(files: string[]): SourceFileInfo[] {
  let nextStartLine = 1;
  return files.map((file) => {
    const source = readFileSync(join(cwd, file), 'utf-8');
    const lineCount = source.split('\n').length;
    const info = {
      file,
      source,
      startLine: nextStartLine,
      endLine: nextStartLine + lineCount - 1,
    };
    nextStartLine = info.endLine + 3;
    return info;
  });
}

function combinedSource(sourceFiles: SourceFileInfo[]): string {
  return sourceFiles.map(file => file.source).join('\n\n');
}

function resolveSourceLocation(sourceFiles: SourceFileInfo[], line: number, column: number, context?: string) {
  const file = sourceFiles.find(info => line >= info.startLine && line <= info.endLine);
  if (!file) {
    return {
      file: undefined,
      line,
      column,
      sourceLine: '',
      context,
    };
  }

  const localLine = line - file.startLine + 1;
  const sourceLine = file.source.split('\n')[localLine - 1] ?? '';
  return {
    file: file.file,
    line: localLine,
    column,
    sourceLine,
    context,
  };
}

function printTranspileError(err: TranspileError, sourceFiles: SourceFileInfo[]): void {
  const location = resolveSourceLocation(sourceFiles, err.line, err.column);
  process.stderr.write(formatMappedError(err.message, location));
}

function transpile(): TranspileResult | null {
  const files = findIgniFiles();
  const sourceFiles = buildSourceFiles(files);
  const combined = combinedSource(sourceFiles);

  try {
    const tokens = new Lexer(combined).tokenize();
    const ast = new Parser(tokens).parse();
    const generated = new CodeGenerator().generateWithSourceMap(ast);
    return { dart: generated.dart, lineMap: generated.lineMap, sourceFiles };
  } catch (err: any) {
    if (err instanceof TranspileError) {
      printTranspileError(err, sourceFiles);
    } else {
      console.error(`\n  Error: ${err.message}\n`);
    }
    return null;
  }
}

function writeOutput(dart: string): void {
  const outPath = join(igniDir, 'lib', 'main.dart');
  writeFileSync(outPath, dart);
}

// --- Flutter project setup ---

function ensureFlutterProject(targetPlatform: Target): void {
  try {
    execSync('flutter --version', { stdio: 'ignore' });
  } catch {
    console.error('Igni requires Flutter. Install it from https://flutter.dev');
    process.exit(1);
  }

  const projectName = basename(cwd).toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'igni_app';
  const firstRun = !existsSync(join(igniDir, 'pubspec.yaml'));
  // Flutter creates platform-named subdirs (web/, ios/, android/) when a platform
  // is included. Their presence is a reliable "is this platform already set up?" check.
  const platformPresent = existsSync(join(igniDir, targetPlatform));

  if (firstRun) {
    execSync(`flutter create .igni --org com.igni --platforms ${targetPlatform} --project-name ${projectName}`, {
      cwd,
      stdio: 'ignore',
    });
    const testDir = join(igniDir, 'test');
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });

    const gitignore = join(cwd, '.gitignore');
    if (existsSync(gitignore)) {
      const content = readFileSync(gitignore, 'utf-8');
      if (!content.includes('.igni/')) {
        writeFileSync(gitignore, content.trimEnd() + '\n.igni/\n');
      }
    }
  } else if (!platformPresent) {
    // Subsequent run with a new target — add the platform without wiping existing ones.
    // `flutter create .` is idempotent for platform addition.
    execSync(`flutter create . --platforms ${targetPlatform}`, {
      cwd: igniDir,
      stdio: 'ignore',
    });
  }

  // Web-only: apply Igni branding (tab title + favicon) when web/ dir appears for the first time.
  if (targetPlatform === 'web' && (firstRun || !platformPresent)) {
    applyWebBranding();
  }
}

function applyWebBranding(): void {
  const indexPath = join(igniDir, 'web', 'index.html');
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, 'utf-8');
    const displayName = basename(cwd);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${displayName}</title>`);
    writeFileSync(indexPath, html);
  }

  const igniIcon = join(__dirname, '..', '..', 'assets', 'igni.svg');
  const faviconPath = join(igniDir, 'web', 'favicon.png');
  if (existsSync(igniIcon) && existsSync(faviconPath)) {
    const indexForFavicon = join(igniDir, 'web', 'index.html');
    if (existsSync(indexForFavicon)) {
      let html = readFileSync(indexForFavicon, 'utf-8');
      html = html.replace(
        /<link rel="icon" type="image\/png" href="favicon\.png"\s*\/?>/,
        '<link rel="icon" type="image/svg+xml" href="favicon.svg">'
      );
      writeFileSync(indexForFavicon, html);
      copyFileSync(igniIcon, join(igniDir, 'web', 'favicon.svg'));
    }
  }
}

// --- Device selection for mobile targets ---

interface FlutterDevice {
  name: string;
  id: string;
  targetPlatform: string;
  emulator: boolean;
}

interface FlutterEmulator {
  id: string;
  name: string;
  platform: string; // 'ios' | 'android' | ...
}

function matchesTarget(targetPlatform: string, target: 'ios' | 'android' | 'macos'): boolean {
  if (target === 'ios') return targetPlatform === 'ios';
  if (target === 'macos') return targetPlatform === 'darwin';
  // Android devices show targetPlatform like "android-arm64"
  return targetPlatform.startsWith('android');
}

function listRunningDevices(target: 'ios' | 'android' | 'macos'): FlutterDevice[] {
  try {
    const output = execSync('flutter devices --machine', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const all = JSON.parse(output) as FlutterDevice[];
    return all.filter(d => matchesTarget(d.targetPlatform, target));
  } catch {
    return [];
  }
}

function listAvailableEmulators(target: 'ios' | 'android' | 'macos'): FlutterEmulator[] {
  // Desktop targets have no emulators — it's always the host machine.
  if (target === 'macos') return [];
  try {
    const output = execSync('flutter emulators', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const emulators: FlutterEmulator[] = [];
    for (const line of output.split('\n')) {
      const parts = line.split('•').map(p => p.trim());
      if (parts.length !== 4) continue;
      if (parts[0] === 'Id' || !parts[0] || parts[0].startsWith('-')) continue;
      emulators.push({ id: parts[0], name: parts[1], platform: parts[3] });
    }
    return emulators.filter(e => e.platform === target);
  } catch {
    return [];
  }
}

async function pickDevice(target: 'ios' | 'android' | 'macos', explicitDevice: string | undefined): Promise<string> {
  const running = listRunningDevices(target);

  // Desktop macOS: the host is always "running" as a Flutter device. No emulator
  // step, no --device ambiguity. Just return the first match; in practice there's
  // only ever one.
  if (target === 'macos') {
    if (running.length === 0) {
      console.error('No macOS device detected. Run `flutter doctor` to check desktop support.');
      process.exit(1);
    }
    return running[0].id;
  }

  if (explicitDevice) {
    const needle = explicitDevice.toLowerCase();
    const match = running.find(d =>
      d.name.toLowerCase() === needle ||
      d.id.toLowerCase() === needle ||
      d.name.toLowerCase().includes(needle)
    );
    if (match) return match.id;
    console.error(`No running ${target} device matching "${explicitDevice}".`);
    if (running.length > 0) {
      console.error('Running devices:');
      for (const d of running) console.error(`  ${d.name} (${d.id})`);
    }
    const emus = listAvailableEmulators(target);
    if (emus.length > 0) {
      console.error(`Or boot an emulator first:`);
      for (const e of emus) console.error(`  flutter emulators --launch ${e.id}`);
    }
    process.exit(1);
  }

  if (running.length === 1) return running[0].id;

  if (running.length > 1) {
    console.error(`Multiple ${target} devices are running. Pick one:`);
    console.error(`  igni run ${target} --device "<name>"`);
    console.error('');
    for (const d of running) console.error(`  ${d.name} (${d.id})`);
    process.exit(1);
  }

  // No running device — auto-boot the first available emulator.
  const emulators = listAvailableEmulators(target);
  if (emulators.length === 0) {
    const where = target === 'ios' ? 'Xcode' : 'Android Studio';
    console.error(`No ${target} device or emulator found. Create one via ${where}.`);
    process.exit(1);
  }

  const firstEmulator = emulators[0];
  console.log(`Booting ${firstEmulator.name}...`);
  try {
    execSync(`flutter emulators --launch ${firstEmulator.id}`, { stdio: 'ignore' });
  } catch {
    console.error(`Failed to boot ${firstEmulator.name}.`);
    process.exit(1);
  }

  // Poll until the emulator registers as a running device. iOS sims take longer
  // than Android on Apple Silicon — a 2-minute ceiling covers both.
  const timeoutMs = 120_000;
  const pollMs = 2000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, pollMs));
    const devices = listRunningDevices(target);
    if (devices.length > 0) return devices[0].id;
  }

  console.error(`Timed out waiting for ${firstEmulator.name} to boot.`);
  process.exit(1);
}

// --- Image assets ---

function syncImages(): void {
  const imagesDir = join(cwd, 'images');
  const assetsDir = join(igniDir, 'assets');

  if (!existsSync(imagesDir)) return;

  mkdirSync(assetsDir, { recursive: true });

  const files = readdirSync(imagesDir).filter(f => {
    try { return statSync(join(imagesDir, f)).isFile(); } catch { return false; }
  });

  for (const file of files) {
    copyFileSync(join(imagesDir, file), join(assetsDir, file));
  }

  if (files.length > 0) {
    const pubspecPath = join(igniDir, 'pubspec.yaml');
    let pubspec = readFileSync(pubspecPath, 'utf-8');
    if (!pubspec.includes('  assets:')) {
      pubspec = pubspec.replace(
        /(\s*uses-material-design:\s*true)/,
        '$1\n\n  assets:\n    - assets/'
      );
      writeFileSync(pubspecPath, pubspec);
    }
  }
}

// --- Audio assets ---

function syncAudio(): void {
  const audioDir = join(cwd, 'audio');
  const assetsDir = join(igniDir, 'assets');

  if (!existsSync(audioDir)) return;

  mkdirSync(assetsDir, { recursive: true });

  const files = readdirSync(audioDir).filter(f => {
    try { return statSync(join(audioDir, f)).isFile(); } catch { return false; }
  });

  for (const file of files) {
    copyFileSync(join(audioDir, file), join(assetsDir, file));
  }

  if (files.length > 0) {
    // Ensure assets section exists
    const pubspecPath = join(igniDir, 'pubspec.yaml');
    let pubspec = readFileSync(pubspecPath, 'utf-8');
    if (!pubspec.includes('  assets:')) {
      pubspec = pubspec.replace(
        /(\s*uses-material-design:\s*true)/,
        '$1\n\n  assets:\n    - assets/'
      );
    }
    // Ensure audioplayers dependency
    if (!pubspec.includes('audioplayers:')) {
      pubspec = pubspec.replace(
        /(\s*cupertino_icons:[^\n]*)/,
        '$1\n  audioplayers: ^6.1.0'
      );
    }
    writeFileSync(pubspecPath, pubspec);
  }
}

// --- Dependencies ---

function ensureDependencies(dart: string): void {
  const pubspecPath = join(igniDir, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) return;
  let pubspec = readFileSync(pubspecPath, 'utf-8');
  let dirty = false;

  if (dart.includes("package:http/") && !pubspec.includes('http:')) {
    pubspec = pubspec.replace(
      /(\s*cupertino_icons:[^\n]*)/,
      '$1\n  http: ^1.2.0'
    );
    dirty = true;
  }
  if (dart.includes("package:geolocator/") && !pubspec.includes('geolocator:')) {
    pubspec = pubspec.replace(
      /(\s*cupertino_icons:[^\n]*)/,
      '$1\n  geolocator: ^13.0.1'
    );
    dirty = true;
  }
  if (dirty) {
    writeFileSync(pubspecPath, pubspec);
  }
}

function mapGeneratedLine(
  transpileResult: TranspileResult,
  dartLine: number,
  dartColumn: number,
  message: string,
): string | null {
  let entry: GeneratedLineMapEntry | undefined;
  for (const candidate of transpileResult.lineMap) {
    if (candidate.dartLine > dartLine) break;
    entry = candidate;
  }
  if (!entry) return null;

  const location = resolveSourceLocation(
    transpileResult.sourceFiles,
    entry.sourceLine,
    entry.sourceColumn,
    undefined,
  );
  return formatMappedError(message, location);
}

// Framework stack frames (Dart-SDK, Flutter internals) flood the terminal
// on every runtime error. Users don't read them. Filter out by path shape.
function isFrameworkFrame(line: string): boolean {
  return (
    /\bdart-sdk\/lib\//.test(line) ||
    /\bdart:sdk_internal\//.test(line) ||
    /\bpackage:flutter\//.test(line) ||
    /\bpackage:flutter_web_plugins\//.test(line)
  );
}

function printMappedFlutterError(line: string, transpileResult: TranspileResult): boolean {
  // Compile errors:  main.dart:50:12: Message  (or  lib/main.dart:50:12: Message)
  // Runtime frames:  package:learn_igni/main.dart 50:12   someFunction
  //   — note: runtime uses a space separator before line:col and no trailing colon/message.
  const match = line.match(/(?:lib\/|package:[^/]+\/)?main\.dart[:\s](\d+):(\d+):?\s*(.*)/);
  if (!match) return false;

  const dartLine = Number(match[1]);
  const dartColumn = Number(match[2]);
  const message = match[3].trim() || 'runtime error';
  const mapped = mapGeneratedLine(transpileResult, dartLine, dartColumn, message);
  if (!mapped) return false;

  process.stderr.write(mapped);
  return true;
}

function createNewProject(name: string | undefined): void {
  if (!name) {
    console.error('Usage: igni new <project-name>');
    process.exit(1);
  }

  const projectDir = join(cwd, name);
  if (existsSync(projectDir)) {
    console.error(`Directory already exists: ${name}`);
    process.exit(1);
  }

  mkdirSync(projectDir, { recursive: true });
  writeFileSync(
    join(projectDir, 'app.igni'),
    [
      'screen Hello:',
      '  count = 0',
      '',
      '  layout vertical, align: center, gap: medium, padding: large:',
      '    label count, style: heading',
      '    button "Add", on tap: count = count + 1',
      '',
    ].join('\n')
  );
  writeFileSync(join(projectDir, '.gitignore'), '.igni/\n');

  console.log(`Created ${name}\n`);
  console.log('Next:');
  console.log(`  cd ${name}`);
  console.log('  igni run\n');
}

// --- Main ---

async function run(targetPlatform: Target, explicitDevice: string | undefined): Promise<void> {
  const initialResult = transpile();
  if (!initialResult) {
    console.error('Fix the error above, then run igni run again.');
    process.exit(1);
  }
  let transpileResult = initialResult;
  const firstRun = !existsSync(join(igniDir, 'pubspec.yaml'));

  ensureFlutterProject(targetPlatform);
  syncImages();
  syncAudio();
  ensureDependencies(transpileResult.dart);
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(transpileResult.dart);

  // Pick the device BEFORE showing the build spinner — device-pick may auto-boot
  // an emulator (visible "Booting <name>..." output), which is a distinct phase.
  const deviceId = targetPlatform === 'web'
    ? 'chrome'
    : await pickDevice(targetPlatform, explicitDevice);

  const projectName = basename(cwd);
  const firstBuildHint = targetPlatform === 'web'
    ? ' (About 15s the first time)'
    : ' (First build may take a minute or two)';
  const buildHint = firstRun ? firstBuildHint : ' (This may take a few seconds)';
  const buildStart = Date.now();

  // Spinner while the app is building
  let dots = 0;
  const spinnerFrames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  const renderBuild = () => {
    process.stdout.write(`\r\x1b[2K${spinnerFrames[dots % spinnerFrames.length]} Building your app${buildHint}`);
  };
  renderBuild();
  const spinner = setInterval(() => {
    dots = (dots + 1) % spinnerFrames.length;
    renderBuild();
  }, 100);

  // Start flutter run
  const flutter = spawn('flutter', ['run', '-d', deviceId], {
    cwd: igniDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Filter Flutter output — suppress implementation details
  let appReady = false;
  const stderrBuffer: string[] = [];

  flutter.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      // Suppress all Flutter debug noise. Multiple platform-specific lines
      // can mark the app as ready: "Debug service listening" (web),
      // "Dart VM Service on" (macOS/mobile), "Flutter run key commands"
      // (universal fallback, fires once the app is interactive).
      if (
        line.includes('Debug service') ||
        line.includes('Dart VM Service') ||
        line.includes('DevTools') ||
        line.includes('debug mode') ||
        line.includes('linked to the debug service') ||
        line.includes('Launching lib/main.dart') ||
        line.includes('Syncing files to device') ||
        line.includes('merged UI and platform thread') ||
        line.includes('Flutter run key commands') ||
        line.includes('Hot reload') ||
        line.includes('Hot restart') ||
        line.includes('interactive commands') ||
        line.includes('Detach (terminate') ||
        line.includes('Clear the screen') ||
        line.includes('Quit (terminate') ||
        line.includes('localhost') ||
        line.includes('127.0.0.1')
      ) {
        if (!appReady && (
          line.includes('Debug service listening') ||
          line.includes('Dart VM Service on') ||
          line.includes('Flutter run key commands')
        )) {
          appReady = true;
          clearInterval(spinner);
          process.stdout.write(`\r\x1b[2K✓ ${projectName} ready\n\n`);
          // Flush any errors that arrived during the build
          for (const buffered of stderrBuffer) {
            process.stderr.write(buffered + '\n');
          }
          stderrBuffer.length = 0;
          console.log('Edit app.igni and save to see changes.');
          console.log('Press q to quit.');
        }
        continue;
      }

      // Pass through errors and reload confirmations
      if (
        line.includes('Error') ||
        line.includes('error') ||
        line.includes('Restarted') ||
        line.includes('Reloaded') ||
        line.includes('Application finished')
      ) {
        if (appReady) {
          if (printMappedFlutterError(line, transpileResult)) continue;
          if (isFrameworkFrame(line)) continue;
          console.log(line);
        }
      }
    }
  });

  flutter.stderr.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line) continue;
      if (!appReady) {
        // Buffer stderr during build so it doesn't interrupt the spinner
        if (line.includes('Error') || line.includes('error') || line.includes('Exception')) {
          stderrBuffer.push(line);
        }
        continue;
      }
      if (printMappedFlutterError(line, transpileResult)) continue;
      if (isFrameworkFrame(line)) continue;
      if (line.includes('Error') || line.includes('error') || line.includes('Exception')) {
        process.stderr.write(line + '\n');
      }
    }
  });

  // Forward stdin (for r, R, q)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.on('data', (data: Buffer) => {
    const key = data.toString();
    if (key === 'q' || key === '\u0003') {
      flutter.kill();
      process.exit(0);
    }
    flutter.stdin.write(data);
  });

  // Watch .igni files — watch each file individually for reliability
  const igniFiles = findIgniFiles().map(f => join(cwd, f));
  const watcher = watch(igniFiles, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  watcher.on('ready', () => {
    // Watcher ready — no output needed, building animation is already showing
  });

  watcher.on('change', (filePath) => {
    const result = transpile();
    if (result) {
      transpileResult = result;
      writeOutput(result.dart);
      // Send 'R' to Flutter to trigger hot restart (not 'r' hot reload).
      // Hot reload keeps the existing State instance and its field values,
      // so changing `name = "Michael"` to `name = "Tyr"` (or adding a new
      // field) leaves the running app with stale state. Hot restart is
      // slightly slower but always shows the edited source faithfully —
      // which is the pedagogical promise of the tutorial.
      flutter.stdin.write('R');
      console.log(`  Recompiled (${basename(filePath)})`);
    }
  });

  flutter.on('close', (code) => {
    watcher.close();
    process.exit(code ?? 0);
  });
}

// --- Build (standalone artifacts) ---

// `igni build` produces a distributable artifact with zero runtime dependency
// on the igni toolchain. Output always lands in ./dist/ so users have one
// predictable location to share from.
const BUILD_TARGET_PLATFORM: Record<BuildTarget, Target> = {
  macos: 'macos',
  apk: 'android',
  web: 'web',
};

function copyBuildArtifact(buildTarget: BuildTarget, projectName: string): string {
  const distDir = join(cwd, 'dist');
  mkdirSync(distDir, { recursive: true });

  if (buildTarget === 'macos') {
    const releaseDir = join(igniDir, 'build', 'macos', 'Build', 'Products', 'Release');
    const apps = existsSync(releaseDir)
      ? readdirSync(releaseDir).filter(f => f.endsWith('.app'))
      : [];
    if (apps.length === 0) {
      throw new Error(`No .app found in ${releaseDir}.`);
    }
    const src = join(releaseDir, apps[0]);
    const dst = join(distDir, apps[0]);
    rmSync(dst, { recursive: true, force: true });
    cpSync(src, dst, { recursive: true });
    return dst;
  }

  if (buildTarget === 'apk') {
    const src = join(igniDir, 'build', 'app', 'outputs', 'flutter-apk', 'app-release.apk');
    if (!existsSync(src)) {
      throw new Error(`No APK found at ${src}.`);
    }
    const dst = join(distDir, `${projectName}.apk`);
    copyFileSync(src, dst);
    return dst;
  }

  // web
  const src = join(igniDir, 'build', 'web');
  if (!existsSync(src)) {
    throw new Error(`No web bundle found at ${src}.`);
  }
  const dst = join(distDir, 'web');
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
  return dst;
}

function printShareFooter(buildTarget: BuildTarget, artifactPath: string): void {
  const rel = artifactPath.startsWith(cwd + '/') ? artifactPath.slice(cwd.length + 1) : artifactPath;
  console.log('');
  console.log(`✓ Built ${rel}`);
  console.log('');
  if (buildTarget === 'macos') {
    console.log('Double-click to launch. The app is unsigned — on first run, right-click →');
    console.log('Open and confirm the security dialog. To share, zip the .app:');
    console.log(`  zip -r ${basename(artifactPath)}.zip ${rel}`);
  } else if (buildTarget === 'apk') {
    console.log('Airdrop the .apk to your phone, or email it to yourself, then tap to');
    console.log('install. You may need to enable "Install unknown apps" for your file');
    console.log('manager in Android settings.');
  } else {
    console.log('Serve the folder with any static host, e.g.:');
    console.log(`  npx serve ${rel}`);
  }
  console.log('');
}

async function build(buildTgt: BuildTarget): Promise<void> {
  const initialResult = transpile();
  if (!initialResult) {
    console.error('Fix the error above, then run igni build again.');
    process.exit(1);
  }

  const platform = BUILD_TARGET_PLATFORM[buildTgt];
  ensureFlutterProject(platform);
  syncImages();
  syncAudio();
  ensureDependencies(initialResult.dart);
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(initialResult.dart);

  const projectName = basename(cwd);

  // Spinner while the release build compiles. `flutter build --release` can
  // take several minutes on a cold cache, especially for macOS (cocoapods +
  // xcodebuild) and Android (gradle). Keep the UI calm.
  let dots = 0;
  const spinnerFrames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  const render = () => {
    process.stdout.write(`\r\x1b[2K${spinnerFrames[dots % spinnerFrames.length]} Building release ${buildTgt} for ${projectName} (may take a few minutes)`);
  };
  render();
  const spinner = setInterval(() => {
    dots = (dots + 1) % spinnerFrames.length;
    render();
  }, 100);

  const flutter = spawn('flutter', ['build', buildTgt, '--release'], {
    cwd: igniDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Buffer all Flutter output; we only show it if the build fails, so the
  // happy path is quiet except for the spinner and the final ✓ line.
  const logBuffer: string[] = [];
  flutter.stdout.on('data', (data: Buffer) => logBuffer.push(data.toString()));
  flutter.stderr.on('data', (data: Buffer) => logBuffer.push(data.toString()));

  const exitCode: number = await new Promise((resolve) => {
    flutter.on('close', (code) => resolve(code ?? 1));
  });
  clearInterval(spinner);
  process.stdout.write('\r\x1b[2K');

  if (exitCode !== 0) {
    console.error(`✗ flutter build ${buildTgt} exited with code ${exitCode}`);
    console.error('');
    process.stderr.write(logBuffer.join(''));
    process.exit(exitCode);
  }

  try {
    const artifactPath = copyBuildArtifact(buildTgt, projectName);
    printShareFooter(buildTgt, artifactPath);
  } catch (err: any) {
    console.error(`✗ Build completed but artifact could not be copied: ${err.message}`);
    process.exit(1);
  }
}

if (command === 'run') {
  if (deviceFlag && (target === 'web' || target === 'macos')) {
    console.error('--device is only valid with `igni run ios` or `igni run android`.');
    process.exit(1);
  }
  run(target, deviceFlag);
} else if (command === 'build') {
  if (!buildTarget) {
    console.error('Usage: igni build <macos|apk|web>');
    process.exit(1);
  }
  build(buildTarget);
} else if (command === 'new') {
  createNewProject(commandArg);
} else {
  printUsage();
  process.exit(1);
}
