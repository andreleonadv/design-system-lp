# Progresso
## Decisões
- Nicho inicial: advocacia (Direito Bancário, Imobiliário e do Consumidor).
- CTA padrão: (a definir)
- Referências visuais: (a definir)
- Dois tipos de página, estrutura e ordem fixas (regra de congruência). Detalhe em `README.md` seção 2.1 e `CLAUDE.md`.
  - Site (8): hero → areas → servicos → atuacao → autoridade → conteudos → faq → contato.
  - Landing (9): hero → problema → solucoes → requisitos → atuacao → autoridade → fundamentacao → faq → contato.
- 12 famílias de seção (pasta em `secoes/`): hero, problema, solucoes, requisitos, atuacao, autoridade, fundamentacao, faq, contato, areas, servicos, conteudos. Compartilhadas entre site e landing: hero, atuacao, autoridade, faq, contato (schema com campos opcionais).
- Ordem de CRIAÇÃO das seções: hero, problema, solucoes, requisitos, atuacao, autoridade, fundamentacao, faq, contato (completa a landing); depois areas, servicos, conteudos (completa o site).
- Nunca inventar legislação, jurisprudência, número de OAB, credenciais ou depoimentos (vêm do briefing, conferidos pelo advogado).
- Dependência única: `js-yaml` (parse do pagina.yaml). Rodar `npm install` após clonar.
- Schema por SEÇÃO (`secoes/<secao>/schema.json`, versao 1), subconjunto de JSON Schema (object/string/array, required). Campo não declarado no schema = erro.
- `pagina.yaml`: `pagina: {lang, titulo, descricao}` + `secoes: [{id, dados}]`. Tipografia/estilo (`tipo-N`, `estilo-*`) ainda NÃO implementados. Campo `tipo: site|landing` (validação de ordem) é planejado, não implementado.
- Uso: `node build.mjs <cliente>` (padrão: teste) → `clientes/<cliente>/dist/{index.html,style.css}`.
## Em aberto (confirmar com o usuário)
- Nomes das famílias de seção são propostas; confirmar.
- Cabeçalho e rodapé não constam na estrutura informada; decidir se entram como elementos fixos de apoio.
- Confirmar se as 5 famílias compartilhadas ficam únicas ou se alguma deve ser dividida (decidir no Comando 1 de cada seção).
## Feito
- Fase 0: estrutura (`tokens/`, `secoes/hero/`, `clientes/teste/`), `tokens/base.css` (espaçamento, tipografia, paleta de teste semântica), `build.mjs`, seção `hero-a` + `schema.json`, `clientes/teste/pagina.yaml`.
- Verificado: build do cliente teste OK; build falha (exit 1) com campo vazio e com `{{placeholder}}` sobrando.
- Documentação alinhada à estrutura de site (8) e landing (9): README (seção 2.1), CLAUDE.md e este arquivo.
## Próximo
- Criar `INDEX.md` (1 linha por variante; hero-a ainda não está listada).
- Revisar o schema do `hero` para atender site e landing (imagem opcional) — hoje exige titulo, subtitulo e cta.
- Fase 1: `qa.mjs`, testes de `build.mjs`, seções na ordem de criação acima, `gerar-paleta.mjs`, tipografia/estilos.
