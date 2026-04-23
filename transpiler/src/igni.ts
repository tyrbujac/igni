import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, cpSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';
import { createServer as createHttpServer, ServerResponse, Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { watch } from 'chokidar';
import sharp from 'sharp';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator, GeneratedLineMapEntry } from './codegen.js';
import { TranspileError, formatMappedError } from './errors.js';

// Parse CLI args: strip `--device <value>` and `--name <value>` from anywhere,
// then interpret positional args. For `run`, the first positional after `run`
// can be a target keyword (`ios` / `android` / `macos`); otherwise it (or the
// next one) is the .igni file. For `build`, the first positional is the build
// target (`macos` / `apk` / `web`).
type Target = 'web' | 'ios' | 'android' | 'macos';
type BuildTarget = 'macos' | 'apk' | 'web';
type WebMode = 'chrome' | 'serve';
const { command, target, webMode, buildTarget, commandArg, deviceFlag, nameFlag } = (() => {
  const raw = process.argv.slice(2);
  const clean: string[] = [];
  let device: string | undefined;
  let name: string | undefined;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '--device') { device = raw[i + 1]; i++; continue; }
    if (raw[i] === '--name') { name = raw[i + 1]; i++; continue; }
    clean.push(raw[i]);
  }
  const cmd = clean[0];
  let tgt: Target = 'web';
  let wMode: WebMode = 'chrome';
  let buildTgt: BuildTarget | undefined;
  let arg: string | undefined = clean[1];
  if (cmd === 'run' && (arg === 'ios' || arg === 'android' || arg === 'macos')) {
    tgt = arg as Target;
    arg = clean[2];
  } else if (cmd === 'run' && arg === 'localhost') {
    tgt = 'web';
    wMode = 'serve';
    arg = clean[2];
  }
  if (cmd === 'build' && (arg === 'macos' || arg === 'apk' || arg === 'web')) {
    buildTgt = arg as BuildTarget;
    arg = clean[2];
  }
  return { command: cmd, target: tgt, webMode: wMode, buildTarget: buildTgt, commandArg: arg, deviceFlag: device, nameFlag: name };
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
  console.log('  igni run localhost    Serve on localhost, open the URL in any browser');
  console.log('  igni run ios          Run app.igni on iOS simulator');
  console.log('  igni run android      Run app.igni on Android emulator');
  console.log('  igni run macos        Run app.igni as a macOS desktop app');
  console.log('  igni run ios --device "iPhone 17"       Target a specific iOS device');
  console.log('  igni run android --device "Pixel 8a"    Target a specific Android device');
  console.log('  igni build macos      Build a standalone macOS .app in dist/');
  console.log('  igni build apk        Build a standalone Android .apk in dist/');
  console.log('  igni build web        Build a static web bundle in dist/web/');
  console.log('  igni run --name "Dice Roller"           Override the app display name');
  console.log('  igni build macos --name "Dice Roller"   Same, for release builds');
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

// Inject `title: '<displayName>'` into the generated top-level `MaterialApp(...)`.
// Flutter's web runtime rewrites `document.title` to the `MaterialApp.title` value
// once the app boots; without this, Chrome falls back to showing the URL in the tab
// (e.g. `localhost:51169`). The same field is also surfaced in the Android task
// switcher and macOS Cmd-Tab, so one write aligns every platform's task-switcher
// label with the manifest names applied in `applyAppIdentity`.
//
// The replacement targets the first `MaterialApp(` in the generated source. Codegen
// emits exactly one top-level MaterialApp per program (main()'s runApp), and Igni
// source can't author a nested MaterialApp, so the first match is always the root.
// Happens in `igni.ts` rather than codegen so the 54 diff-test fixtures in
// `examples/*.expected.dart` stay unchanged — `run-tests.sh` invokes `cli.ts` which
// doesn't apply this post-processing.
function injectAppTitle(dart: string, displayName: string): string {
  const escaped = displayName
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\$/g, '\\$');
  return dart.replace(/MaterialApp\(/, `MaterialApp(title: '${escaped}', `);
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
    // A newly-added platform has Flutter-default icons. Invalidate the icon
    // stamp so the next syncAppIcon pass populates the new platform's files.
    const iconStamp = join(igniDir, '.icon-stamp');
    if (existsSync(iconStamp)) rmSync(iconStamp);
  }

}

// --- App identity (display name + eventually icon) ---

