#!/usr/bin/env node
// Uso: node build.mjs <cliente>   (padrão: teste)
// Lê clientes/<nome>/pagina.yaml, valida cada seção contra secoes/<secao>/schema.json
// e gera clientes/<nome>/dist/{index.html,style.css[,script.js][,assets/]}.
// Falha em campo obrigatório vazio e em {{placeholder}} sobrando.
//
// Blocos do pagina.yaml: pagina (titulo, lang, descricao + SEO opcional), tema, cabecalho, rodape,
// nicho + tipo (+ dispensar) para validar a ordem das seções, secoes.
//
// Template das variantes (<id>.html):
//   {{campo}} / {{a.b}}            valor escapado; vazio ou ausente = erro
//   {{#if campo}}...{{/if}}        só renderiza se o campo (opcional) tiver valor
//   {{#each lista}}...{{/each}}    repete para cada item; dentro, {{campo}} lê do item
//                                  (ou do escopo externo) e {{this}} é o item (listas de texto)
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const RESTO = /\{\{|\}\}/;
const TOKEN = /(\{\{[^{}]*\}\})/;
const ABRE = /^\{\{#(if|each)\s+([\w.]+)\s*\}\}$/;
const FECHA = /^\{\{\/(if|each)\s*\}\}$/;
const VAR = /^\{\{\s*([\w.]+)\s*\}\}$/;
const URL_SEGURA = /^(?:(?:https?|mailto|tel):|(?![a-z][a-z0-9+.-]*:))/i; // sem esquema, ou http(s)/mailto/tel

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const lerJson = (caminho) => JSON.parse(readFileSync(caminho, 'utf8'));

const estaVazio = (v) =>
  v === undefined || v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

/**
 * Valida `valor` contra um subconjunto de JSON Schema:
 * type (object/string/array), required, properties, items, minLength, maxLength, enum,
 * format: "url". Campo fora de `required` é opcional: ausente ou vazio é aceito,
 * mas, se preenchido, é validado. Campo que o schema não declara é erro.
 */
export function validar(valor, schema, caminho, erros, obrigatorio = true) {
  if (estaVazio(valor)) {
    if (obrigatorio) erros.push(`${caminho}: campo obrigatório vazio`);
    return;
  }
  if (typeof valor === 'string' && RESTO.test(valor)) {
    erros.push(`${caminho}: contém {{placeholder}} não preenchido`);
    return;
  }
  if (schema.type === 'string') {
    if (typeof valor !== 'string') {
      erros.push(`${caminho}: esperado texto (no YAML, ponha aspas em números, telefones e valores como yes/no)`);
      return;
    }
    if (schema.minLength && valor.trim().length < schema.minLength) erros.push(`${caminho}: menor que ${schema.minLength} caracteres`);
    if (schema.maxLength && valor.length > schema.maxLength) erros.push(`${caminho}: maior que ${schema.maxLength} caracteres`);
    if (schema.enum && !schema.enum.includes(valor)) erros.push(`${caminho}: valor fora de [${schema.enum.join(', ')}]`);
    if (schema.format === 'url' && !URL_SEGURA.test(valor.trim())) erros.push(`${caminho}: URL inválida ou com esquema não permitido`);
    return;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(valor)) {
      erros.push(`${caminho}: esperado lista`);
      return;
    }
    if (schema.maxItems && valor.length > schema.maxItems) erros.push(`${caminho}: mais de ${schema.maxItems} itens`);
    valor.forEach((item, i) => schema.items && validar(item, schema.items, `${caminho}[${i}]`, erros));
    return;
  }
  if (schema.type === 'object') {
    if (typeof valor !== 'object' || Array.isArray(valor)) {
      erros.push(`${caminho}: esperado objeto`);
      return;
    }
    const obrig = schema.required ?? [];
    for (const chave of Object.keys(valor)) {
      if (!schema.properties?.[chave]) erros.push(`${caminho}.${chave}: campo não existe no schema`);
    }
    for (const chave of new Set([...obrig, ...Object.keys(schema.properties ?? {})])) {
      validar(valor[chave], schema.properties?.[chave] ?? {}, `${caminho}.${chave}`, erros, obrig.includes(chave));
    }
  }
}

function obter(dados, caminho) {
  return caminho.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), dados);
}

