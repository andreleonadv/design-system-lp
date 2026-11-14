import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { montarPagina, montarSeo, validarOrdem, validarPagina, carregarNicho } from '../build.mjs';

const hero = { id: 'hero-a', dados: { titulo: 'Olá', subtitulo: 'Sub', cta: { texto: 'Ir', url: '#contato' } } };
const cabecalho = { id: 'cabecalho-a', dados: { marca: 'Marca X', links: [{ texto: 'Início', url: '#hero' }], cta: { texto: 'Falar', url: '#contato' } } };
const rodape = { id: 'rodape-a', dados: { nome: 'Marca X', telefone: '(11) 90000-0000', redes: [{ texto: 'Instagram', url: 'https://instagram.com/x' }] } };
const pag = (extra = {}, pagina = {}) => ({
  pagina: { lang: 'pt-BR', titulo: 'Título', descricao: 'Descrição', ...pagina },
  secoes: [hero],
  ...extra,
});
const erros = (p, extras) => montarPagina(p, extras).erros;

// --- cabeçalho e rodapé ---

test('cabeçalho vem antes das seções e rodapé depois, em <header>/<footer>', () => {
  const r = montarPagina(pag({ cabecalho, rodape }));
  assert.deepEqual(r.erros, []);
  const i = (s) => r.html.indexOf(s);
  assert.ok(i('<header') > 0 && i('<header') < i('class="hero-a"') && i('class="hero-a"') < i('<footer'));
  assert.ok(r.css.includes('.cabecalho-a') && r.css.includes('.rodape-a'));
});

test('cabeçalho e rodapé são opcionais; opcionais internos somem se vazios', () => {
  const r = montarPagina(pag({ cabecalho: { id: 'cabecalho-a', dados: { marca: 'M' } } }));
  assert.deepEqual(r.erros, []);
  assert.ok(!r.html.includes('cabecalho-a__nav') && !r.html.includes('cabecalho-a__cta"'));
});

test('cabeçalho com marca vazia ou campo inexistente falha, citando o bloco', () => {
  const e = erros(pag({ cabecalho: { id: 'cabecalho-a', dados: { marca: '', xyz: 'a' } } }));
  assert.ok(e.some((m) => m.startsWith('cabecalho (cabecalho-a).dados.marca')));
  assert.ok(e.some((m) => m.includes('xyz: campo não existe')));
});

test('bloco com família trocada (rodape-a em cabecalho) falha', () => {
  const e = erros(pag({ cabecalho: rodape }));
  assert.ok(e.some((m) => m.startsWith('cabecalho: esperado')));
});

test('URL com javascript: no rodapé falha', () => {
  const ruim = { id: 'rodape-a', dados: { nome: 'M', links: [{ texto: 'x', url: 'javascript:alert(1)' }] } };
  assert.ok(erros(pag({ rodape: ruim })).some((m) => m.includes('URL inválida')));
});

// --- SEO ---

test('sem campos de SEO: só og básico e twitter:card summary, sem canonical/robots/json-ld', () => {
  const { html } = montarPagina(pag());
  assert.match(html, /property="og:title" content="Título"/);
  assert.match(html, /property="og:locale" content="pt_BR"/);
  assert.match(html, /name="twitter:card" content="summary"/);
  assert.ok(!/canonical|name="robots"|ld\+json|og:image|rel="icon"/.test(html));
});

