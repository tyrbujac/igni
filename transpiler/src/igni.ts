import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { watch } from 'chokidar';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator } from './codegen.js';

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
    console.error(`\n  Transpile error: ${err.message}\n`);
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

  console.log('Setting up Flutter project...');

  try {
    execSync('flutter --version', { stdio: 'ignore' });
  } catch {
    console.error('Flutter not found. Install it from https://flutter.dev');
    process.exit(1);
  }

  const projectName = basename(cwd).toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'igni_app';
  execSync(`flutter create .igni --org com.igni --platforms web --project-name ${projectName}`, {
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

  console.log('Flutter project created.\n');
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
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(dart);

  console.log('Starting...\n');

  // Start flutter run
  const flutter = spawn('flutter', ['run', '-d', 'chrome'], {
    cwd: igniDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Filter Flutter output
  flutter.stdout.on('data', (data: Buffer) => {
    const line = data.toString();
    if (
      line.includes('localhost') ||
      line.includes('127.0.0.1') ||
      line.includes('Error') ||
      line.includes('error') ||
      line.includes('Restarted') ||
      line.includes('Reloaded') ||
      line.includes('ready') ||
      line.includes('lib/main.dart') ||
      line.includes('Application finished')
    ) {
      process.stdout.write(line);
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
    console.log(`Watching ${igniFiles.length} file(s) for changes...\n`);
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