/** Transforma o template em árvore: texto | var | if | each. Erros de sintaxe vão para `erros`. */
export function analisar(template, rotulo, erros) {
  const raiz = [];
  const pilha = [{ filhos: raiz }];
  for (const t of template.split(TOKEN)) {
    const topo = pilha[pilha.length - 1];
    let m;
    if ((m = ABRE.exec(t))) {
      const no = { tipo: m[1], caminho: m[2], filhos: [] };
      topo.filhos.push(no);
      pilha.push(no);
    } else if ((m = FECHA.exec(t))) {
      if (pilha.length === 1 || topo.tipo !== m[1]) {
        erros.push(`${rotulo}: {{/${m[1]}}} sem abertura correspondente`);
      } else {
        pilha.pop();
      }
    } else if ((m = VAR.exec(t))) {
      topo.filhos.push({ tipo: 'var', caminho: m[1] });
    } else if (t.startsWith('{{')) {
      erros.push(`${rotulo}: marcação inválida ${t}`);
    } else if (t) {
      topo.filhos.push({ tipo: 'texto', texto: t });
    }
  }
  if (pilha.length > 1) erros.push(`${rotulo}: {{#${pilha[pilha.length - 1].tipo}}} sem fechamento`);
  return raiz;
}

function resolver(caminho, escopos) {
  if (caminho === 'this') return escopos[escopos.length - 1];
  for (let i = escopos.length - 1; i >= 0; i--) {
    const v = obter(escopos[i], caminho);
    if (v !== undefined) return v;
  }
  return undefined;
}

function desenhar(nos, escopos, rotulo, erros) {
  return nos.map((no) => {
    if (no.tipo === 'texto') return no.texto;
    const v = resolver(no.caminho, escopos);
    if (no.tipo === 'var') {
      if (estaVazio(v) || typeof v === 'object') {
        erros.push(`${rotulo}: placeholder {{${no.caminho}}} sem valor`);
        return '';
      }
      return escapeHtml(v);
    }
    if (no.tipo === 'if') {
      return estaVazio(v) || v === false ? '' : desenhar(no.filhos, escopos, rotulo, erros);
    }
    if (estaVazio(v)) return '';
    if (!Array.isArray(v)) {
      erros.push(`${rotulo}: {{#each ${no.caminho}}} exige lista`);
      return '';
    }
    return v.map((item) => desenhar(no.filhos, [...escopos, item], rotulo, erros)).join('');
  }).join('');
}

export function renderizar(template, dados, rotulo, erros) {
  return desenhar(analisar(template, rotulo, erros), [dados], rotulo, erros);
}

const lerOpcional = (arq) => (existsSync(arq) ? readFileSync(arq, 'utf8') : '');

export function montarSecao(item, indice, bloco) {
  const erros = [];
  const rotulo = `${bloco ?? `secoes[${indice}]`} (${item?.id ?? '?'})`;
  const m = /^([a-z0-9-]+)-([a-z])$/.exec(item?.id ?? '');
  if (!m) return { erros: [`${rotulo}: id inválido (esperado <secao>-<letra>)`] };

  const dir = join(RAIZ, 'secoes', m[1]);
  const arqHtml = join(dir, `${item.id}.html`);
  const arqCss = join(dir, `${item.id}.css`);
  const arqSchema = join(dir, 'schema.json');
  for (const a of [arqHtml, arqCss, arqSchema]) {
    if (!existsSync(a)) return { erros: [`${rotulo}: arquivo ausente ${a}`] };
  }

  const schema = lerJson(arqSchema);
  validar(item.dados, schema, `${rotulo}.dados`, erros);
  if (erros.length) return { erros };

  const html = renderizar(readFileSync(arqHtml, 'utf8'), item.dados, rotulo, erros);
  if (RESTO.test(html)) erros.push(`${rotulo}: {{placeholder}} sobrando no HTML final`);
  return { erros, html, css: readFileSync(arqCss, 'utf8'), js: lerOpcional(join(dir, `${item.id}.js`)) };
}

