# Progresso
## Decisões
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
## Próximo
- Criar `INDEX.md` (1 linha por variante; hero-a ainda não está listada).
- Revisar o schema do `hero` para atender site e landing (imagem opcional) — hoje exige titulo, subtitulo e cta.
- Fase 1: `qa.mjs`, testes de `build.mjs`, build lendo `nicho.yaml` (ordem, obrigatórias), QA com termos vetados, seções na ordem de criação acima, `gerar-paleta.mjs`, tipografia/estilos.
