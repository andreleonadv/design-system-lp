import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lintHtml, lintCss, idsDoIndex, lintRepositorio } from '../lint.mjs';

const SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    cta: { type: 'object', properties: { texto: { type: 'string' } } },
    itens: { type: 'array', items: { type: 'object', properties: { nome: { type: 'string' } } } },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

test('html válido não gera erro (dotted, each, this, if)', () => {
  const html = '<!-- x-a: teste -->\n<h1>{{titulo}}</h1>{{cta.texto}}{{#each itens}}{{nome}}{{/each}}{{#each tags}}{{this}}{{/each}}{{#if titulo}}x{{/if}}';
  assert.deepEqual(lintHtml(html, SCHEMA, 'r', 'x-a'), []);
});

test('campo fora do schema é erro (raiz, aninhado e dentro de each)', () => {
  const html = '<!-- x-a: teste -->{{foo}}{{cta.url}}{{#each itens}}{{idade}}{{/each}}';
  const erros = lintHtml(html, SCHEMA, 'r', 'x-a').join('\n');
  assert.match(erros, /\{\{foo\}\}/);
  assert.match(erros, /\{\{cta\.url\}\}/);
  assert.match(erros, /\{\{idade\}\}/);
});

test('each sobre campo que não é lista é erro', () => {
  const erros = lintHtml('<!-- x-a: t -->{{#each titulo}}a{{/each}}', SCHEMA, 'r', 'x-a');
  assert.equal(erros.length, 1);
});

test('comentário inicial: ausente, ID errado e com {{ falham', () => {
  assert.equal(lintHtml('<h1>oi</h1>', SCHEMA, 'r', 'x-a').length, 1);
  assert.match(lintHtml('<!-- y-b: t -->', SCHEMA, 'r', 'x-a')[0], /esperado "x-a"/);
  assert.ok(lintHtml('<!-- x-a: usa {{titulo}} -->', SCHEMA, 'r', 'x-a').length >= 1);
});

test('css: hex, rgb, rgba e hsl falham; var() e comentários passam', () => {
  assert.equal(lintCss('a{color:#fff}', 'r').length, 1);
  assert.equal(lintCss('a{color:#A1B2C3}', 'r').length, 1);
  assert.equal(lintCss('a{color:rgb(0,0,0)}', 'r').length, 1);
  assert.equal(lintCss('a{color:rgba(0,0,0,.5)}', 'r').length, 1);
  assert.equal(lintCss('a{color:hsl(0 0% 0%)}', 'r').length, 1);
  assert.deepEqual(lintCss('/* #fff rgb(0,0,0) */ a{color:var(--text)}', 'r'), []);
});

test('idsDoIndex lê IDs entre crases em itens de lista', () => {
  const ids = idsDoIndex('# t\n- `hero-a` — x\n* `faq-b` — y\ntexto `nao-lista` solto\n');
  assert.deepEqual([...ids].sort(), ['faq-b', 'hero-a']);
});

function repo(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'lint-'));
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const completo = join(raiz, caminho);
    mkdirSync(join(completo, '..'), { recursive: true });
    writeFileSync(completo, conteudo);
  }
  return raiz;
}

const SCH = JSON.stringify({ secao: 'faq', type: 'object', properties: { t: { type: 'string' } } });
const BOM = {
  'secoes/faq/schema.json': SCH,
  'secoes/faq/faq-a.html': '<!-- faq-a: teste -->{{t}}',
  'secoes/faq/faq-a.css': '.a{color:var(--text)}',
  'INDEX.md': '- `faq-a` — teste\n',
};

test('repositório válido passa', () => {
  const raiz = repo(BOM);
  try {
    const r = lintRepositorio(raiz);
    assert.deepEqual(r.erros, []);
    assert.equal(r.total, 1);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test('variante fora do INDEX, INDEX órfão e schema próprio falham', () => {
  const raiz = repo({
    ...BOM,
    'INDEX.md': '- `faq-z` — fantasma\n',
    'secoes/faq/faq-a.json': '{}',
  });
  try {
    const erros = lintRepositorio(raiz).erros.join('\n');
    assert.match(erros, /faq-a: não está listada/);
    assert.match(erros, /"faq-z" não existe/);
    assert.match(erros, /schema próprio por variante/);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test('família sem schema.json, "secao" divergente e css ausente falham', () => {
  const raiz = repo({
    'secoes/faq/faq-a.html': '<!-- faq-a: t -->x',
    'secoes/hero/schema.json': JSON.stringify({ secao: 'outra', type: 'object' }),
    'INDEX.md': '- `faq-a` — t\n',
  });
  try {
    const erros = lintRepositorio(raiz).erros.join('\n');
    assert.match(erros, /secoes\/faq: falta schema\.json/);
    assert.match(erros, /esperado "hero"/);
    assert.match(erros, /faq-a\.css: arquivo ausente/);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test('o repositório real passa no lint', () => {
  assert.deepEqual(lintRepositorio().erros, []);
});
