import { readFileSync } from 'node:fs';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator } from './codegen.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: igni <file.igni>');
  process.exit(1);
}

const source = readFileSync(file, 'utf-8');
const tokens = new Lexer(source).tokenize();
const ast = new Parser(tokens).parse();
const dart = new CodeGenerator().generate(ast);

process.stdout.write(dart);
