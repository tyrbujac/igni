export class TranspileError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

export function formatError(err: TranspileError, source: string): string {
  const lines = source.split('\n');
  const lineIdx = err.line - 1;
  const srcLine = lines[lineIdx] ?? '';
  const caret = ' '.repeat(Math.max(0, err.column - 1)) + '^';

  let out = `\n  Error: ${err.message}\n\n`;
  out += `    ${err.line} | ${srcLine}\n`;
  out += `    ${' '.repeat(String(err.line).length)} | ${caret}\n`;
  return out;
}
