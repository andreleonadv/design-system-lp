import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verificarHtml, razaoContraste, minimoContraste } from '../qa.mjs';

const pagina = (corpo) => `<!doctype html><html><body>${corpo}</body></html>`;

test('placeholder {{...}} sobrando é falha', () => {
  const r = verificarHtml(pagina('<h1>Oi {{nome}}</h1>'));
  assert.ok(r.falhas.some((f) => /placeholder/.test(f)));
});

test('imagem sem alt é falha; alt vazio (decorativa) passa', () => {
  const r = verificarHtml(pagina('<h1>a</h1><img src="a.png"><img src="b.png" alt="">'));
  assert.equal(r.falhas.filter((f) => /sem alt/.test(f)).length, 1);
});

test('link vazio, "#" e sem texto são falhas; âncora #contato passa', () => {
  const r = verificarHtml(pagina('<h1>a</h1><a href="#">x</a><a href="">y</a><a>z</a><a href="/p"></a><a href="#contato">ok</a>'));
  assert.equal(r.falhas.filter((f) => /link/i.test(f)).length, 4);
});

test('âncora para id inexistente vira aviso, não falha', () => {
  const r = verificarHtml(pagina('<h1>a</h1><a href="#contato">ok</a>'));
  assert.deepEqual(r.falhas, []);
  assert.ok(r.avisos.some((a) => /#contato/.test(a)));
});

test('âncora para id existente não gera aviso', () => {
  const r = verificarHtml(pagina('<h1>a</h1><a href="#c">ok</a><section id="c"></section>'));
  assert.deepEqual(r.avisos, []);
});

test('hierarquia: sem h1, h1 duplicado e salto de nível falham', () => {
  assert.ok(verificarHtml(pagina('<h2>a</h2>')).falhas.some((f) => /h1/.test(f)));
  assert.ok(verificarHtml(pagina('<h1>a</h1><h1>b</h1>')).falhas.some((f) => /h1/.test(f)));
  assert.ok(verificarHtml(pagina('<h1>a</h1><h3>b</h3>')).falhas.some((f) => /salto/.test(f)));
});

test('hierarquia correta passa', () => {
  assert.deepEqual(verificarHtml(pagina('<h1>a</h1><h2>b</h2><h3>c</h3><h2>d</h2>')).falhas, []);
});

test('contraste: preto sobre branco = 21; mesma cor = 1', () => {
  assert.equal(Math.round(razaoContraste([0, 0, 0], [255, 255, 255])), 21);
  assert.equal(razaoContraste([10, 20, 30], [10, 20, 30]), 1);
});

test('limite de contraste: 4.5 normal, 3 para texto grande', () => {
  assert.equal(minimoContraste(16, 400), 4.5);
  assert.equal(minimoContraste(24, 400), 3);
  assert.equal(minimoContraste(19, 700), 3);
  assert.equal(minimoContraste(18, 700), 4.5);
});