const TEMA_TIPOS = { tipografia: 'tipo', paleta: 'paleta', estilo: 'estilo' };
const ID_TEMA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FONTES = /^\/\*\s*google-fonts:\s*(\S+)\s*\*\//;

/**
 * Bloco opcional `tema: {tipografia: tipo-1, paleta: paleta-1, estilo: estilo-x}`.
 * Cada id aponta para tokens/<tipografia|paleta|estilo>/<id>.css (prefixo obrigatório: tipo-, paleta-, estilo-).
 * Se o CSS tiver o comentário `google-fonts: family=...` na 1ª linha, devolve a URL em `fontes`.
 */
export function carregarTema(tema, rotulo = 'tema') {
  const erros = [];
  if (tema === undefined || tema === null) return { erros, css: '', fontes: [] };
  if (typeof tema !== 'object' || Array.isArray(tema)) {
    return { erros: [`${rotulo}: esperado objeto {tipografia, paleta, estilo}`], css: '', fontes: [] };
  }
  for (const chave of Object.keys(tema)) {
    if (!TEMA_TIPOS[chave]) erros.push(`${rotulo}.${chave}: campo desconhecido (use tipografia, paleta ou estilo)`);
  }
  const partes = [];
  const fontes = [];
  for (const [chave, prefixo] of Object.entries(TEMA_TIPOS)) {
    const id = tema[chave];
    if (id === undefined || id === null || id === '') continue;
    if (typeof id !== 'string' || !ID_TEMA.test(id) || !id.startsWith(`${prefixo}-`)) {
      erros.push(`${rotulo}.${chave}: id inválido "${id}" (esperado ${prefixo}-<nome>)`);
      continue;
    }
    const arq = join(RAIZ, 'tokens', chave, `${id}.css`);
    if (!existsSync(arq)) {
      erros.push(`${rotulo}.${chave}: "${id}" não existe (tokens/${chave}/${id}.css)`);
      continue;
    }
    const css = readFileSync(arq, 'utf8');
    const f = FONTES.exec(css);
    if (f) fontes.push(`https://fonts.googleapis.com/css2?${f[1]}`);
    partes.push(css);
  }
  return { erros, css: partes.join('\n'), fontes };
}

const SCHEMA_PAGINA = {
  type: 'object',
  required: ['titulo', 'lang', 'descricao'],
  properties: {
    titulo: { type: 'string', minLength: 1, maxLength: 70 },
    lang: { type: 'string', minLength: 2 },
    descricao: { type: 'string', minLength: 1, maxLength: 160 },
    url: { type: 'string', minLength: 1, format: 'url' },
    nome_site: { type: 'string', minLength: 1 },
    robots: { type: 'string', enum: ['index', 'noindex'] },
    favicon: { type: 'string', minLength: 1 },
    imagem_social: {
      type: 'object',
      required: ['src', 'alt'],
      properties: { src: { type: 'string', minLength: 1 }, alt: { type: 'string', minLength: 1 } },
    },
    negocio: {
      type: 'object',
      required: ['tipo', 'nome'],
      properties: {
        tipo: { type: 'string', enum: ['Organization', 'LocalBusiness', 'LegalService'] },
        nome: { type: 'string', minLength: 1 },
        telefone: { type: 'string', minLength: 1 },
        email: { type: 'string', minLength: 1 },
        endereco: { type: 'string', minLength: 1 },
        redes: { type: 'array', maxItems: 6, items: { type: 'string', format: 'url' } },
      },
    },
  },
};
const CAMPOS_RAIZ = ['pagina', 'tema', 'secoes', 'cabecalho', 'rodape', 'nicho', 'tipo', 'dispensar'];
const ASSET = /^assets\/[^\\]+$/;
const ABSOLUTA = /^https?:\/\//i;