test('url gera canonical e og:url; imagem relativa vira absoluta e o card fica grande', () => {
  const p = { url: 'https://exemplo.com.br', nome_site: 'Exemplo', imagem_social: { src: 'assets/og.png', alt: 'Logo' } };
  const h = montarSeo({ lang: 'pt-BR', titulo: 'T', descricao: 'D', ...p });
  assert.match(h, /rel="canonical" href="https:\/\/exemplo\.com\.br"/);
  assert.match(h, /og:url" content="https:\/\/exemplo\.com\.br"/);
  assert.match(h, /og:site_name" content="Exemplo"/);
  assert.match(h, /og:image" content="https:\/\/exemplo\.com\.br\/assets\/og\.png"/);
  assert.match(h, /twitter:card" content="summary_large_image"/);
});

test('robots: noindex emite a meta; index não emite', () => {
  assert.match(montarPagina(pag({}, { robots: 'noindex' })).html, /name="robots" content="noindex, nofollow"/);
  assert.ok(!montarPagina(pag({}, { robots: 'index' })).html.includes('name="robots"'));
  assert.ok(erros(pag({}, { robots: 'talvez' })).some((m) => m.includes('pagina.robots')));
});

test('imagem_social sem url, url http e campo desconhecido falham', () => {
  assert.ok(validarPagina({ lang: 'pt-BR', titulo: 'T', descricao: 'D', imagem_social: { src: 'assets/a.png', alt: 'a' } })
    .some((m) => m.includes('exige pagina.url')));
  assert.ok(validarPagina({ lang: 'pt-BR', titulo: 'T', descricao: 'D', url: 'http://x.com' }).some((m) => m.includes('https://')));
  assert.ok(validarPagina({ lang: 'pt-BR', titulo: 'T', descricao: 'D', foo: 'x' }).some((m) => m.includes('pagina.foo')));
});

test('título > 70 e descrição > 160 caracteres falham', () => {
  const e = validarPagina({ lang: 'pt-BR', titulo: 'a'.repeat(71), descricao: 'b'.repeat(161) });
  assert.ok(e.some((m) => m.includes('pagina.titulo')) && e.some((m) => m.includes('pagina.descricao')));
  assert.deepEqual(validarPagina({ lang: 'pt-BR', titulo: 'a'.repeat(70), descricao: 'b'.repeat(160) }), []);
});

test('favicon e imagem social locais: só assets/, e o arquivo precisa existir', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'cliente-'));
  mkdirSync(join(pasta, 'assets'));
  writeFileSync(join(pasta, 'assets', 'f.png'), 'x');
  const base = { lang: 'pt-BR', titulo: 'T', descricao: 'D' };
  assert.deepEqual(validarPagina({ ...base, favicon: 'assets/f.png' }, pasta), []);
  assert.ok(validarPagina({ ...base, favicon: 'assets/nao.png' }, pasta)[0].includes('não existe'));
  assert.ok(validarPagina({ ...base, favicon: '../f.png' }, pasta)[0].includes('assets/'));
  assert.match(montarSeo({ ...base, favicon: 'assets/f.png' }), /rel="icon" href="assets\/f\.png"/);
});

test('negocio gera JSON-LD só com os campos preenchidos e escapa "<"', () => {
  const p = { lang: 'pt-BR', titulo: 'T', descricao: 'D', url: 'https://x.com.br',
    negocio: { tipo: 'LegalService', nome: 'Escritório </script>', telefone: '(11) 90000-0000', redes: ['https://instagram.com/x'] } };
  assert.deepEqual(validarPagina(p), []);
  const h = montarSeo(p);
  const json = /<script type="application\/ld\+json">(.*)<\/script>/.exec(h)[1];
  assert.ok(!json.includes('<'));
  const o = JSON.parse(json);
  assert.equal(o['@type'], 'LegalService');
  assert.equal(o.name, 'Escritório </script>');
  assert.equal(o.telephone, '(11) 90000-0000');
  assert.equal(o.url, 'https://x.com.br');
  assert.ok(!('email' in o) && !('address' in o));
});

test('negocio com tipo fora da lista ou sem nome falha', () => {
  const base = { lang: 'pt-BR', titulo: 'T', descricao: 'D' };
  assert.ok(validarPagina({ ...base, negocio: { tipo: 'Padaria', nome: 'X' } }).some((m) => m.includes('negocio.tipo')));
  assert.ok(validarPagina({ ...base, negocio: { tipo: 'Organization' } }).some((m) => m.includes('negocio.nome')));
});

test('campo desconhecido na raiz do pagina.yaml falha (typo não passa em silêncio)', () => {
  assert.ok(erros(pag({ rodpe: rodape })).some((m) => m.startsWith('rodpe:')));
});

// --- nicho, tipo e ordem ---

const def = { ordem: ['hero', 'problema', 'faq', 'contato'], obrigatorias: ['hero', 'contato'] };
const s = (...ids) => ids.map((id) => ({ id }));

test('ordem correta e completa passa', () => {
  assert.deepEqual(validarOrdem(s('hero-a', 'problema-b', 'faq-a', 'contato-c'), 'landing', def), []);
});

test('seção fora de ordem falha e mostra a ordem esperada', () => {
  const e = validarOrdem(s('hero-a', 'faq-a', 'problema-a', 'contato-a'), 'landing', def);
  assert.ok(e.some((m) => m.includes('fora de ordem') && m.includes('hero → problema → faq → contato')));
});

test('família de fora do tipo e família repetida falham', () => {
  const e = validarOrdem(s('hero-a', 'problema-a', 'problema-b', 'faq-a', 'contato-a', 'areas-a'), 'landing', def);
  assert.ok(e.some((m) => m.includes('"areas" não faz parte')));
  assert.ok(e.some((m) => m.includes('"problema" repetida')));
});

test('seção faltando falha; dispensar (não obrigatória) libera', () => {
  const sem = s('hero-a', 'problema-a', 'contato-a');
  assert.ok(validarOrdem(sem, 'landing', def).some((m) => m.includes('falta a seção "faq"')));
  assert.deepEqual(validarOrdem(sem, 'landing', def, ['faq']), []);
});

test('dispensar obrigatória, desconhecida ou presente falha', () => {
  const e = validarOrdem(s('hero-a', 'problema-a', 'faq-a'), 'landing', def, ['contato', 'xyz', 'faq']);
  assert.ok(e.some((m) => m.includes('"contato" é obrigatória')));
  assert.ok(e.some((m) => m.includes('"xyz" não faz parte')));
  assert.ok(e.some((m) => m.includes('"faq" está dispensada mas aparece')));
});

test('família com hífen no nome (ex.: sobre-nos-a) é lida inteira', () => {
  const d = { ordem: ['hero', 'sobre-nos'], obrigatorias: [] };
  assert.deepEqual(validarOrdem(s('hero-a', 'sobre-nos-b'), 't', d), []);
});

test('montarPagina com nicho+tipo usa o perfil injetado', () => {
  const perfil = { tipos: { landing: def } };
  const ok = montarPagina(pag({ nicho: 'x', tipo: 'landing', dispensar: ['problema', 'faq'] }), { perfilNicho: perfil });
  assert.ok(ok.erros.some((m) => m.includes('falta a seção "contato"')));
  const sem = montarPagina(pag({ nicho: 'x', tipo: 'inexistente' }), { perfilNicho: perfil });
  assert.ok(sem.erros.some((m) => m.includes('tipo: "inexistente" não existe')));
});

test('nicho sem tipo, tipo sem nicho e dispensar sem nicho falham', () => {
  assert.ok(erros(pag({ nicho: 'advocacia' })).some((m) => m.includes('juntos')));
  assert.ok(erros(pag({ tipo: 'landing' })).some((m) => m.includes('juntos')));
  assert.ok(erros(pag({ dispensar: ['faq'] })).some((m) => m.includes('dispensar: exige')));
});

test('sem nicho/tipo, nenhuma validação de ordem (comportamento anterior)', () => {
  assert.deepEqual(erros(pag()), []);
});

test('carregarNicho: lê advocacia; recusa nome inexistente e caminho', () => {
  const { erros: e, perfil } = carregarNicho('advocacia');
  assert.deepEqual(e, []);
  assert.deepEqual(perfil.tipos.landing.ordem.slice(0, 2), ['hero', 'problema']);
  assert.ok(carregarNicho('nao-existe').erros[0].includes('não existe'));
  assert.ok(carregarNicho('../etc').erros[0].includes('inválido'));
});

test('advocacia real: hero sozinho falha por falta de seções, listando a ordem', () => {
  const r = montarPagina(pag({ nicho: 'advocacia', tipo: 'landing' }));
  assert.ok(r.erros.some((m) => m.includes('falta a seção "contato"')));
  assert.ok(r.erros.some((m) => m.includes('hero → problema → solucoes')));
});
