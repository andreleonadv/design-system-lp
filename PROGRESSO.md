# Progresso
## Decisões
- Nicho inicial: 
- CTA padrão: 
- Referências visuais: 
- Dependência única: `js-yaml` (parse do pagina.yaml). Rodar `npm install` após clonar.
- Schema por SEÇÃO (`secoes/<secao>/schema.json`, versao 1), subconjunto de JSON Schema (object/string/array, required). Campo não declarado no schema = erro.
- `pagina.yaml`: `pagina: {lang, titulo, descricao}` + `secoes: [{id, dados}]`. Tipografia/estilo (`tipo-N`, `estilo-*`) ainda NÃO implementados.
- Uso: `node build.mjs <cliente>` (padrão: teste) → `clientes/<cliente>/dist/{index.html,style.css}`.
## Feito
- Fase 0: estrutura (`tokens/`, `secoes/hero/`, `clientes/teste/`), `tokens/base.css` (espaçamento, tipografia, paleta de teste semântica), `build.mjs`, seção `hero-a` + `schema.json`, `clientes/teste/pagina.yaml`.
- Verificado: build do cliente teste OK; build falha (exit 1) com campo vazio e com `{{placeholder}}` sobrando.
## Próximo
- Criar `INDEX.md` (1 linha por variante; hero-a ainda não está listada).
- Fase 1: `qa.mjs`, testes de `build.mjs`, demais variantes, `gerar-paleta.mjs`, tipografia/estilos.
