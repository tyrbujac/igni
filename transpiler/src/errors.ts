export class TranspileError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

export interface ErrorLocation {
  file?: string;
  line: number;
  column: number;
  sourceLine: string;
  context?: string;
}

function formatErrorBlock(message: string, location: ErrorLocation): string {
  const filePrefix = location.file ? `${location.file}:` : '';
  const caret = ' '.repeat(Math.max(0, location.column - 1)) + '^';

  let out = `\n  Error: ${message}\n\n`;
  if (location.context) {
    out += `  ${location.context}\n\n`;
  }
  out += `    ${filePrefix}${location.line} | ${location.sourceLine}\n`;
  out += `    ${' '.repeat((filePrefix + String(location.line)).length)} | ${caret}\n`;
  return out;
}

export function formatError(err: TranspileError, source: string, file?: string): string {
  const lines = source.split('\n');
  const lineIdx = err.line - 1;
  const srcLine = lines[lineIdx] ?? '';
  return formatErrorBlock(err.message, {
    file,
    line: err.line,
    column: err.column,
    sourceLine: srcLine,
  });
}

export function formatMappedError(message: string, location: ErrorLocation): string {
  return formatErrorBlock(message, location);
}
