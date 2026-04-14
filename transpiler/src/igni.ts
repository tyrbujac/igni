import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { watch } from 'chokidar';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator } from './codegen.js';
import { TranspileError, formatError } from './errors.js';

const command = process.argv[2];
const explicitFile = process.argv[3]; // optional: igni run myfile.igni

if (command !== 'run') {
  console.log('Usage: igni run [file.igni]');
  console.log('  igni run              Run app.igni (default entry point)');
  console.log('  igni run hello.igni   Run a specific file');
  process.exit(1);
}

const cwd = process.cwd();
const igniDir = join(cwd, '.igni');

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
  const entry = explicitFile || 'app.igni';
  if (!files.includes(entry)) {
    if (explicitFile) {
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

function transpile(): string | null {
  const files = findIgniFiles();
  const sources = files.map(f => readFileSync(join(cwd, f), 'utf-8'));
  const combined = sources.join('\n\n');

  try {
    const tokens = new Lexer(combined).tokenize();
    const ast = new Parser(tokens).parse();
    const dart = new CodeGenerator().generate(ast);
    return dart;
  } catch (err: any) {
    if (err instanceof TranspileError) {
      process.stderr.write(formatError(err, combined));
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

  console.log('Setting up Igni project...');

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

  console.log('Igni project created.\n');
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

  if (dart.includes("package:http/") && !pubspec.includes('http:')) {
    pubspec = pubspec.replace(
      /(\s*cupertino_icons:[^\n]*)/,
      '$1\n  http: ^1.2.0'
    );
    writeFileSync(pubspecPath, pubspec);
  }
}

// --- Main ---

async function run(): Promise<void> {
  const dart = transpile();
  if (!dart) {
    console.error('Fix the error above, then run igni run again.');
    process.exit(1);
  }

  ensureFlutterProject();
  syncImages();
  syncAudio();
  ensureDependencies(dart);
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(dart);

  const projectName = basename(cwd);
  const buildStart = Date.now();

  // Dot animation while building
  let dots = 0;
  const spinner = setInterval(() => {
    dots = (dots % 3) + 1;
    process.stdout.write(`\r  Building${'.'.repeat(dots)}${' '.repeat(3 - dots)}`);
  }, 500);
  process.stdout.write('  Building.');

  // Start flutter run
  const flutter = spawn('flutter', ['run', '-d', 'chrome'], {
    cwd: igniDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Filter Flutter output — suppress implementation details
  let appReady = false;
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
          const elapsed = ((Date.now() - buildStart) / 1000).toFixed(1);
          process.stdout.write(`\r  ${projectName} ready (${elapsed}s)\n\n`);
          console.log('  Press r to reload, q to quit.\n');
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
          console.log(line);
        }
      }
    }
  });

  flutter.stderr.on('data', (data: Buffer) => {
    const line = data.toString();
    if (line.includes('Error') || line.includes('error') || line.includes('Exception')) {
      process.stderr.write(line);
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
      writeOutput(result);
      // Send 'r' to Flutter to trigger hot reload
      flutter.stdin.write('r');
      console.log(`  Recompiled (${basename(filePath)})`);
    }
  });

  flutter.on('close', (code) => {
    watcher.close();
    process.exit(code ?? 0);
  });
}

run();
