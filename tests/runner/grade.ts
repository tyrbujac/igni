import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type TranspileResult = {
  attempted: boolean;
  extracted_code: boolean;
  passed: boolean;
  error: string | null;
  igni_lines: number;
};

export function extractIgniCode(output: string): string | null {
  const igniTagged = output.match(/```igni\s*\n([\s\S]*?)\n```/);
  if (igniTagged && igniTagged[1].trim()) return igniTagged[1];
  const anyFenced = output.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
  if (anyFenced && anyFenced[1].trim()) return anyFenced[1];
  return null;
}

export function transpileCheck(output: string, cliPath: string): TranspileResult {
  const code = extractIgniCode(output);
  if (!code) {
    return {
      attempted: false,
      extracted_code: false,
      passed: false,
      error: 'no fenced code block found in output',
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
    igni_lines: code.split('\n').length,
  };
}