// Turn a folder basename into a human-readable display name. Splits on
// `-`, `_`, and camelCase boundaries; title-cases each token; joins with
// spaces. Examples: `dicee` → `Dicee`, `dice-roller` → `Dice Roller`,
// `DiceRoller` → `Dice Roller`, `my_cool_app` → `My Cool App`.
function prettifyName(folder: string): string {
  const withSpaces = folder
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!withSpaces) return folder;
  return withSpaces
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Write the app's display name + icon into every platform manifest and
// asset directory that exists. Idempotent on both sides: manifest writes
// skip when the current value already matches; icon sync skips when the
// source file's mtime hasn't changed since the last run.
async function applyAppIdentity(displayName: string): Promise<void> {
  writeMacOSDisplayName(displayName);
  writeIOSDisplayName(displayName);
  writeAndroidDisplayName(displayName);
  applyWebBranding(displayName);
  await syncAppIcon();
}

// macOS splits the display name across two fields:
//   PRODUCT_NAME (xcconfig) → .app filename + executable name. MUST be
//     space-free — Flutter's `flutter run -d macos` shells out to `open
//     path/to/name.app` without quoting, so spaces in the path cause
//     "Failed to foreground app; open returned 1" and the window doesn't
//     come to focus on first launch.
//   CFBundleDisplayName (Info.plist) → pretty name shown in Finder,
//     dock, and the menu bar. Spaces and punctuation fine here.
function writeMacOSDisplayName(name: string): void {
  const xcconfig = join(igniDir, 'macos', 'Runner', 'Configs', 'AppInfo.xcconfig');
  const plist = join(igniDir, 'macos', 'Runner', 'Info.plist');
  const productName = name.replace(/\s+/g, '');

  if (existsSync(xcconfig)) {
    const contents = readFileSync(xcconfig, 'utf-8');
    const current = contents.match(/^PRODUCT_NAME\s*=\s*(.+)$/m)?.[1]?.trim();
    if (current !== productName) {
      const updated = contents.replace(/^PRODUCT_NAME\s*=\s*.*$/m, `PRODUCT_NAME = ${productName}`);
      writeFileSync(xcconfig, updated);
    }
  }

  if (existsSync(plist)) {
    let contents = readFileSync(plist, 'utf-8');
    const pretty = escapeXml(name);
    const displayRegex = /(<key>CFBundleDisplayName<\/key>\s*<string>)([^<]*)(<\/string>)/;
    const match = contents.match(displayRegex);
    if (match) {
      if (match[2] !== pretty) {
        contents = contents.replace(displayRegex, `$1${pretty}$3`);
        writeFileSync(plist, contents);
      }
    } else {
      // Insert CFBundleDisplayName right after CFBundleName for canonical ordering.
      const anchor = /(<key>CFBundleName<\/key>\s*<string>\$\(PRODUCT_NAME\)<\/string>\n)/;
      if (anchor.test(contents)) {
        contents = contents.replace(
          anchor,
          `$1\t<key>CFBundleDisplayName</key>\n\t<string>${pretty}</string>\n`
        );
        writeFileSync(plist, contents);
      }
    }
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeIOSDisplayName(name: string): void {
  const plist = join(igniDir, 'ios', 'Runner', 'Info.plist');
  if (!existsSync(plist)) return;
  const contents = readFileSync(plist, 'utf-8');
  const pretty = escapeXml(name);
  const regex = /(<key>CFBundleDisplayName<\/key>\s*<string>)([^<]*)(<\/string>)/;
  const match = contents.match(regex);
  if (!match || match[2] === pretty) return;
  const updated = contents.replace(regex, `$1${pretty}$3`);
  writeFileSync(plist, updated);
}

function writeAndroidDisplayName(name: string): void {
  const manifest = join(igniDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!existsSync(manifest)) return;
  const contents = readFileSync(manifest, 'utf-8');
  const pretty = escapeXml(name);
  const regex = /android:label="([^"]*)"/;
  const match = contents.match(regex);
  if (!match || match[1] === pretty) return;
  const updated = contents.replace(regex, `android:label="${pretty}"`);
  writeFileSync(manifest, updated);
}

