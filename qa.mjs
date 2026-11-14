#!/usr/bin/env node
// Uso: node qa.mjs <cliente> [--sem-browser]   (padrão: teste)
// Roda o build do cliente e verifica clientes/<nome>/dist/:
//   estático : {{placeholder}} sobrando, <img> sem alt, links vazios/"#", hierarquia h1/h2/h3, peso
//   navegador: overflow horizontal e contraste de texto em 375/768/1280 px (Chrome/Edge headless)
// Screenshots por viewport em clientes/<nome>/qa/<largura>.png (não versionados).
// Código de saída 1 se houver falha; avisos não reprovam.
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const RAIZ = dirname(fileURLToPath(import.meta.url));
export const VIEWPORTS = [375, 768, 1280];
const LIMITE_TEXTO = 150 * 1024; // html + css + js
const LIMITE_TOTAL = 1.5 * 1024 * 1024; // dist inteiro
const ALTURA_MAX = 8000;

/* ---------- funções puras (as duas primeiras também são injetadas no navegador) ---------- */

export function razaoContraste(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** WCAG AA: 3 para texto grande (>=24px, ou >=18.66px em negrito), 4.5 para o resto. */
export function minimoContraste(tamanhoPx, peso) {
  return tamanhoPx >= 24 || (tamanhoPx >= 18.66 && Number(peso) >= 700) ? 3 : 4.5;
}

const semTags = (s) => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const atributo = (tag, nome) => {
  const m = new RegExp(`\\s${nome}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[2] ?? m[3]) : null;
};

/** Verificações estáticas sobre o HTML final. Retorna { falhas, avisos }. */
export function verificarHtml(html) {
  const falhas = [];
  const avisos = [];

  if (/\{\{|\}\}/.test(html)) falhas.push('placeholder {{...}} sobrando no HTML');

  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    if (atributo(tag, 'alt') === null) falhas.push(`imagem sem alt: ${tag.slice(0, 80)}`);
  }

  const ids = new Set([...html.matchAll(/\sid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]));
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = atributo(m[0], 'href');
    const texto = semTags(m[2].replace(/<img\b[^>]*\balt\s*=\s*"([^"]*)"[^>]*>/gi, '$1'));
    const rotulo = atributo(m[0], 'aria-label');
    if (href === null || href.trim() === '' || href.trim() === '#') {
      falhas.push(`link vazio ou "#": "${texto || rotulo || '(sem texto)'}"`);
    } else if (href.startsWith('#') && !ids.has(href.slice(1))) {
      avisos.push(`âncora ${href} sem alvo nesta página (ok se a seção ainda não foi montada)`);
    }
    if (!texto && !(rotulo && rotulo.trim())) falhas.push(`link sem texto acessível (href="${href ?? ''}")`);
  }

  const niveis = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const h1 = niveis.filter((n) => n === 1).length;
  if (h1 !== 1) falhas.push(`esperado exatamente 1 h1, encontrado ${h1}`);
  let anterior = 0;
  for (const n of niveis) {
    if (n > anterior + 1) falhas.push(`salto de título: h${anterior || '(início)'} -> h${n}`);
    anterior = n;
  }
  return { falhas, avisos };
}

function pesoDe(pasta) {
  let texto = 0;
  let total = 0;
  const andar = (dir) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) { andar(p); continue; }
      const tam = statSync(p).size;
      total += tam;
      if (['.html', '.css', '.js'].includes(extname(nome))) texto += tam;
    }
  };
  andar(pasta);
  return { texto, total };
}

function verificarPeso(dist) {
  const { texto, total } = pesoDe(dist);
  const kb = (n) => (n / 1024).toFixed(1);
  const falhas = [];
  if (texto > LIMITE_TEXTO) falhas.push(`html+css+js = ${kb(texto)} KB (limite ${kb(LIMITE_TEXTO)} KB)`);
  if (total > LIMITE_TOTAL) falhas.push(`dist = ${kb(total)} KB (limite ${kb(LIMITE_TOTAL)} KB)`);
  return { falhas, resumo: `html+css+js ${kb(texto)} KB, total ${kb(total)} KB` };
}

/* ---------- navegador headless ---------- */

function acharNavegador() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidatos.find((c) => c && existsSync(c)) ?? null;
}

// Roda dentro da página-moldura: mede o iframe (srcdoc herda a origem, então dá para ler o documento).
function medirNoNavegador(minimo, razao) {
  const iframe = document.getElementById('f');
  const saida = document.getElementById('qa-out');
  const analisar = () => {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    const cor = (s) => {
      const m = /^rgba?\(([^)]+)\)$/.exec(s.trim());
      if (!m) return null;
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
    };
    const misturar = (topo, base) => topo.rgb.map((v, i) => v * topo.a + base[i] * (1 - topo.a));
    const fundoDe = (el) => {
      const camadas = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = win.getComputedStyle(e);
        if (cs.backgroundImage !== 'none') return null;
        const c = cor(cs.backgroundColor);
        if (!c) return null;
        if (c.a > 0) camadas.push(c);
        if (c.a === 1) break;
      }
      let base = [255, 255, 255];
      for (const c of camadas.reverse()) base = misturar(c, base);
      return base;
    };
    const falhas = [];
    let verificados = 0;
    let ignorados = 0;
    for (const el of doc.body.querySelectorAll('*')) {
      const tem = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!tem) continue;
      const cs = win.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const fundo = fundoDe(el);
      const c = cor(cs.color);
      if (!fundo || !c) { ignorados++; continue; }
      const texto = misturar(c, fundo);
      const r = razao(texto, fundo);
      const min = minimo(parseFloat(cs.fontSize), cs.fontWeight);
      verificados++;
      if (r < min) {
        const alvo = el.className ? `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase();
        falhas.push({ alvo, texto: el.textContent.trim().slice(0, 40), razao: Math.round(r * 100) / 100, minimo: min });
      }
    }
    const raiz = doc.documentElement;
    const resultado = { largura: iframe.clientWidth, scrollWidth: raiz.scrollWidth, altura: raiz.scrollHeight, verificados, ignorados, contraste: falhas };
    iframe.style.height = raiz.scrollHeight + 'px';
    saida.textContent = JSON.stringify(resultado);
  };
  iframe.addEventListener('load', () => setTimeout(analisar, 50));
}