/** Valida o bloco `pagina` (título, descrição e SEO). `pastaCliente` (opcional) confere se os arquivos existem. */
export function validarPagina(p, pastaCliente) {
  const erros = [];
  validar(p ?? undefined, SCHEMA_PAGINA, 'pagina', erros);
  if (erros.length || !p) return erros;
  if (p.url && !/^https:\/\//i.test(p.url.trim())) erros.push('pagina.url: deve começar com https://');
  if (p.imagem_social && !p.url) erros.push('pagina.imagem_social: exige pagina.url (a imagem social precisa de endereço absoluto)');
  for (const [campo, valor] of [['favicon', p.favicon], ['imagem_social.src', p.imagem_social?.src]]) {
    if (!valor || ABSOLUTA.test(valor)) continue;
    if (!ASSET.test(valor)) erros.push(`pagina.${campo}: use https://... ou um arquivo dentro de assets/ (ex.: assets/arquivo.png)`);
    else if (pastaCliente && !existsSync(join(pastaCliente, valor))) erros.push(`pagina.${campo}: arquivo "${valor}" não existe na pasta do cliente`);
  }
  return erros;
}

const jsonSeguro = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

function jsonLd(p) {
  const n = p.negocio;
  if (!n) return '';
  const dados = { '@context': 'https://schema.org', '@type': n.tipo, name: n.nome };
  if (p.url) dados.url = p.url.trim();
  if (n.telefone) dados.telephone = n.telefone;
  if (n.email) dados.email = n.email;
  if (n.endereco) dados.address = { '@type': 'PostalAddress', streetAddress: n.endereco };
  if (n.redes?.length) dados.sameAs = n.redes;
  return `<script type="application/ld+json">${jsonSeguro(dados)}</script>\n`;
}

/** Meta tags de SEO (robots, canonical, Open Graph, Twitter, favicon, JSON-LD). Só emite o que tem dado. */
export function montarSeo(p) {
  const meta = (attr, nome, valor) => `<meta ${attr}="${nome}" content="${escapeHtml(valor)}">\n`;
  const url = p.url?.trim();
  let h = '';
  if (p.robots === 'noindex') h += meta('name', 'robots', 'noindex, nofollow');
  if (url) h += `<link rel="canonical" href="${escapeHtml(url)}">\n`;
  h += meta('property', 'og:type', 'website') + meta('property', 'og:title', p.titulo) + meta('property', 'og:description', p.descricao);
  h += meta('property', 'og:locale', String(p.lang).replace('-', '_'));
  if (p.nome_site) h += meta('property', 'og:site_name', p.nome_site);
  if (url) h += meta('property', 'og:url', url);
  if (p.imagem_social) {
    const src = ABSOLUTA.test(p.imagem_social.src) ? p.imagem_social.src : new URL(p.imagem_social.src, url.endsWith('/') ? url : `${url}/`).href;
    h += meta('property', 'og:image', src) + meta('property', 'og:image:alt', p.imagem_social.alt) + meta('name', 'twitter:image', src);
  }
  h += meta('name', 'twitter:card', p.imagem_social ? 'summary_large_image' : 'summary');
  if (p.favicon) h += `<link rel="icon" href="${escapeHtml(p.favicon)}">\n`;
  return h + jsonLd(p);
}

const NICHO_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const familiaDe = (id) => /^([a-z0-9-]+)-[a-z]$/.exec(id ?? '')?.[1];

/** Lê nichos/<nicho>/nicho.yaml. Devolve {erros, perfil}. */
export function carregarNicho(nicho) {
  if (typeof nicho !== 'string' || !NICHO_ID.test(nicho)) return { erros: [`nicho: nome inválido "${nicho}"`] };
  const arq = join(RAIZ, 'nichos', nicho, 'nicho.yaml');
  if (!existsSync(arq)) return { erros: [`nicho: "${nicho}" não existe (nichos/${nicho}/nicho.yaml)`] };
  try {
    return { erros: [], perfil: yaml.load(readFileSync(arq, 'utf8')) };
  } catch (e) {
    return { erros: [`nicho: YAML inválido em ${arq}: ${e.message}`] };
  }
}

/**
 * Valida as seções contra a `ordem` do tipo no nicho.yaml: só famílias do tipo, sem repetir,
 * na ordem, e nenhuma faltando (exceto as listadas em `dispensar`, que nunca podem ser obrigatórias).
 */
export function validarOrdem(secoes, tipo, def, dispensar = []) {
  const erros = [];
  const ordem = def.ordem ?? [];
  const obrig = def.obrigatorias ?? [];
  const esperado = `ordem de "${tipo}": ${ordem.join(' → ')}`;
  const usadas = secoes.map((s) => familiaDe(s?.id)).filter(Boolean);
  const vistos = new Set();
  for (const f of usadas) {
    if (!ordem.includes(f)) erros.push(`secoes: família "${f}" não faz parte do tipo "${tipo}" (${esperado})`);
    else if (vistos.has(f)) erros.push(`secoes: família "${f}" repetida`);
    vistos.add(f);
  }
  for (const f of dispensar) {
    if (!ordem.includes(f)) erros.push(`dispensar: "${f}" não faz parte do tipo "${tipo}"`);
    else if (obrig.includes(f)) erros.push(`dispensar: "${f}" é obrigatória no tipo "${tipo}"`);
    else if (vistos.has(f)) erros.push(`dispensar: "${f}" está dispensada mas aparece em secoes`);
  }
  for (const f of ordem) {
    if (!vistos.has(f) && !dispensar.includes(f)) {
      erros.push(`secoes: falta a seção "${f}" (${esperado}). Inclua, ou liste em dispensar se o usuário decidiu pular`);
    }
  }
  const posicoes = usadas.filter((f) => ordem.includes(f)).map((f) => ordem.indexOf(f));
  if (posicoes.some((v, i) => i > 0 && v < posicoes[i - 1])) erros.push(`secoes: fora de ordem (${esperado})`);
  return erros;
}

/** Valida `nicho`/`tipo`/`dispensar` do pagina.yaml. `extras.perfilNicho` (opcional) substitui a leitura do arquivo. */
function validarNichoTipo(pagina, extras) {
  const { nicho, tipo, dispensar } = pagina;
  if (nicho === undefined && tipo === undefined) {
    return dispensar === undefined ? [] : ['dispensar: exige nicho e tipo'];
  }
  if (!nicho || !tipo) return ['nicho e tipo devem ser informados juntos'];
  if (typeof tipo !== 'string') return ['tipo: esperado texto (no YAML, ponha aspas em números e em yes/no)'];
  if (dispensar !== undefined && (!Array.isArray(dispensar) || dispensar.some((d) => typeof d !== 'string'))) {
    return ['dispensar: esperado lista de famílias (ex.: [faq])'];
  }
  const carregado = extras.perfilNicho ? { erros: [], perfil: extras.perfilNicho } : carregarNicho(nicho);
  if (carregado.erros.length) return carregado.erros;
  const def = carregado.perfil?.tipos?.[tipo];
  if (!def) return [`tipo: "${tipo}" não existe no nicho "${nicho}" (tipos: ${Object.keys(carregado.perfil?.tipos ?? {}).join(', ')})`];
  return validarOrdem(pagina.secoes, tipo, def, dispensar ?? []);
}

/** Cabeçalho/rodapé: bloco {id, dados} cuja família é fixa. Devolve null se o bloco não existe. */
function montarBloco(item, familia) {
  if (item === undefined || item === null) return null;
  if (typeof item !== 'object' || Array.isArray(item) || familiaDe(item.id) !== familia) {
    return { erros: [`${familia}: esperado {id: ${familia}-<letra>, dados: {...}}`] };
  }
  return montarSecao(item, 0, familia);
}

function montarHead(pagina, tema) {
  const { lang, titulo, descricao } = pagina;
  const fontes = tema.fontes.length ? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${tema.fontes.map((u) => `<link rel="stylesheet" href="${escapeHtml(u)}">`).join('\n')}
` : '';
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<meta name="description" content="${escapeHtml(descricao)}">
${montarSeo(pagina)}${fontes}<link rel="stylesheet" href="style.css">
</head>
`;
}

/**
 * `extras.customCss`: sobrescritas do cliente, anexadas depois do CSS das seções.
 * `extras.pastaCliente`: confere favicon/imagem social. `extras.perfilNicho`: perfil já carregado (testes).
 */
export function montarPagina(pagina, extras = {}) {
  const erros = [];
  for (const chave of Object.keys(pagina ?? {})) {
    if (!CAMPOS_RAIZ.includes(chave)) erros.push(`${chave}: campo desconhecido na raiz do pagina.yaml (use ${CAMPOS_RAIZ.join(', ')})`);
  }
  erros.push(...validarPagina(pagina?.pagina, extras.pastaCliente));
  if (!Array.isArray(pagina?.secoes) || pagina.secoes.length === 0) {
    erros.push('secoes: lista obrigatória vazia');
    return { erros };
  }
  erros.push(...validarNichoTipo(pagina, extras));

  const resultados = pagina.secoes.map((item, i) => montarSecao(item, i));
  const cabecalho = montarBloco(pagina.cabecalho, 'cabecalho');
  const rodape = montarBloco(pagina.rodape, 'rodape');
  const todos = [cabecalho, ...resultados, rodape].filter(Boolean);
  for (const r of todos) erros.push(...r.erros);
  const tema = carregarTema(pagina.tema);
  erros.push(...tema.erros);
  if (erros.length) return { erros };

  const js = [...new Set(todos.map((r) => r.js).filter(Boolean))].join('\n');
  const corpo = todos.map((r) => r.html).join('\n');
  const html = `${montarHead(pagina.pagina, tema)}<body>
${corpo}
${js ? '<script src="script.js" defer></script>\n' : ''}</body>
</html>
`;
  const baseCss = readFileSync(join(RAIZ, 'tokens', 'base.css'), 'utf8');
  const css = [baseCss, tema.css, ...new Set(todos.map((r) => r.css)), extras.customCss ?? ''].join('\n');
  return { erros, html, css, js };
}

function main() {
  const cliente = process.argv[2] ?? 'teste';
  const pastaCliente = join(RAIZ, 'clientes', cliente);
  const arq = join(pastaCliente, 'pagina.yaml');
  if (!existsSync(arq)) {
    console.error(`FALHOU: ${arq} não existe`);
    process.exit(1);
  }
  let pagina;
  try {
    pagina = yaml.load(readFileSync(arq, 'utf8'));
  } catch (e) {
    console.error(`FALHOU: YAML inválido em ${arq}\n${e.message}`);
    process.exit(1);
  }
  const { erros, html, css, js } = montarPagina(pagina, { customCss: lerOpcional(join(pastaCliente, 'custom.css')), pastaCliente });
  if (erros.length) {
    console.error(`FALHOU (${cliente}): ${erros.length} erro(s)`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exit(1);
  }
  const dist = join(pastaCliente, 'dist');
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, 'index.html'), html);
  writeFileSync(join(dist, 'style.css'), css);
  if (js) writeFileSync(join(dist, 'script.js'), js);
  if (existsSync(join(pastaCliente, 'assets'))) cpSync(join(pastaCliente, 'assets'), join(dist, 'assets'), { recursive: true });
  console.log(`OK (${cliente}): ${pagina.secoes.length} seção(ões) -> ${dist}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
