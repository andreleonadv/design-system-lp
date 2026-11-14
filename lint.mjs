// lint.mjs — confere as variantes de secoes/ contra o contrato do CLAUDE.md.
// Uso: node lint.mjs   (sai com código 1 se algo reprovar)
//
// Regras:
//  1. todo {{campo}} do .html existe no schema.json da família
//  2. o .css não tem cor hex nem rgb()/hsl() direta (só var(--...))
//  3. o .html começa com comentário "<!-- id: descrição -->"
//  4. a variante está listada no INDEX.md
//  5. um único schema.json por família (sem schema próprio por variante)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analisar } from './build.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

const COR_HEX = /(?<![\w-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;
const COR_FUNCAO = /\b(?:rgba?|hsla?)\s*\(/gi;
const COMENTARIO_INICIAL = /^\s*<!--\s*([a-z0-9]+-[a-z0-9]+)\s*[:\-—–]\s*(\S[\s\S]*?)-->/i;

function lerJson(caminho, erros, rotulo) {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (e) {
    erros.push(`${rotulo}: schema.json inválido (${e.message})`);
    return null;
  }
}

// Schema do campo para um caminho "a.b" a partir de um schema de objeto.
function descer(schema, caminho) {
  let atual = schema;
  for (const parte of caminho.split('.')) {
    if (!atual || atual.type !== 'object' || !atual.properties || !atual.properties[parte]) return null;
    atual = atual.properties[parte];
  }
  return atual;
}

// Confere os caminhos usados num template contra o schema (item 1).
export function camposInexistentes(nos, escopos) {
  const faltando = [];
  for (const no of nos) {
    if (no.tipo === 'texto') continue;
    const caminho = no.caminho;
    let achado = null;
    if (caminho === 'this') {
      achado = escopos[escopos.length - 1];
    } else {
      for (let i = escopos.length - 1; i >= 0 && !achado; i--) achado = descer(escopos[i], caminho);
    }
    if (!achado) {
      faltando.push(caminho);
      continue;
    }
    if (no.tipo === 'each') {
      const itens = achado.type === 'array' ? achado.items : null;
      if (!itens) faltando.push(`${caminho} (each exige lista no schema)`);
      else faltando.push(...camposInexistentes(no.filhos, [...escopos, itens]));
    } else if (no.tipo === 'if') {
      faltando.push(...camposInexistentes(no.filhos, escopos));
    }
  }
  return faltando;
}

export function lintHtml(html, schema, rotulo, idEsperado) {
  const erros = [];
  const m = COMENTARIO_INICIAL.exec(html);
  if (!m) {
    erros.push(`${rotulo}.html: deve começar com comentário "<!-- ${idEsperado}: descrição -->"`);
  } else {
    if (m[1] !== idEsperado) erros.push(`${rotulo}.html: ID no comentário é "${m[1]}", esperado "${idEsperado}"`);
    if (m[2].includes('{{')) erros.push(`${rotulo}.html: comentário não pode conter {{`);
  }
  if (schema) {
    const interno = [];
    const arvore = analisar(html.replace(/<!--[\s\S]*?-->/g, ''), `${rotulo}.html`, interno);
    erros.push(...interno);
    for (const c of camposInexistentes(arvore, [schema])) {
      erros.push(`${rotulo}.html: {{${c}}} não existe no schema.json`);
    }
  }
  return erros;
}

export function lintCss(css, rotulo) {
  const limpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const erros = [];
  const hex = limpo.match(COR_HEX) || [];
  const funcoes = limpo.match(COR_FUNCAO) || [];
  for (const h of new Set(hex)) erros.push(`${rotulo}.css: cor hex direta ${h} (use token var(--...))`);
  for (const f of new Set(funcoes.map((x) => x.toLowerCase()))) {
    erros.push(`${rotulo}.css: cor direta ${f}...) (use token var(--...))`);
  }
  return erros;
}

export function idsDoIndex(texto) {
  const ids = new Set();
  for (const linha of texto.split(/\r?\n/)) {
    const m = /^\s*[-*|]\s*`([a-z0-9]+-[a-z0-9]+)`/.exec(linha) || /^\s*\|\s*`?([a-z0-9]+-[a-z0-9]+)`?\s*\|/.exec(linha);
    if (m) ids.add(m[1]);
  }
  return ids;
}

export function lintRepositorio(raiz = RAIZ) {
  const erros = [];
  const dirSecoes = join(raiz, 'secoes');
  const caminhoIndex = join(raiz, 'INDEX.md');
  if (!existsSync(dirSecoes)) return { erros: ['secoes/ não existe'], total: 0 };
  const indexados = existsSync(caminhoIndex) ? idsDoIndex(readFileSync(caminhoIndex, 'utf8')) : null;
  if (!indexados) erros.push('INDEX.md não existe');

  const familias = readdirSync(dirSecoes).filter((n) => statSync(join(dirSecoes, n)).isDirectory());
  const vistos = new Set();
  let total = 0;
  for (const fam of familias) {
    const pasta = join(dirSecoes, fam);
    const arquivos = readdirSync(pasta);
    const jsons = arquivos.filter((a) => a.endsWith('.json'));
    const schemaOk = jsons.includes('schema.json');
    if (!schemaOk) erros.push(`secoes/${fam}: falta schema.json`);
    for (const extra of jsons.filter((j) => j !== 'schema.json')) {
      erros.push(`secoes/${fam}/${extra}: schema próprio por variante (use só o schema.json da família)`);
    }
    const schema = schemaOk ? lerJson(join(pasta, 'schema.json'), erros, `secoes/${fam}`) : null;
    if (schema && schema.secao !== fam) {
      erros.push(`secoes/${fam}/schema.json: "secao" é "${schema.secao}", esperado "${fam}"`);
    }
    const ids = arquivos.filter((a) => a.endsWith('.html')).map((a) => a.slice(0, -5));
    const csss = arquivos.filter((a) => a.endsWith('.css')).map((a) => a.slice(0, -4));
    for (const css of csss.filter((c) => !ids.includes(c))) erros.push(`secoes/${fam}/${css}.css: sem .html correspondente`);
    for (const id of ids) {
      total++;
      const rotulo = `secoes/${fam}/${id}`;
      vistos.add(id);
      if (!id.startsWith(`${fam}-`)) erros.push(`${rotulo}.html: ID deve começar com "${fam}-"`);
      erros.push(...lintHtml(readFileSync(join(pasta, `${id}.html`), 'utf8'), schema, rotulo, id));
      if (csss.includes(id)) erros.push(...lintCss(readFileSync(join(pasta, `${id}.css`), 'utf8'), rotulo));
      else erros.push(`${rotulo}.css: arquivo ausente`);
      if (indexados && !indexados.has(id)) erros.push(`${rotulo}: não está listada no INDEX.md`);
    }
  }
  if (indexados) {
    for (const id of indexados) if (!vistos.has(id)) erros.push(`INDEX.md: "${id}" não existe em secoes/`);
  }
  return { erros, total };
}

function main() {
  const r = lintRepositorio();
  const { erros } = r;
  if (erros.length) {
    console.error(`lint: ${erros.length} problema(s)`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`lint OK: ${r.total} variante(s)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
