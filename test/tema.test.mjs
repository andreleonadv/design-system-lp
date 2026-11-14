import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { carregarTema, montarPagina } from '../build.mjs';

const pagina = (tema) => ({
  pagina: { lang: 'pt-BR', titulo: 'T', descricao: 'D' },
  ...(tema === undefined ? {} : { tema }),
  secoes: [{ id: 'hero-a', dados: { titulo: 'Olá', subtitulo: 'Sub', cta: { texto: 'Ir', url: '#contato' } } }],
});
const base = readFileSync(new URL('../tokens/base.css', import.meta.url), 'utf8');

test('sem bloco tema: comportamento anterior (sem fonte, base.css primeiro)', () => {
  const r = montarPagina(pagina());
  assert.deepEqual(r.erros, []);
  assert.ok(r.css.startsWith(base));
  assert.ok(!r.html.includes('fonts.googleapis.com'));
});

test('tema válido anexa tipografia e paleta logo depois do base.css', () => {
  const r = montarPagina(pagina({ tipografia: 'tipo-1', paleta: 'paleta-1' }));
  assert.deepEqual(r.erros, []);
  const iBase = r.css.indexOf(base);
  const iTipo = r.css.indexOf('--font-heading: "Source Serif 4"');
  const iPaleta = r.css.indexOf('--accent: #1b3a6b');
  const iSecao = r.css.indexOf('hero-a');
  assert.equal(iBase, 0);
  assert.ok(iTipo > base.length && iPaleta > iTipo);
  assert.ok(iSecao === -1 || iPaleta < iSecao);
});

test('fonte do Google Fonts vira <link> no head antes do style.css', () => {
  const { html } = montarPagina(pagina({ tipografia: 'tipo-1' }));
  const head = html.slice(0, html.indexOf('</head>'));
  assert.match(head, /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Source\+Serif\+4/);
  assert.match(head, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
  assert.ok(head.indexOf('fonts.googleapis.com/css2') < head.indexOf('href="style.css"'));
});

test('paleta sem fonte não adiciona <link> de fonte', () => {
  const { html } = montarPagina(pagina({ paleta: 'paleta-1' }));
  assert.ok(!html.includes('fonts.googleapis.com'));
});

test('id de tema inexistente falha, citando o campo', () => {
  const r = montarPagina(pagina({ tipografia: 'tipo-99' }));
  assert.match(r.erros[0], /tema\.tipografia: "tipo-99" não existe/);
  assert.equal(r.html, undefined);
});

test('id com prefixo errado, caminho ou tipo inválido falha', () => {
  assert.match(carregarTema({ paleta: 'tipo-1' }).erros[0], /id inválido/);
  assert.match(carregarTema({ paleta: '../base' }).erros[0], /id inválido/);
  assert.match(carregarTema({ paleta: 1 }).erros[0], /id inválido/);
  assert.match(carregarTema('tipo-1').erros[0], /esperado objeto/);
});

test('campo desconhecido no tema falha', () => {
  assert.match(carregarTema({ cores: 'x' }).erros[0], /campo desconhecido/);
});

test('estilo inexistente falha; campos vazios são ignorados', () => {
  assert.match(carregarTema({ estilo: 'estilo-sobrio' }).erros[0], /não existe/);
  assert.deepEqual(carregarTema({ estilo: null, paleta: '' }).erros, []);
});

test('tokens da paleta-1 definem todos os tokens semânticos', () => {
  const css = readFileSync(new URL('../tokens/paleta/paleta-1.css', import.meta.url), 'utf8');
  for (const t of ['bg', 'surface', 'text', 'muted', 'accent', 'on-accent', 'border']) {
    assert.ok(css.includes(`--${t}: #`), `falta --${t}`);
  }
});
