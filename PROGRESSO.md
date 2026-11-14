# Progresso
## Decisões
- O README é só tutorial (passos, comandos, prompts): NÃO registra andamento nem checklist de etapas feitas. O andamento fica neste arquivo.
- O sistema é multi-nicho. Cada nicho tem um perfil em `nichos/<nicho>/` (`nicho.yaml`, `briefing.md`, `conteudo.md`); modelo em `nichos/_modelo/`. A estrutura de páginas NÃO fica no `CLAUDE.md`.
- Nicho piloto: advocacia (Direito Bancário, Imobiliário e do Consumidor). Perfil em `nichos/advocacia/`.
  - Site (8): hero → areas → servicos → atuacao → autoridade → conteudos → faq → contato.
  - Landing (9): hero → problema → solucoes → requisitos → atuacao → autoridade → fundamentacao → faq → contato.
- Famílias de seção ficam todas em `secoes/` e são compartilhadas entre nichos; criar família nova só quando um nicho precisar. As 12 famílias atuais nasceram da advocacia: hero, problema, solucoes, requisitos, atuacao, autoridade, fundamentacao, faq, contato, areas, servicos, conteudos.
- Ordem de CRIAÇÃO das seções (advocacia): hero, problema, solucoes, requisitos, atuacao, autoridade, fundamentacao, faq, contato (completa a landing); depois areas, servicos, conteudos (completa o site).
- Nunca inventar legislação, jurisprudência, número de OAB, credenciais ou depoimentos (regra do nicho advocacia).
- CTA padrão: (a definir)
- Referências visuais: (a definir)
- Dependência única: `js-yaml` (parse do pagina.yaml). Rodar `npm install` após clonar.
- Schema por SEÇÃO (`secoes/<secao>/schema.json`, versao 1), subconjunto de JSON Schema (object/string/array, required). Campo não declarado no schema = erro.
- `pagina.yaml`: `pagina: {lang, titulo, descricao}` + `secoes: [{id, dados}]`. Tipografia/estilo (`tipo-N`, `estilo-*`) ainda NÃO implementados. Campos `nicho` e `tipo: site|landing` (build valida a ordem pelo `nicho.yaml`) são planejados, não implementados.
- Template das variantes: `{{campo}}`, `{{#if}}`, `{{#each}}`, `{{this}}` (detalhes no CLAUDE.md). Campos opcionais, `<id>.js`, `custom.css` e `assets/` já são tratados pelo build.
- Uso: `node build.mjs <cliente>` (padrão: teste) → `clientes/<cliente>/dist/{index.html,style.css}`.
## Em aberto (confirmar com o usuário)
- Nomes das famílias de seção são propostas; confirmar.
- Cabeçalho e rodapé não constam na estrutura informada; decidir se entram como elementos fixos de apoio.
- Confirmar se as 5 famílias compartilhadas da advocacia (hero, atuacao, autoridade, faq, contato) ficam únicas ou se alguma deve ser dividida (decidir no Comando 1 de cada seção).
- Validar o formato do perfil de nicho com um 2º nicho (ex.: barbearia) antes de considerá-lo estável.
## Feito
- Fase 0: estrutura (`tokens/`, `secoes/hero/`, `clientes/teste/`), `tokens/base.css` (espaçamento, tipografia, paleta de teste semântica), `build.mjs`, seção `hero-a` + `schema.json`, `clientes/teste/pagina.yaml`.
- Verificado: build do cliente teste OK; build falha (exit 1) com campo vazio e com `{{placeholder}}` sobrando.
- Documentação com estrutura de site (8) e landing (9) da advocacia.
- Perfis de nicho: `nichos/_modelo/` e `nichos/advocacia/` (nicho.yaml, briefing.md, conteudo.md); `CLAUDE.md` tornado genérico.
- Auditoria pré-seções (2026-11-14): `build.mjs` reescrito para suportar o que as seções exigem (ver "Erros encontrados"); `test/build.test.mjs` (16 testes, `npm test`); `.gitattributes` (LF); `package.json` com scripts `build`/`test`; schema do `hero` v2 (`imagem` opcional com `alt` obrigatório, `cta.url` com `format: url`).
- Passo 2 (2026-11-14): `qa.mjs` + `test/qa.test.mjs` (25 testes no total). Uso: `node qa.mjs <cliente> [--sem-browser]`; roda o build e checa placeholders, alt, links vazios/"#", h1 único e sem salto de nível, peso (html+css+js ≤ 150 KB, dist ≤ 1,5 MB), overflow e contraste AA em 375/768/1280, prints em `clientes/<nome>/qa/<largura>.png` (no `.gitignore`). Achou Chrome/Edge sozinho (ou `CHROME_PATH`). Verificado: `teste` passa; CSS com texto quase invisível e `nowrap` faz o QA falhar (exit 1). Âncora sem alvo (ex.: `#contato`) é só aviso. Contraste ignora texto sobre imagem/gradiente (avisa). 
- Passo 3 (2026-11-14): `INDEX.md` (hero-a) + `lint.mjs` + `test/lint.test.mjs` (35 testes no total). Uso: `node lint.mjs` (ou `npm run lint`). Checa: campos `{{}}` do .html existem no schema (inclui `a.b`, `each`, `this`); .css sem hex/rgb()/hsl(); .html começa com `<!-- id: descrição -->` (ID igual ao nome do arquivo); variante listada no INDEX.md (e INDEX sem órfãos); um só `schema.json` por família, com `secao` = nome da pasta; .css presente. Reprovou e foi corrigido: `hero-a.html` sem comentário de ID. Formato do INDEX: ``- `<id>` — descrição``.
- Passo 4 (2026-11-14): `tokens/tipografia/tipo-1.css` (Source Serif 4 nos títulos + Inter no texto, Google Fonts; fontes e cores escolhidas por mim como PROVISÓRIAS, pois o prompt veio com `[TÍTULO]`/`[TEXTO]`/`[...]` em branco — trocar quando houver referência) e `tokens/paleta/paleta-1.css` (azul-marinho sóbrio). Contraste AA verificado: text/bg 17,6; text/surface 16,2; muted/bg 7,4; muted/surface 6,8; on-accent/accent 11,3. Build: bloco opcional `tema: {tipografia, paleta, estilo}` no `pagina.yaml` (arquivos `tokens/<tipografia|paleta|estilo>/<id>.css`, prefixos `tipo-`/`paleta-`/`estilo-`), anexado logo depois do `base.css`; id inexistente/inválido ou campo desconhecido falha o build; sem `tema` nada muda. Fonte: 1ª linha do CSS `/* google-fonts: family=...&display=swap */` vira `<link>` (+ preconnect) no `<head>`. `test/tema.test.mjs` (9 testes; 44 no total). `clientes/teste` usa tipo-1 + paleta-1: build, qa e lint passam. README: seção 13.4 (tema), 15.4 e prompts de tipografia atualizados.
## Erros encontrados na auditoria (corrigidos)
- Build não repetia listas (faq, passos, áreas) nem aceitava campo opcional → `{{#each}}`, `{{#if}}` e validação de opcionais.
- Schema ignorava `minLength`/`enum`; campo opcional preenchido nunca era validado; URL `javascript:` passava → validação completa e `format: url`.
- `<id>.js` (prometido no CLAUDE.md), `custom.css` e `assets/` não eram usados → agora tratados.
- Número no YAML (telefone) dava erro sem dica → mensagem orienta a pôr aspas.
- Docs afirmavam `qa.mjs`/`INDEX.md` como verificação, mas não existem → marcados como pendentes.
## Ainda NÃO existe (pendente, nesta ordem, ANTES de criar seções)
1. Decidir cabeçalho/rodapé, SEO básico (Open Graph, favicon, dados estruturados — hoje só `title` e `description`) e `nicho`/`tipo` no `pagina.yaml` com validação da ordem.
## Próximo (sequência do README, uma etapa por sessão)
- Passo 5: decisões estruturais. Só então o Passo 6: seção `problema` (o `hero-a` já existe; refinar com o Comando 3).
- Depois: Passo 7+: build lendo `nicho.yaml` (ordem, obrigatórias), QA com termos vetados, `gerar-paleta.mjs`, tipografia/estilos.
