import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Why three categories and not two? Pre-audit, `transpile.passed: false`
// lumped "model produced invalid code" with "tool broke." docs/private/50
// found 42% of recorded fails across v0.8.1–v0.10 were tool bugs silently
// counted as model output quality. Splitting out keeps dissertation-citable
// model signal distinct from infra noise.
export type TranspileErrorCategory =
  | 'model_error'      // transpiler correctly rejected bad Igni from the model
  | 'runner_error'     // runner couldn't extract code (no fence, bad output shape)
  | 'transpiler_crash' // transpiler itself crashed on otherwise-valid input
  | null;              // passed — no error to categorise

export type TranspileResult = {
  attempted: boolean;
  extracted_code: boolean;
  passed: boolean;
  error: string | null;
  error_category: TranspileErrorCategory;
  igni_lines: number;
};

export function categoriseTranspileError(
  extracted: boolean,
  passed: boolean,
  error: string | null,
): TranspileErrorCategory {
  if (passed) return null;
  if (!extracted) return 'runner_error';
  if (error) {
    if (
      error.includes('FATAL ERROR: Reached heap limit') ||
      error.includes('JavaScript heap out of memory') ||
      error.includes('RangeError: Maximum call stack')
    ) {
      return 'transpiler_crash';
    }
    // Parser-assertion message from parser.ts is a transpiler_crash too:
    // "This is a transpiler bug."
    if (error.includes('This is a transpiler bug')) {
      return 'transpiler_crash';
    }
  }
  return 'model_error';
}

export function extractIgniCode(output: string): string | null {
  const igniTagged = output.match(/```igni\s*\n([\s\S]*?)\n```/);
  if (igniTagged && igniTagged[1].trim()) return igniTagged[1];
  const anyFenced = output.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
  if (anyFenced && anyFenced[1].trim()) return anyFenced[1];
  // Unfenced fallback: when a prompt asks for code-only output, many models
  // respond with bare Igni without ``` markers. If the whole response looks
  // structurally like Igni (contains at least one load-bearing top-level
  // keyword), treat it as the code. Otherwise return null.
  //
  // Without this, any prompt that says "respond with only the Igni code"
  // counts unfenced compliant responses as grader failures — inflating the
  // false-negative transpile-pass rate. Observed: v0.11 Clima post-ship run
  // had 3/4 models write valid unfenced Igni code and get marked failed.
  const trimmed = output.trim();
  if (!trimmed) return null;
  if (hasIgniStructuralMarkers(trimmed)) return trimmed;
  return null;
}

function hasIgniStructuralMarkers(text: string): boolean {
  // Top-level construct that only appears in Igni programs. Anchored to line
  // start to avoid matching the same words inside prose or other languages.
  const markers = [
    /^screen\s+[A-Z]\w*/m,
    /^component\s+[A-Z]\w*/m,
    /^shared:\s*$/m,
  ];
  return markers.some(re => re.test(text));
}

export function transpileCheck(output: string, cliPath: string): TranspileResult {
  const code = extractIgniCode(output);
  if (!code) {
    return {
      attempted: false,
      extracted_code: false,
      passed: false,
      error: 'no fenced code block found in output',
      error_category: 'runner_error',
      igni_lines: 0,
    };
  }

  const dir = mkdtempSync(join(tmpdir(), 'igni-grade-'));
  const srcFile = join(dir, 'app.igni');
  writeFileSync(srcFile, code);

  const result = spawnSync('npx', ['tsx', cliPath, srcFile], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const passed = result.status === 0;
  const error = passed
    ? null
    : (result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`).slice(0, 2000);

  try { rmSync(dir, { recursive: true, force: true }); } catch {}

  return {
    attempted: true,
    extracted_code: true,
    passed,
    error,
    error_category: categoriseTranspileError(true, passed, error),
    igni_lines: code.split('\n').length,
  };
}
