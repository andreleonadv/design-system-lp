#!/usr/bin/env node
// Uso: node build.mjs <cliente>   (padrão: teste)
// Lê clientes/<nome>/pagina.yaml, valida cada seção contra secoes/<secao>/schema.json
// e gera clientes/<nome>/dist/{index.html,style.css[,script.js][,assets/]}.
// Falha em campo obrigatório vazio e em {{placeholder}} sobrando.
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
  return { erros, html, css: readFileSync(arqCss, 'utf8'), js: lerOpcional(join(dir, `${item.id}.js`)) };
}

/** `extras.customCss`: sobrescritas do cliente, anexadas depois do CSS das seções. */
export function montarPagina(pagina, extras = {}) {
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
  const js = [...new Set(resultados.map((r) => r.js).filter(Boolean))].join('\n');
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
${js ? '<script src="script.js" defer></script>\n' : ''}</body>
</html>
`;
  const baseCss = readFileSync(join(RAIZ, 'tokens', 'base.css'), 'utf8');
  const css = [baseCss, ...new Set(resultados.map((r) => r.css)), extras.customCss ?? ''].join('\n');
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
  const { erros, html, css, js } = montarPagina(pagina, { customCss: lerOpcional(join(pastaCliente, 'custom.css')) });
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
