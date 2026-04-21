import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { watch } from 'chokidar';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator, GeneratedLineMapEntry } from './codegen.js';
import { TranspileError, formatMappedError } from './errors.js';

const command = process.argv[2];
const commandArg = process.argv[3];

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
  console.log('  igni run              Run app.igni (default entry point)');
  console.log('  igni run hello.igni   Run a specific file');
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

function ensureFlutterProject(): void {
  if (existsSync(join(igniDir, 'pubspec.yaml'))) return;

  try {
    execSync('flutter --version', { stdio: 'ignore' });
  } catch {
    console.error('Igni requires Flutter. Install it from https://flutter.dev');
    process.exit(1);
  }

  const projectName = basename(cwd).toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'igni_app';
  execSync(`flutter create .igni --org com.igni --platforms web --project-name ${projectName}`, {
    cwd,
    stdio: 'ignore',
  });

  const testDir = join(igniDir, 'test');
  if (existsSync(testDir)) rmSync(testDir, { recursive: true });

  // Set tab title to project name
  const indexPath = join(igniDir, 'web', 'index.html');
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, 'utf-8');
    const displayName = basename(cwd);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${displayName}</title>`);
    writeFileSync(indexPath, html);
  }

  // Replace Flutter favicon with Igni icon
  const igniIcon = join(__dirname, '..', '..', 'assets', 'igni.svg');
  const faviconPath = join(igniDir, 'web', 'favicon.png');
  if (existsSync(igniIcon) && existsSync(faviconPath)) {
    // Use SVG favicon instead of PNG
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

  const gitignore = join(cwd, '.gitignore');
  if (existsSync(gitignore)) {
    const content = readFileSync(gitignore, 'utf-8');
    if (!content.includes('.igni/')) {
      writeFileSync(gitignore, content.trimEnd() + '\n.igni/\n');
    }
  }
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
    `Mapped from generated Dart line ${dartLine}:${dartColumn} (${entry.context})`,
  );
  return formatMappedError(message, location);
}

function printMappedFlutterError(line: string, transpileResult: TranspileResult): boolean {
  const match = line.match(/(?:lib\/)?main\.dart:(\d+):(\d+):\s*(.*)/);
  if (!match) return false;

  const dartLine = Number(match[1]);
  const dartColumn = Number(match[2]);
  const message = match[3].trim() || 'Generated Dart error';
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

async function run(): Promise<void> {
  const initialResult = transpile();
  if (!initialResult) {
    console.error('Fix the error above, then run igni run again.');
    process.exit(1);
  }
  let transpileResult = initialResult;
  const firstRun = !existsSync(join(igniDir, 'pubspec.yaml'));

  ensureFlutterProject();
  syncImages();
  syncAudio();
  ensureDependencies(transpileResult.dart);
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(transpileResult.dart);

  const projectName = basename(cwd);
  const buildHint = firstRun ? " (About 15s the first time)" : " (This may take a few seconds)";
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
  const flutter = spawn('flutter', ['run', '-d', 'chrome'], {
    cwd: igniDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Filter Flutter output — suppress implementation details
  let appReady = false;
  const stderrBuffer: string[] = [];

  flutter.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      // Suppress all Flutter debug noise, but use the first debug service
      // line as the "app ready" signal — it only appears after the build
      // finishes and the browser is actually open
      if (
        line.includes('Debug service') ||
        line.includes('Dart VM Service') ||
        line.includes('DevTools') ||
        line.includes('debug mode') ||
        line.includes('linked to the debug service') ||
        line.includes('Launching lib/main.dart') ||
        line.includes('localhost') ||
        line.includes('127.0.0.1')
      ) {
        if (!appReady && line.includes('Debug service listening')) {
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
          if (!printMappedFlutterError(line, transpileResult)) {
            console.log(line);
          }
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

if (command === 'run') {
  run();
} else if (command === 'new') {
  createNewProject(commandArg);
} else {
  printUsage();
  process.exit(1);
}