function moldura(html, largura, altura) {
  const srcdoc = JSON.stringify(html).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#fff}iframe{display:block;border:0;width:${largura}px;height:${altura}px}#qa-out{display:none}
</style></head><body><iframe id="f" scrolling="no"></iframe><pre id="qa-out"></pre>
<script>
${medirNoNavegador.toString()}
const minimo = ${minimoContraste.toString()};
const razao = ${razaoContraste.toString()};
medirNoNavegador(minimo, razao);
document.getElementById('f').srcdoc = ${srcdoc};
</script></body></html>`;
}

function chrome(navegador, args) {
  const perfil = mkdtempSync(join(tmpdir(), 'qa-chrome-'));
  try {
    return spawnSync(navegador, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
      `--user-data-dir=${perfil}`, ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
  } finally {
    rmSync(perfil, { recursive: true, force: true });
  }
}

const decodificar = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function medirViewport(navegador, tmp, html, largura) {
  const arq = join(tmp, `moldura-${largura}.html`);
  writeFileSync(arq, moldura(html, largura, 800));
  const r = chrome(navegador, [`--window-size=${largura},800`, '--virtual-time-budget=3000', '--dump-dom', pathToFileURL(arq).href]);
  const m = /<pre id="qa-out"[^>]*>([\s\S]*?)<\/pre>/.exec(r.stdout ?? '');
  if (!m || !m[1].trim()) return { erro: `navegador não devolveu medições (${(r.stderr || 'sem saída').slice(0, 200)})` };
  return JSON.parse(decodificar(m[1]));
}

function capturar(navegador, tmp, html, largura, altura, destino) {
  const arq = join(tmp, `print-${largura}.html`);
  writeFileSync(arq, moldura(html, largura, altura));
  chrome(navegador, [`--window-size=${largura},${altura}`, '--virtual-time-budget=3000', `--screenshot=${destino}`, pathToFileURL(arq).href]);
  return existsSync(destino);
}

/* ---------- relatório ---------- */

function main() {
  const args = process.argv.slice(2);
  const cliente = args.find((a) => !a.startsWith('--')) ?? 'teste';
  const semBrowser = args.includes('--sem-browser');
  const pasta = join(RAIZ, 'clientes', cliente);
  const dist = join(pasta, 'dist');

  const build = spawnSync(process.execPath, [join(RAIZ, 'build.mjs'), cliente], { encoding: 'utf8' });
  if (build.status !== 0) {
    console.error(`QA (${cliente}): FALHOU no build\n${build.stderr || build.stdout}`);
    process.exit(1);
  }
  const html = readFileSync(join(dist, 'index.html'), 'utf8');

  const linhas = [];
  let falhou = false;
  const item = (ok, nome, detalhes = []) => {
    if (!ok) falhou = true;
    linhas.push(`${ok ? 'PASSOU ' : 'FALHOU '} ${nome}`);
    for (const d of detalhes) linhas.push(`         - ${d}`);
  };
  const aviso = (nome, detalhes) => {
    linhas.push(`AVISO   ${nome}`);
    for (const d of detalhes) linhas.push(`         - ${d}`);
  };

  const est = verificarHtml(html);
  const grupo = (re) => est.falhas.filter((f) => re.test(f));
  item(grupo(/placeholder/).length === 0, 'placeholders', grupo(/placeholder/));
  item(grupo(/sem alt/).length === 0, 'imagens com alt', grupo(/sem alt/));
  item(grupo(/link/i).length === 0, 'links válidos', grupo(/link/i));
  item(grupo(/h1|salto/).length === 0, 'hierarquia de títulos', grupo(/h1|salto/));
  const peso = verificarPeso(dist);
  item(peso.falhas.length === 0, `peso (${peso.resumo})`, peso.falhas);
  if (est.avisos.length) aviso('âncoras', [...new Set(est.avisos)]);

  const navegador = semBrowser ? null : acharNavegador();
  if (!navegador) {
    aviso(semBrowser ? 'overflow, contraste e screenshots pulados (--sem-browser)'
      : 'Chrome/Edge não encontrado (defina CHROME_PATH): overflow, contraste e screenshots NÃO verificados', []);
    if (!semBrowser) falhou = true;
  } else {
    const tmp = mkdtempSync(join(tmpdir(), 'qa-'));
    try {
      cpSync(dist, tmp, { recursive: true });
      mkdirSync(join(pasta, 'qa'), { recursive: true });
      const medicoes = VIEWPORTS.map((w) => ({ w, m: medirViewport(navegador, tmp, html, w) }));
      for (const { w, m } of medicoes) {
        if (m.erro) { item(false, `${w}px`, [m.erro]); continue; }
        item(m.scrollWidth <= m.largura, `overflow horizontal em ${w}px`,
          m.scrollWidth > m.largura ? [`conteúdo com ${m.scrollWidth}px em viewport de ${m.largura}px`] : []);
        item(m.contraste.length === 0, `contraste em ${w}px (${m.verificados} textos)`,
          m.contraste.map((c) => `${c.alvo} "${c.texto}": ${c.razao} (mínimo ${c.minimo})`));
        if (m.ignorados) aviso(`contraste em ${w}px: ${m.ignorados} texto(s) sobre imagem/gradiente não verificado(s)`, []);
        const altura = Math.min(Math.max(m.altura, 400), ALTURA_MAX);
        const destino = join(pasta, 'qa', `${w}.png`);
        if (!capturar(navegador, tmp, html, w, altura, destino)) item(false, `screenshot ${w}px`, ['arquivo não foi gerado']);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  console.log(`QA (${cliente})\n${linhas.join('\n')}`);
  console.log(falhou ? '\nRESULTADO: FALHOU' : `\nRESULTADO: PASSOU${navegador ? ` (screenshots em ${join(pasta, 'qa')})` : ''}`);
  process.exit(falhou ? 1 : 0);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
