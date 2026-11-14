# Design system de landing pages (por IDs de seção)

## Objetivo

Gerar landings e sites de clientes, de vários nichos, a partir de um `pagina.yaml`
com IDs de variantes (ex.: hero-b, atuacao-c, faq-a, tipo-3, estilo-sobrio) + copy.
Prioridade: economia de tokens por página nova.

## Stack

HTML/CSS estático, build em Node (`build.mjs`), sem framework.
Saída: `clientes/<nome>/dist/` independente do sistema.

## Convenções

- IDs: `<secao>-<letra>` (hero-a, hero-b). Tipografia `tipo-N`. Estilo `estilo-<nome>`.
- Cada seção em `secoes/<secao>/`: `<id>.html`, `<id>.css`, `schema.json`.
- TODAS as variantes de uma seção usam o MESMO `schema.json`.
- Variantes devem diferir em ESTRUTURA, não só em cor.
- Componentes só usam tokens CSS semânticos (--bg, --surface, --text, --muted,
--accent, --on-accent, --border). Nunca hex direto.
- Campo obrigatório vazio ou `{{placeholder}}` sobrando = o build FALHA.
Nunca preencher dado do cliente com valor inventado.
- Toda variante nova entra no `INDEX.md` (1 linha: o que é, quando usar, limites, se exige imagem).

## Nichos

- Cada nicho tem um perfil em `nichos/<nicho>/`: `nicho.yaml` (tipos de página, ordem
das seções, regras, tom, CTA), `briefing.md` e `conteudo.md`. Modelo em `nichos/_modelo/`.
- Ao montar uma página, ler SÓ o perfil do nicho do cliente. Não ler os de outros nichos.
- A ordem das seções vem do `nicho.yaml` (regra de congruência): não reordenar nem
pular seção sem decisão do usuário.
- As famílias de seção ficam todas em `secoes/` e são compartilhadas entre nichos.
Criar família nova só quando um nicho precisar. Famílias compartilhadas usam campos
opcionais para o que muda entre tipos de página ou nichos.
- `nunca_inventar`, `proibido` e `termos_vetados` do nicho valem como regra de conteúdo.
- Nicho novo: propor o perfil em texto (tipos de página, ordem, famílias reaproveitadas
e novas, perguntas do briefing, regras) e esperar aprovação antes de criar arquivos.
- `pagina.yaml` com `nicho` e `tipo` (e validação da ordem pelo build) é PLANEJADO,
ainda não implementado.

## Contrato técnico das variantes (build.mjs)

- `<id>.html` usa: `{{campo}}` (valor escapado; vazio = build falha), `{{#if campo}}...{{/if}}`
(campo opcional: o bloco some se vazio), `{{#each lista}}...{{/each}}` (dentro, `{{campo}}` lê
do item ou do escopo externo; `{{this}}` = item de lista de texto). Listas de tamanho variável
SEMPRE com `each`; nunca `{{lista.0.x}}`.
- `schema.json` (subconjunto de JSON Schema): `type`, `required`, `properties`, `items`,
`minLength`, `maxLength`, `maxItems`, `enum`, `format: "url"`. Fora de `required` = opcional
(vazio passa; preenchido é validado). Campo não declarado = erro. Campo de URL usa `format: "url"`
(bloqueia `javascript:`). Campos de imagem: objeto `{src, alt}` com `alt` obrigatório.
- Arquivos opcionais: `<id>.js` vira `dist/script.js` (`defer`); `clientes/<nome>/custom.css` é
anexado por último ao `style.css`; `clientes/<nome>/assets/` é copiado para `dist/assets/`.
- `lint.mjs` existe (Passo 3): `node lint.mjs`. A raiz de cada variante leva `id="<familia>"` (ex.: `id="contato"`) para os links `#contato` do CTA.
- No `pagina.yaml`, SEMPRE entre aspas: textos com `:` ou `#`, telefones, números e yes/no
(senão o YAML os converte e o build acusa "esperado texto").
- Todo `<id>.html` começa com comentário de 1 linha (ID e descrição). Não escrever `{{` em comentários.

## Referências, efeitos e animações

- Referência (link ou print) é fonte de TÉCNICA, nunca de conteúdo: não copiar
textos, imagens, logos nem código proprietário de terceiros.
- Animação só enfeita: o conteúdo deve ficar visível e legível sem ela
(QA e screenshots dependem disso).
- Animar só `transform` e `opacity`, 150-400 ms, com `--dur` e `--ease`.
Respeitar `prefers-reduced-motion`.
- JS só se necessário, em arquivo opcional da variante (`<id>.js`). Sem bibliotecas pesadas.
- Campo novo exigido por um efeito deve ser OPCIONAL; mudar o `schema.json`
exige revisar todas as variantes da seção e incrementar `versao`.
- Refinar uma variante por sessão, no máximo 2-3 rodadas.

## Como trabalhar (economia de tokens)

- Para montar uma página: ler só `INDEX.md`, os `schema.json` dos IDs escolhidos e o
perfil do nicho. NÃO abrir os arquivos das variantes, salvo para criar ou corrigir uma.
- Verificação deste projeto = `node build.mjs <cliente>` + `node qa.mjs <cliente>`.
`qa.mjs` existe (Passo 2): roda o build e verifica placeholders, alt, links, títulos, peso, overflow e contraste em 375/768/1280 (Chrome/Edge headless; prints em `clientes/<nome>/qa/`).
Não usar agentes de code-review, planner ou TDD amplo a cada edição (isto substitui as
regras globais de 80% de cobertura e review automático). Testes só para build.mjs,
qa.mjs e gerar-paleta.mjs (`npm test` = `node --test`, arquivos em `test/`).
- Screenshots via Chrome headless para arquivo; não usar o painel do app.
- Fazer uma etapa por sessão. Ao terminar, atualizar `PROGRESSO.md`.
- Mudança de contrato (schema) exige aviso e incremento de `versao`.

## Commits

- Todo commit leva no corpo um parágrafo "Observacao:" explicando em linguagem
simples o que entrou e por quê.
- Antes de commitar, perguntar ao usuário se ele ou o Claude escreve a observação
(salvo se ele já tiver dito ou enviado o texto).
- Formato: `tipo: descrição`, linha em branco, `Observacao: ...`.

## Estado

Ler `PROGRESSO.md` ao retomar.