function applyWebBranding(displayName: string): void {
  const indexPath = join(igniDir, 'web', 'index.html');
  if (!existsSync(indexPath)) return;
  let html = readFileSync(indexPath, 'utf-8');
  const titleText = escapeXml(displayName);
  const currentTitle = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (currentTitle !== titleText) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${titleText}</title>`);
  }

  // Normalise the favicon link to point at favicon.png (the PNG is what
  // syncAppIcon writes). A prior version of this code swapped the link to
  // an SVG favicon; this un-swap keeps upgrading projects consistent.
  html = html.replace(
    /<link rel="icon" type="image\/svg\+xml" href="favicon\.svg"\s*\/?>/,
    '<link rel="icon" type="image/png" href="favicon.png">'
  );

  writeFileSync(indexPath, html);
}

// --- Browser auto-refresh for `igni run localhost` ---

// Flutter's web-server device doesn't push reload events to connected browsers
// (issue #44974). To match Chrome's save-to-reload DX in Safari/Firefox/Arc we
// run a tiny SSE server alongside `flutter run` and inject a script tag into
// the scaffolded index.html that listens on it. On each `.igni` save we wait
// for Flutter's "Restarted application" stdout line, then broadcast — which
// means the bundle is already rebuilt by the time the browser reloads.

interface ReloadServer {
  port: number;
  broadcast(): void;
  close(): Promise<void>;
}

async function startReloadServer(): Promise<ReloadServer> {
  const clients = new Set<ServerResponse>();
  const server: HttpServer = createHttpServer((req, res) => {
    if (req.url !== '/reload') { res.writeHead(404).end(); return; }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('retry: 2000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    port,
    broadcast() {
      for (const client of clients) {
        try { client.write('data: reload\n\n'); } catch { /* ignore */ }
      }
    },
    async close() {
      for (const client of clients) { try { client.end(); } catch { /* ignore */ } }
      clients.clear();
      await new Promise<void>((r) => server.close(() => r()));
    },
  };
}

const IGNI_RELOAD_START = '<!-- IGNI_RELOAD -->';
const IGNI_RELOAD_END = '<!-- /IGNI_RELOAD -->';
const IGNI_RELOAD_RE = /\s*<!-- IGNI_RELOAD -->[\s\S]*?<!-- \/IGNI_RELOAD -->\s*/g;

function installReloadScript(port: number): void {
  const indexPath = join(igniDir, 'web', 'index.html');
  if (!existsSync(indexPath)) return;
  let html = readFileSync(indexPath, 'utf-8');
  const block = `${IGNI_RELOAD_START}<script>try{new EventSource('http://127.0.0.1:${port}/reload').addEventListener('message',function(){location.reload();});}catch(e){}</script>${IGNI_RELOAD_END}`;
  html = html.replace(IGNI_RELOAD_RE, '');
  html = html.replace('</body>', `  ${block}\n</body>`);
  writeFileSync(indexPath, html);
}

function removeReloadScript(): void {
  const indexPath = join(igniDir, 'web', 'index.html');
  if (!existsSync(indexPath)) return;
  const html = readFileSync(indexPath, 'utf-8');
  if (!IGNI_RELOAD_RE.test(html)) return;
  writeFileSync(indexPath, html.replace(IGNI_RELOAD_RE, ''));
}

// --- App icon sync ---

// Per-platform icon output sets. Each entry is [filename relative to the
// platform's icon directory, pixel size]. Sourced from the Flutter templates
// at `flutter create` time (iOS set is the default Assets.xcassets contents;
// Android density buckets follow the mipmap-* launcher convention; macOS set
// matches the AppIcon.appiconset produced by Flutter's macOS scaffold).
const MACOS_ICON_SIZES: Array<[string, number]> = [
  ['app_icon_16.png', 16],
  ['app_icon_32.png', 32],
  ['app_icon_64.png', 64],
  ['app_icon_128.png', 128],
  ['app_icon_256.png', 256],
  ['app_icon_512.png', 512],
  ['app_icon_1024.png', 1024],
];

const IOS_ICON_SIZES: Array<[string, number]> = [
  ['Icon-App-20x20@1x.png', 20],
  ['Icon-App-20x20@2x.png', 40],
  ['Icon-App-20x20@3x.png', 60],
  ['Icon-App-29x29@1x.png', 29],
  ['Icon-App-29x29@2x.png', 58],
  ['Icon-App-29x29@3x.png', 87],
  ['Icon-App-40x40@1x.png', 40],
  ['Icon-App-40x40@2x.png', 80],
  ['Icon-App-40x40@3x.png', 120],
  ['Icon-App-60x60@2x.png', 120],
  ['Icon-App-60x60@3x.png', 180],
  ['Icon-App-76x76@1x.png', 76],
  ['Icon-App-76x76@2x.png', 152],
  ['Icon-App-83.5x83.5@2x.png', 167],
  ['Icon-App-1024x1024@1x.png', 1024],
];

const ANDROID_ICON_SIZES: Array<[string, number]> = [
  ['mipmap-mdpi/ic_launcher.png', 48],
  ['mipmap-hdpi/ic_launcher.png', 72],
  ['mipmap-xhdpi/ic_launcher.png', 96],
  ['mipmap-xxhdpi/ic_launcher.png', 144],
  ['mipmap-xxxhdpi/ic_launcher.png', 192],
];

const WEB_ICON_SIZES: Array<[string, number]> = [
  ['icons/Icon-192.png', 192],
  ['icons/Icon-512.png', 512],
  ['icons/Icon-maskable-192.png', 192],
  ['icons/Icon-maskable-512.png', 512],
  ['favicon.png', 32],
];

type IconSourceKind = 'user' | 'default' | 'svg-fallback';
interface IconSource {
  path: string;
  mtime: number;
  kind: IconSourceKind;
}

// Priority: user's app-icon.png at project root, then the shipped
// app-icon-default.png (if Tyr has designed one), else a runtime render
// of the Igni SVG onto a pink square canvas.
function resolveIconSource(): IconSource | null {
  const userIcon = join(cwd, 'app-icon.png');
  if (existsSync(userIcon)) {
    return { path: userIcon, mtime: statSync(userIcon).mtimeMs, kind: 'user' };
  }
  const igniDefault = join(__dirname, '..', '..', 'assets', 'app-icon-default.png');
  if (existsSync(igniDefault)) {
    return { path: igniDefault, mtime: statSync(igniDefault).mtimeMs, kind: 'default' };
  }
  const igniSvg = join(__dirname, '..', '..', 'assets', 'igni.svg');
  if (existsSync(igniSvg)) {
    return { path: igniSvg, mtime: statSync(igniSvg).mtimeMs, kind: 'svg-fallback' };
  }
  return null;
}

// Build the 1024×1024 base icon used as the source for every platform-specific
// resize. For PNG sources, this is the source file bytes directly. For the SVG
// fallback, render the triangle at 768px centred on a pink (#EB1555) canvas so
// non-square vectors still produce a valid app icon.
async function buildBaseIcon(source: IconSource): Promise<Buffer> {
  if (source.kind === 'svg-fallback') {
    const triangle = await sharp(source.path)
      .resize(768, 768, { fit: 'contain', background: { r: 235, g: 21, b: 85, alpha: 0 } })
      .png()
      .toBuffer();
    return sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 235, g: 21, b: 85, alpha: 1 },
      },
    })
      .composite([{ input: triangle, left: 128, top: 128 }])
      .png()
      .toBuffer();
  }
  return readFileSync(source.path);
}

async function writeIconsFor(
  base: Buffer,
  targetDir: string,
  sizes: Array<[string, number]>,
): Promise<void> {
  if (!existsSync(targetDir)) return;
  for (const [filename, size] of sizes) {
    const out = join(targetDir, filename);
    mkdirSync(dirname(out), { recursive: true });
    const resized = await sharp(base).resize(size, size, { fit: 'cover' }).png().toBuffer();
    writeFileSync(out, resized);
  }
}

async function syncAppIcon(): Promise<void> {
  const source = resolveIconSource();
  if (!source) return;

  // Cache check: skip the whole pipeline if the source hasn't changed since
  // the last sync. Avoids ~2s of sharp work on every save-triggered hot
  // restart — the file watcher hits this on every `igni run` iteration.
  const stamp = join(igniDir, '.icon-stamp');
  const currentStamp = JSON.stringify({ path: source.path, mtime: source.mtime, kind: source.kind });
  if (existsSync(stamp) && readFileSync(stamp, 'utf-8') === currentStamp) {
    return;
  }

  let base: Buffer;
  try {
    base = await buildBaseIcon(source);
  } catch (err: any) {
    console.error(`Could not load app icon source (${source.path}): ${err.message}. Keeping Flutter defaults.`);
    return;
  }

  await writeIconsFor(
    base,
    join(igniDir, 'macos', 'Runner', 'Assets.xcassets', 'AppIcon.appiconset'),
    MACOS_ICON_SIZES,
  );
  await writeIconsFor(
    base,
    join(igniDir, 'ios', 'Runner', 'Assets.xcassets', 'AppIcon.appiconset'),
    IOS_ICON_SIZES,
  );
  await writeIconsFor(
    base,
    join(igniDir, 'android', 'app', 'src', 'main', 'res'),
    ANDROID_ICON_SIZES,
  );
  await writeIconsFor(
    base,
    join(igniDir, 'web'),
    WEB_ICON_SIZES,
  );

  writeFileSync(stamp, currentStamp);
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
  if (dart.includes("package:google_fonts/") && !pubspec.includes('google_fonts:')) {
    pubspec = pubspec.replace(
      /(\s*cupertino_icons:[^\n]*)/,
      '$1\n  google_fonts: ^6.2.1'
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

async function run(targetPlatform: Target, wMode: WebMode, explicitDevice: string | undefined, explicitName: string | undefined): Promise<void> {
  const initialResult = transpile();
  if (!initialResult) {
    console.error('Fix the error above, then run igni run again.');
    process.exit(1);
  }
  let transpileResult = initialResult;
  const firstRun = !existsSync(join(igniDir, 'pubspec.yaml'));

  ensureFlutterProject(targetPlatform);
  const displayName = explicitName ?? prettifyName(basename(cwd));
  await applyAppIdentity(displayName);
  syncImages();
  syncAudio();
  ensureDependencies(transpileResult.dart);
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(injectAppTitle(transpileResult.dart, displayName));

  let reloadServer: ReloadServer | undefined;
  if (targetPlatform === 'web') {
    if (wMode === 'serve') {
      reloadServer = await startReloadServer();
      installReloadScript(reloadServer.port);
    } else {
      removeReloadScript();
    }
  }

  // Pick the device BEFORE showing the build spinner — device-pick may auto-boot
  // an emulator (visible "Booting <name>..." output), which is a distinct phase.
  const deviceId = targetPlatform === 'web'
    ? (wMode === 'serve' ? 'web-server' : 'chrome')
    : await pickDevice(targetPlatform, explicitDevice);

  const projectName = displayName;
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

  // Start flutter run. On web, bundle CanvasKit + Flutter's default fonts locally
  // so the app works offline — Flutter's default fetches them from gstatic.com CDN.
  const flutterArgs = ['run', '-d', deviceId];
  if (targetPlatform === 'web') {
    flutterArgs.push('--no-web-resources-cdn');
  }
  const flutter = spawn('flutter', flutterArgs, {
    cwd: igniDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Filter Flutter output — suppress implementation details
  let appReady = false;
  let servedUrl: string | undefined;
  const stderrBuffer: string[] = [];

  flutter.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      // In web-server mode Flutter prints e.g. "lib/main.dart is being served at
      // http://localhost:58527". Capture it for the ready banner.
      const servedMatch = line.match(/is being served at (http:\/\/(?:localhost|127\.0\.0\.1):\d+)/);
      if (servedMatch) servedUrl = servedMatch[1];

      if (reloadServer && (line.includes('Restarted application') || line.startsWith('Reloaded'))) {
        reloadServer.broadcast();
      }

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
        line.includes('Dart Debug Chrome extension') ||
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
          const banner = servedUrl
            ? `✓ ${projectName} ready at ${servedUrl}`
            : `✓ ${projectName} ready`;
          process.stdout.write(`\r\x1b[2K${banner}\n\n`);
          // Flush any errors that arrived during the build
          for (const buffered of stderrBuffer) {
            process.stderr.write(buffered + '\n');
          }
          stderrBuffer.length = 0;
          if (servedUrl) {
            console.log('Open that URL in any browser. Save app.igni to hot-reload,');
            console.log('then refresh the browser tab to see changes.');
          } else {
            console.log('Edit app.igni and save to see changes.');
          }
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
      reloadServer?.close();
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
      writeOutput(injectAppTitle(result.dart, displayName));
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
    reloadServer?.close();
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

async function build(buildTgt: BuildTarget, explicitName: string | undefined): Promise<void> {
  const initialResult = transpile();
  if (!initialResult) {
    console.error('Fix the error above, then run igni build again.');
    process.exit(1);
  }

  const platform = BUILD_TARGET_PLATFORM[buildTgt];
  ensureFlutterProject(platform);
  const displayName = explicitName ?? prettifyName(basename(cwd));
  await applyAppIdentity(displayName);
  syncImages();
  syncAudio();
  ensureDependencies(initialResult.dart);
  mkdirSync(join(igniDir, 'lib'), { recursive: true });
  writeOutput(injectAppTitle(initialResult.dart, displayName));

  const projectName = displayName;

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
  run(target, webMode, deviceFlag, nameFlag);
} else if (command === 'build') {
  if (!buildTarget) {
    console.error('Usage: igni build <macos|apk|web>');
    process.exit(1);
  }
  build(buildTarget, nameFlag);
} else if (command === 'new') {
  if (nameFlag) {
    console.error('--name is not valid with `igni new`. Pass the project name as a positional: igni new my-app');
    process.exit(1);
  }
  createNewProject(commandArg);
} else {
  printUsage();
  process.exit(1);
}
