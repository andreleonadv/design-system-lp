import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar, renderizar, montarPagina } from '../build.mjs';

const erros = () => [];
const schema = {
  type: 'object',
  required: ['titulo'],
  properties: {
    titulo: { type: 'string', minLength: 1 },
    imagem: { type: 'object', required: ['src', 'alt'], properties: { src: { type: 'string' }, alt: { type: 'string' } } },
    link: { type: 'string', format: 'url' },
    itens: { type: 'array', items: { type: 'string' } },
  },
};

test('campo obrigatório vazio falha', () => {
  const e = erros();
  validar({ titulo: '  ' }, schema, 'd', e);
  assert.match(e[0], /obrigatório vazio/);
});

test('campo opcional ausente ou vazio passa', () => {
  const e = erros();
  validar({ titulo: 'x', imagem: null, itens: [] }, schema, 'd', e);
  assert.deepEqual(e, []);
});

test('campo opcional preenchido é validado (alt obrigatório dentro da imagem)', () => {
  const e = erros();
  validar({ titulo: 'x', imagem: { src: 'a.jpg' } }, schema, 'd', e);
  assert.match(e[0], /imagem\.alt: campo obrigatório vazio/);
});

test('campo fora do schema falha', () => {
  const e = erros();
  validar({ titulo: 'x', outro: 'y' }, schema, 'd', e);
  assert.match(e[0], /não existe no schema/);
});

test('número onde se espera texto falha com dica de aspas', () => {
  const e = erros();
  validar({ titulo: 11999999999 }, schema, 'd', e);
  assert.match(e[0], /aspas/);
});

test('URL com esquema perigoso falha; relativa, âncora, https e tel passam', () => {
  for (const [url, ok] of [['javascript:alert(1)', false], ['data:text/html,x', false], ['#contato', true], ['https://wa.me/55', true], ['tel:+5511', true], ['/x', true]]) {
    const e = erros();
    validar({ titulo: 'x', link: url }, schema, 'd', e);
    assert.equal(e.length === 0, ok, url);
  }
});

test('{{placeholder}} sobrando no valor falha', () => {
  const e = erros();
  validar({ titulo: 'Olá {{nome}}' }, schema, 'd', e);
  assert.match(e[0], /placeholder/);
});

test('renderiza variável e escapa HTML', () => {
  const e = erros();
  assert.equal(renderizar('<p>{{a.b}}</p>', { a: { b: '<x>&"' } }, 'r', e), '<p>&lt;x&gt;&amp;&quot;</p>');
  assert.deepEqual(e, []);
});

test('variável sem valor gera erro', () => {
  const e = erros();
  renderizar('{{falta}}', {}, 'r', e);
  assert.match(e[0], /sem valor/);
});

test('#if some quando o campo está vazio', () => {
  const e = erros();
  assert.equal(renderizar('a{{#if x}}[{{x}}]{{/if}}b', { x: '' }, 'r', e), 'ab');
  assert.equal(renderizar('a{{#if x}}[{{x}}]{{/if}}b', { x: 'v' }, 'r', e), 'a[v]b');
  assert.deepEqual(e, []);
});

test('#each repete itens de objeto e de texto, com escopo externo', () => {
  const e = erros();
  const dados = { t: 'T', passos: [{ n: '1' }, { n: '2' }], tags: ['a', 'b'] };
  assert.equal(renderizar('{{#each passos}}<{{t}}{{n}}>{{/each}}', dados, 'r', e), '<T1><T2>');
  assert.equal(renderizar('{{#each tags}}{{this}},{{/each}}', dados, 'r', e), 'a,b,');
  assert.deepEqual(e, []);
});

test('#each aninhado com #if dentro', () => {
  const e = erros();
  const dados = { l: [{ n: 'a', s: 'x' }, { n: 'b' }] };
  assert.equal(renderizar('{{#each l}}{{n}}{{#if s}}={{s}}{{/if}};{{/each}}', dados, 'r', e), 'a=x;b;');
  assert.deepEqual(e, []);
});

test('bloco sem fechamento ou fechamento sobrando falha', () => {
  let e = erros();
  renderizar('{{#if x}}a', { x: 1 }, 'r', e);
  assert.ok(e.length);
  e = erros();
  renderizar('a{{/if}}', {}, 'r', e);
  assert.ok(e.length);
});

test('montarPagina falha sem seções e sem metadados', () => {
  assert.ok(montarPagina({ pagina: {}, secoes: [] }).erros.length);
});

test('montarPagina do hero-a monta HTML e anexa custom.css por último', () => {
  const r = montarPagina({
    pagina: { lang: 'pt-BR', titulo: 'T', descricao: 'D' },
    secoes: [{ id: 'hero-a', dados: { titulo: 'a', subtitulo: 'b', cta: { texto: 'c', url: '#contato' } } }],
  }, { customCss: '.x{}' });
  assert.deepEqual(r.erros, []);
  assert.match(r.html, /<h1 class="hero-a__titulo">a<\/h1>/);
  assert.ok(r.css.trimEnd().endsWith('.x{}'));
});

test('id de seção inexistente falha', () => {
  const r = montarPagina({ pagina: { lang: 'pt-BR', titulo: 'T', descricao: 'D' }, secoes: [{ id: 'nada-a', dados: {} }] });
  assert.match(r.erros[0], /arquivo ausente/);
});
