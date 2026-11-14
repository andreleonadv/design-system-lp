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
- Verificação deste projeto = `node build.mjs` + `node qa.mjs`. Não usar agentes
de code-review, planner ou TDD amplo a cada edição (isto substitui as regras
globais de 80% de cobertura e review automático). Testes só para build.mjs,
qa.mjs e gerar-paleta.mjs.
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
