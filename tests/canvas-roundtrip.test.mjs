import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Compila em memória o módulo real do projeto sem publicar nem escrever no cofre.
const original = readFileSync(fileURLToPath(new URL('../web/src/lib/canvas.ts', import.meta.url)), 'utf8');
const javascript = ts.transpileModule(original, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const canvas = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);

test('JSON Canvas preserva atributos adicionais de documento, nós e arestas', () => {
  const source = {
    nodes: [{ id: 'a', type: 'text', x: 2, y: 3, width: 200, height: 100, text: 'teste', extraNode: { owner: 'a' } }],
    edges: [{ id: 'e', fromNode: 'a', toNode: 'a', extraEdge: true }],
    futureMetadata: { flags: ['experimental'], version: 7 },
  };
  const copy = JSON.parse(canvas.serializeCanvas(canvas.parseCanvas(JSON.stringify(source))));
  assert.deepEqual(copy, source);
});

test('JSON Canvas inválido não causa travamento', () => {
  assert.deepEqual(canvas.parseCanvas('{'), {nodes:[],edges:[]});
});
