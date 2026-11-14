#!/usr/bin/env node
// Uso: node build.mjs <cliente>   (padrão: teste)
// Lê clientes/<nome>/pagina.yaml, valida cada seção contra secoes/<secao>/schema.json
// e gera clientes/<nome>/dist/{index.html,style.css}. Falha em campo vazio/placeholder sobrando.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;
const RESTO = /\{\{|\}\}/;

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const lerJson = (caminho) => JSON.parse(readFileSync(caminho, 'utf8'));

/** Valida `valor` contra um subconjunto de JSON Schema (object/string/array, required, minLength). */
export function validar(valor, schema, caminho, erros) {
  const vazio = valor === undefined || valor === null ||
    (typeof valor === 'string' && valor.trim() === '');
  if (vazio) {
    erros.push(`${caminho}: campo obrigatório vazio`);
    return;
  }
  if (typeof valor === 'string' && RESTO.test(valor)) {
    erros.push(`${caminho}: contém {{placeholder}} não preenchido`);
    return;
  }
  if (schema.type === 'string') {
    if (typeof valor !== 'string') erros.push(`${caminho}: esperado texto`);
    return;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(valor) || valor.length === 0) {
      erros.push(`${caminho}: esperado lista não vazia`);
      return;
    }
    valor.forEach((item, i) => schema.items && validar(item, schema.items, `${caminho}[${i}]`, erros));
    return;
  }
  if (schema.type === 'object') {
    if (typeof valor !== 'object' || Array.isArray(valor)) {
      erros.push(`${caminho}: esperado objeto`);
      return;
    }
    for (const chave of schema.required ?? []) {
      validar(valor[chave], schema.properties?.[chave] ?? {}, `${caminho}.${chave}`, erros);
    }
    for (const chave of Object.keys(valor)) {
      if (!schema.properties?.[chave]) erros.push(`${caminho}.${chave}: campo não existe no schema`);
    }
  }
}

function obter(dados, caminho) {
  return caminho.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), dados);
}

function renderizar(template, dados, rotulo, erros) {
  return template.replace(PLACEHOLDER, (_, caminho) => {
    const v = obter(dados, caminho);
    if (v === undefined || v === null || typeof v === 'object' || String(v).trim() === '') {
      erros.push(`${rotulo}: placeholder {{${caminho}}} sem valor`);
      return '';
    }
    return escapeHtml(v);
  });
}

export function montarSecao(item, indice) {
  const erros = [];
  const rotulo = `secoes[${indice}] (${item?.id ?? '?'})`;
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
  return { erros, html, css: readFileSync(arqCss, 'utf8') };
}

export function montarPagina(pagina) {
  const erros = [];
  for (const campo of ['titulo', 'lang', 'descricao']) {
    if (!pagina?.pagina?.[campo] || String(pagina.pagina[campo]).trim() === '') {
      erros.push(`pagina.${campo}: campo obrigatório vazio`);
    }
  }
  if (!Array.isArray(pagina?.secoes) || pagina.secoes.length === 0) {
    erros.push('secoes: lista obrigatória vazia');
    return { erros };
  }

  const resultados = pagina.secoes.map((item, i) => montarSecao(item, i));
  for (const r of resultados) erros.push(...r.erros);
  if (erros.length) return { erros };

  const { lang, titulo, descricao } = pagina.pagina;
  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<meta name="description" content="${escapeHtml(descricao)}">
<link rel="stylesheet" href="style.css">
</head>
<body>
${resultados.map((r) => r.html).join('\n')}
</body>
</html>
`;
  const baseCss = readFileSync(join(RAIZ, 'tokens', 'base.css'), 'utf8');
  const css = [baseCss, ...new Set(resultados.map((r) => r.css))].join('\n');
  return { erros, html, css };
}

function main() {
  const cliente = process.argv[2] ?? 'teste';
  const arq = join(RAIZ, 'clientes', cliente, 'pagina.yaml');
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
  const { erros, html, css } = montarPagina(pagina);
  if (erros.length) {
    console.error(`FALHOU (${cliente}): ${erros.length} erro(s)`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exit(1);
  }
  const dist = join(RAIZ, 'clientes', cliente, 'dist');
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, 'index.html'), html);
  writeFileSync(join(dist, 'style.css'), css);
  console.log(`OK (${cliente}): ${pagina.secoes.length} seção(ões) -> ${dist}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
