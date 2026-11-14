# Design System de Landing Pages — Tutorial Completo

Este documento é um **tutorial passo a passo**. Quem ler do início ao fim sabe exatamente o que fazer, em que ordem e quais comandos dar para:

1. montar o sistema (fundação, tokens, seções e variantes);
2. personalizar cada seção com referências (efeitos, microanimações, tipografia, cores);
3. criar a landing page de um cliente usando só IDs.

> **Para o modelo (Claude):** não leia este arquivo por padrão. Ele é longo e serve ao humano. As regras de trabalho estão no `CLAUDE.md`; o estado está no `PROGRESSO.md`.
>
> Os números de economia de tokens citados aqui são **estimativas**, não medições. Nomes de scripts e a forma exata de chamá-los (por exemplo `node build.mjs clientes/teste`) são **sugestões**: confirme na Fase 0 o que o `build.mjs` realmente aceita e ajuste este tutorial.

---

## Sumário

0. [Onde estou? (checklist de progresso)](#0-onde-estou-checklist-de-progresso)
1. [A ideia em 5 minutos](#1-a-ideia-em-5-minutos)
2. [Conceitos que você precisa conhecer](#2-conceitos-que-você-precisa-conhecer)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Mapa do caminho (visão geral)](#4-mapa-do-caminho-visão-geral)
5. [Passo 0 — Preparar o ambiente](#5-passo-0--preparar-o-ambiente)
6. [Passo 1 — Fase 0: fundação](#6-passo-1--fase-0-fundação)
7. [Passo 2 — QA automático](#7-passo-2--qa-automático)
8. [Passo 3 — Tokens provisórios](#8-passo-3--tokens-provisórios)
9. [Passo 4 — Criar uma seção (roteiro de 4 comandos)](#9-passo-4--criar-uma-seção-roteiro-de-4-comandos)
10. [Como personalizar com referências](#10-como-personalizar-com-referências)
11. [Passo 5 — Tipografias e paletas finais](#11-passo-5--tipografias-e-paletas-finais)
12. [Passo 6 — Catálogo](#12-passo-6--catálogo)
13. [Passo 7 — Criar a página de um cliente](#13-passo-7--criar-a-página-de-um-cliente)
14. [Passo 8 — Congelar a v1 e entrar na rotina](#14-passo-8--congelar-a-v1-e-entrar-na-rotina)
15. [Quando o cliente pede algo fora do catálogo](#15-quando-o-cliente-pede-algo-fora-do-catálogo)
16. [Sessões, tokens e git](#16-sessões-tokens-e-git)
17. [Comandos de referência](#17-comandos-de-referência)
18. [Problemas comuns](#18-problemas-comuns)
19. [Limites do sistema](#19-limites-do-sistema)
20. [Glossário](#20-glossário)

---

## 0. Onde estou? (checklist de progresso)

Marque conforme avançar. Cada item é explicado nos passos abaixo.

- [ ] Passo 0: ambiente pronto (Node, git, pasta, `CLAUDE.md`, `PROGRESSO.md`, commit inicial)
- [ ] Passo 1: Fase 0 (build, tokens base, `hero-a`, página de teste)
- [ ] Passo 2: `qa.mjs` funcionando
- [ ] Passo 3: 1 tipografia e 1 paleta provisórias
- [ ] Passo 4: seções criadas (marque cada uma)
  - [ ] cabeçalho
  - [ ] hero
  - [ ] como funciona
  - [ ] cards
  - [ ] prova social
  - [ ] FAQ
  - [ ] CTA final
  - [ ] rodapé
- [ ] Passo 5: 5 tipografias e 5 paletas finais
- [ ] Passo 6: catálogo gerado
- [ ] Passo 7: piloto com cliente real
- [ ] Passo 8: v1 congelada (`git tag v1`)
- [ ] Passo 9 (opcional): automação de entrada (novo-cliente, imagens, pendências)

---

## 1. A ideia em 5 minutos

**Problema:** criar muitas landing pages de clientes por dia sem gastar uma montanha de tokens, mantendo qualidade e consistência.

**Solução:** uma biblioteca de peças prontas (seções com várias variantes, tipografias, paletas). Para cada cliente você apenas **escolhe os IDs** (`hero-b`, `como-funciona-c`, `cards-a`…) e **preenche o conteúdo**. Um script monta a página.

**Analogia:** as seções são peças de Lego. A página é a montagem. O arquivo `pagina.yaml` é a planta que diz quais peças usar e em que ordem.

**Onde a economia é real:**
- menos decisões de design por página (você já decidiu quando criou a biblioteca);
- menos ciclos de correção (peças já testadas em celular, contraste e acessibilidade);
- QA automático por script, sem gastar tokens do modelo;
- consistência entre páginas.

**Onde não é:**
- fotos e textos do cliente continuam dando trabalho;
- variantes que nunca são usadas viram peso morto;
- o investimento inicial é alto (várias sessões), e só compensa se você fizer muitas páginas. Estimativa: se paga entre a 5ª e a 10ª página.

**Resumo:** você investe agora numa biblioteca de peças; depois cada página é só escolher IDs e preencher texto.

---

## 2. Conceitos que você precisa conhecer

| Conceito | O que é | Exemplo |
|---|---|---|
| **Token** | Uma decisão visual guardada em variável CSS | `--accent` (cor de destaque) |
| **Token semântico** | Nomeado pela função, não pela aparência | `--accent`, não `--azul` |
| **Seção** | Um bloco da página | hero, como funciona, cards |
| **Variante** | Uma versão estrutural de uma seção | `hero-a`, `hero-b`, `hero-c` |
| **ID** | Nome único de uma variante, também usado como nome de arquivo | `hero-b` |
| **Schema** (contrato) | Lista dos campos que uma seção aceita; igual para todas as variantes | `titulo`, `subtitulo`, `cta` |
| **`pagina.yaml`** | A planta da página de um cliente: tema, IDs e conteúdo | ver Passo 7 |
| **Build** | Script que monta o HTML final | `node build.mjs ...` |
| **QA** | Script que verifica a página automaticamente | `node qa.mjs ...` |
| **Catálogo** | Página gerada que mostra todas as variantes lado a lado | para **você** escolher |
| **`INDEX.md`** | Lista em texto, uma linha por variante | para o **modelo** escolher |
| **Sessão** | Uma conversa com o modelo | uma etapa por sessão |
| **`PROGRESSO.md`** | Ponte entre sessões: feito, decisões, próximo | lido no início de cada sessão |

### As três camadas

1. **Tokens:** cores, tipografia, raio, sombra, espaçamento.
2. **Seções:** hero, como funciona, cards etc., cada uma com várias variantes e um schema comum.
3. **Composição:** o `pagina.yaml` de cada cliente.

### Regra de ouro dos contratos

**Todas as variantes de uma seção aceitam exatamente os mesmos dados.** Assim, trocar `cf-a` por `cf-d` é mudar um ID, sem reescrever conteúdo. Se uma variante precisar de campo extra, ele deve ser **opcional**.

### Por que um arquivo por variante

Cada variante tem seus próprios arquivos (`hero-a.html`, `hero-a.css`). Motivos: o modelo abre só o que precisa (economia), o build liga ID a arquivo sem procurar, e editar uma variante não arrisca as outras.

**Resumo:** tokens (aparência), seções (estrutura), `pagina.yaml` (composição). Mesmo schema em todas as variantes. Um arquivo por variante.

---

## 3. Estrutura de pastas

```
design-system-lp/
  CLAUDE.md              # regras curtas (< 100 linhas), lidas pelo modelo a cada turno
  PROGRESSO.md           # ponte entre sessões
  README.md              # este tutorial (para humanos)
  INDEX.md               # 1 linha por variante: o que é, quando usar, limites
  .gitignore             # inclui graphify-out/
  tokens/
    base.css             # reset, escala, grid
    tipografia/tipo-1.css ... tipo-5.css
    paleta/paleta-1.css ... paleta-5.css   # presets (clientes sem marca)
    estilo/sobrio.css, suave.css, ...      # raio, sombra, densidade
    gerar-paleta.mjs     # 1-2 cores da marca -> tokens completos, com checagem de contraste
  secoes/
    hero/
      schema.json        # contrato da seção (1 por seção)
      hero-a.html  hero-a.css  [hero-a.js opcional]
      hero-b.html  hero-b.css
      hero-c.html  hero-c.css
    como-funciona/ ...
    cards/ ...
  build.mjs              # lê pagina.yaml e gera o HTML final
  qa.mjs                 # verificações automáticas
  catalogo/              # GERADO: mostruário de todas as variantes
  clientes/
    <nome>/
      briefing.md        # material do cliente
      pagina.yaml        # a planta da página
      custom.css         # (opcional) pequenas sobrescritas
      assets/            # logo, fotos
      dist/              # GERADO: a página pronta
```

Cada arquivo `.html` de variante deve ter, no topo, um comentário com o ID e uma linha de descrição.

**Resumo:** tokens, seções, clientes, mais os scripts `build.mjs` e `qa.mjs`. `catalogo/` e `dist/` são gerados, não escritos à mão.

---

## 4. Mapa do caminho (visão geral)

```
Passo 0  Ambiente
Passo 1  Fase 0: fundação (build + hero-a + página de teste)
Passo 2  QA automático
Passo 3  Tokens provisórios (1 tipografia, 1 paleta)
Passo 4  Para CADA seção:  definir → base → refinar com referências → derivar variantes
Passo 5  Tipografias e paletas finais (5 de cada)
Passo 6  Catálogo
Passo 7  Piloto: página de um cliente real
Passo 8  Congelar v1 → rotina diária
Passo 9  (opcional) Automação de entrada: esqueleto, imagens, pendências
```

Regra de ouro do processo: **uma etapa por sessão**, sempre terminando com `PROGRESSO.md` atualizado e commit.

**Resumo:** fundação, QA, tokens provisórios, loop de seções, tokens finais, catálogo, piloto, v1.

---

## 5. Passo 0 — Preparar o ambiente

**Objetivo:** ter pasta, git e os dois arquivos de instrução.

1. Conferir ferramentas (Node 18 ou superior, git, Chrome ou Edge):

   ```bash
   node -v
   ```

   ```bash
   git --version
   ```

2. Criar a pasta e o repositório:

   ```bash
   mkdir "D:\CLAUDE PROJECTS\design-system-lp"
   ```

   ```bash
   cd "D:\CLAUDE PROJECTS\design-system-lp"
   ```

   ```bash
   git init
   ```

3. Decidir três coisas (anote no `PROGRESSO.md`):
   - **nicho inicial** (sugestão: um só, por exemplo advocacia);
   - **CTA padrão** (por exemplo WhatsApp com mensagem pré-preenchida);
   - **2 ou 3 referências visuais** de páginas que você admira.

4. Criar o `CLAUDE.md` (curto, menos de 100 linhas) e o `PROGRESSO.md`. O modelo de ambos está nos arquivos deste repositório.

5. Primeiro commit. No PowerShell do Windows (5.1) o `&&` **não funciona**; rode os comandos separados:

   ```bash
   git add .
   ```

   ```bash
   git commit -m "chore: base do design system"
   ```

   Se der `Author identity unknown`, configure uma vez:

   ```bash
   git config --global user.name "Seu Nome"
   ```

   ```bash
   git config --global user.email "seu@email.com"
   ```

**Pronto quando:** `git log` mostra o commit inicial.

**Resumo:** Node, git, pasta, `CLAUDE.md`, `PROGRESSO.md`, decisões de nicho/CTA/referências e o primeiro commit.

---

## 6. Passo 1 — Fase 0: fundação

**Objetivo:** ter o motor funcionando com **uma** seção, antes de criar qualquer variante.

Abra uma **sessão nova dentro da pasta** `design-system-lp` (é assim que o `CLAUDE.md` carrega) e cole:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Fase 0, só isto: crie a estrutura de pastas, tokens/base.css (escala de espaçamento, tipografia e uma paleta de teste com os tokens semânticos), build.mjs (lê clientes/<nome>/pagina.yaml, valida contra o schema.json, monta o HTML em dist/ e falha com campos vazios), a seção hero-a com schema, e clientes/teste/pagina.yaml. Não crie outras variantes nem o QA ainda. Ao final rode o build e me diga o que passou ou falhou. Atualize o PROGRESSO.md.
```

**Revise antes de seguir:** o `schema.json` do hero. Ele serve de molde para todas as outras seções.

**Se o modelo propuser** framework, TypeScript ou algo "mais robusto": recuse. A simplicidade é o que economiza tokens.

**Pronto quando:** o build gera `clientes/teste/dist/index.html` e ele abre no navegador.

**Feche a sessão:** `PROGRESSO.md` atualizado e commit (`feat: fase 0 fundação`).

**Resumo:** uma sessão, um prompt, e o resultado é um build funcionando com `hero-a`. Revise o schema do hero e não aceite frameworks.

---

## 7. Passo 2 — QA automático

**Objetivo:** um script que verifica a página sem gastar tokens do modelo.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Crie qa.mjs que, para um cliente, verifica: placeholders {{...}} sobrando e campos obrigatórios vazios; contraste de texto sobre fundo; overflow horizontal em 375, 768 e 1280 px; imagens sem alt; links vazios ou "#"; ordem dos títulos (h1, h2); peso da página. Gere screenshots por viewport em arquivo usando Chrome headless (não o painel do app). Rode sobre clientes/teste e reporte. Não crie variantes novas.
```

**Por que Chrome headless:** o painel oculto do app não renderiza frames, então prints saem em branco e efeitos que dependem de rolagem não disparam.

**Pronto quando:** `qa.mjs` roda na página de teste e reporta resultados claros (passou ou o que falhou).

**Resumo:** o QA por script substitui revisões visuais caras. Ele é o juiz de cada variante daqui para frente.

---

## 8. Passo 3 — Tokens provisórios

**Objetivo:** enquanto cria as seções, ter pelo menos uma tipografia e uma paleta reais para testar.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Crie tokens/tipografia/tipo-1.css (fontes: [TÍTULO] e [TEXTO], do Google Fonts; escala de tamanhos, pesos e line-height) e tokens/paleta/paleta-1.css (tokens semânticos: --bg, --surface, --text, --muted, --accent, --on-accent, --border; cores: [...]). Verifique contraste AA. Aplique na página de teste e rode build + qa.
```

As 5 tipografias e 5 paletas finais ficam para o Passo 5, quando você já tiver seções para testá-las.

**Resumo:** 1 tipografia e 1 paleta provisórias bastam para desenvolver as seções.

---

## 9. Passo 4 — Criar uma seção (roteiro de 4 comandos)

Este é o **ciclo central**. Repita para cada seção, trocando `[SEÇÃO]`.

**O ciclo tem 4 comandos:**

| Comando | O que faz | Quem decide |
|---|---|---|
| 1. Definir | Fixa o contrato (schema) e os eixos de variação, sem código | Você aprova |
| 2. Criar a base | Gera a variante `-a` e valida no build e no QA | Você olha o screenshot |
| 3. Refinar | Personaliza a base com referências, efeitos e microanimações | Você dirige |
| 4. Derivar | Cria as demais variantes e fecha a seção | Você confere no catálogo |

> Se você viu um roteiro de 3 comandos em outro lugar (por exemplo numa conversa anterior), a diferença é só esta: o refinamento com referências (Comando 3) foi acrescentado, e o antigo "Comando 3" virou o Comando 4.

**Ordem das seções:** cabeçalho, hero, como funciona, cards, prova social, FAQ, CTA final, rodapé. Comece pelo **hero**, que já existe como base desde a Fase 0, e siga a lista. Faça **uma seção por sessão**, ou duas se forem simples (por exemplo rodapé e CTA final).

**Pré-requisito:** Passos 1 a 3 concluídos.

### Comando 1 — Definir (nada de código ainda)

**O que faz:** o modelo propõe os campos do schema, os eixos de variação e qual será a variante base, sem escrever nenhuma variante.
**Quando usar:** sempre, no início de cada seção. É barato e **evita variantes parecidas entre si**.
**O que esperar:** uma proposta curta em texto, que você aprova ou ajusta antes de qualquer código.


```text
Leia o CLAUDE.md e o PROGRESSO.md. Vamos criar a seção [SEÇÃO]. Ainda NÃO escreva código de variante. Entregue só:
1) Os campos do schema.json da seção (obrigatórios ou opcionais, tipo: texto/imagem/lista, limite de tamanho e fonte esperada: briefing, logo ou foto).
2) Os eixos de variação: [N] variantes que difiram em ESTRUTURA, com uma linha cada (o que é e quando usar).
3) Qual será a variante base (a).
Espere minha aprovação.
```

Você revisa e aprova ou ajusta. É a sua decisão mais barata e mais importante: **depois dela o contrato está fixo**, e mudá-lo mais tarde exige revisar todas as variantes.

### Comando 2 — Criar a base e validar

**O que faz:** cria o `schema.json` e a variante `-a` (HTML e CSS), encaixa a seção na página de teste e roda build e QA.
**Quando usar:** logo depois de aprovar o Comando 1.
**O que esperar:** a seção aparecendo na página de teste, mais um relatório do que passou ou falhou no QA.

```text
Aprovado. Crie o schema.json e a variante [seção]-a (html + css) seguindo o CLAUDE.md. Só tokens, sem hex. Adicione uma seção no clientes/teste/pagina.yaml usando [seção]-a, rode o build e o qa, e me diga o que passou ou falhou. Não crie as outras variantes ainda.
```

**Pronto quando:** a página de teste builda com a seção e o QA passa em 375, 768 e 1280 px. **Olhe o screenshot uma vez**, antes de derivar as outras variantes: é mais barato corrigir a base agora do que corrigir todas depois.

### Comando 3 — Refinar com referências (você trabalha individualmente aqui)

**O que faz:** você personaliza a variante do jeito que quer, trazendo referências de outras páginas para pegar efeitos e microanimações.
**Quando usar:** com a base já validada (Comando 2) e, depois, em cada variante derivada, se quiser personalizá-la.
**O que esperar:** de 2 a 3 rodadas de ajuste, no máximo, até a variante ficar como você quer.

O prompt, as regras e as dicas de custo estão na [seção 10](#10-como-personalizar-com-referências). Em resumo: copie a técnica, nunca o conteúdo; a animação só enfeita; e dê feedback específico.

### Comando 4 — Derivar as outras variantes e fechar

**O que faz:** cria as variantes `-b`, `-c` etc. com o mesmo schema, registra cada uma no `INDEX.md`, valida e faz o commit.
**Quando usar:** só depois de a base estar aprovada e refinada.
**O que esperar:** variantes novas na página de teste, `INDEX.md` e `PROGRESSO.md` atualizados e um commit da seção. Como o contrato já existe, esta etapa pode ser feita com um modelo mais barato.

```text
A base [seção]-a está aprovada. Crie as variantes [seção]-b até [seção]-[última] conforme os eixos aprovados, usando [seção]-a como referência de estrutura e o MESMO schema.json. Para cada uma: adicione ao INDEX.md (1 linha: o que é, quando usar, limites, se exige imagem), troque o ID no clientes/teste/pagina.yaml, rode build + qa. Ao terminar: atualize o PROGRESSO.md e faça um commit "feat: seção [SEÇÃO] (N variantes)".
```

Cada variante derivada também pode passar pelo refinamento da [seção 10](#10-como-personalizar-com-referências) (uma por sessão).

### Checklist de fechamento de cada seção

- [ ] `schema.json` único para a seção
- [ ] cada variante com `.html` e `.css`, usando só tokens (nenhum hex)
- [ ] todas passam em build e QA com os mesmos dados de teste
- [ ] `INDEX.md` com uma linha por variante
- [ ] `PROGRESSO.md` atualizado e commit feito

### Regras que mantêm o padrão

1. **Não pule o Comando 1.** Sem ele o modelo cria variantes que só diferem em cor.
2. **Não mude o `schema.json`** com variantes já criadas sem avisar e incrementar a `versao`.
3. **Variantes diferem em estrutura**, não em cor (cor é trabalho dos tokens).

**Resumo:** para cada seção: definir (você aprova), criar a base, refinar com referências, derivar as outras, fechar com checklist e commit.

---

## 10. Como personalizar com referências

Aqui você deixa cada variante do seu jeito, usando outras páginas como inspiração para **efeitos e microanimações**.

### Modelo de prompt

```text
Na variante [id], quero aproveitar [o que]: [descreva o efeito] (referência: [link ou print em clientes/.../refs/]).
Reproduza a TÉCNICA em CSS usando só os tokens. Não copie textos, imagens, logos nem código do site. Duração e curva via --dur e --ease. Respeite prefers-reduced-motion. O conteúdo deve ficar visível mesmo sem a animação. Rode build + qa e mostre o screenshot de 375 e 1280 px.
```

### Regras

- **Copie a técnica, não o conteúdo.** Efeitos são ideias; textos, imagens, logos e código proprietário de terceiros não podem ser copiados.
- **A animação só enfeita.** Sem ela, a página precisa funcionar e ficar legível. Isso também mantém o QA confiável.
- **Seja leve:** anime só `transform` e `opacity`, entre 150 e 400 ms, e respeite `prefers-reduced-motion`.
- **JavaScript só se precisar,** num arquivo opcional da variante (`hero-b.js`). Nada de bibliotecas pesadas.
- **Campo novo = campo opcional.** Se o efeito exigir dado novo (ex.: vídeo de fundo) e o `schema.json` mudar, revise todas as variantes da seção e incremente a `versao`.

### Como gastar pouco

- Uma variante por sessão.
- Feedback **específico** vale mais que "melhore": *"título grande demais no mobile; aumente o espaço do botão"*.
- Limite de 2 a 3 rodadas por variante, e uma definição de pronto: build e QA passam e você aprovou no catálogo.
- Capriche mais nas seções que aparecem em toda página (hero, cards, CTA) e aceite acabamento mais simples nas outras.

**Resumo:** referência é fonte de técnica, nunca de conteúdo. Peça o efeito com o prompt acima, mantenha leve e acessível, e limite as rodadas.

---

## 11. Passo 5 — Tipografias e paletas finais

**Objetivo:** fechar 5 tipografias, 5 paletas (presets) e 2 ou 3 pacotes de estilo, testados em seções reais.

### Tipografia

1. Descubra as fontes de sites que você admira: botão direito no texto, **Inspecionar**, aba de estilos, `font-family` (ou uma extensão como WhatFont).
2. Para cada par, anote: fonte dos títulos, fonte do texto e o site de origem.
3. Prompt:

   ```text
   Crie tokens/tipografia/tipo-[N].css com títulos em [FONTE A] e texto em [FONTE B] (Google Fonts). Defina escala de tamanhos, pesos, line-height e letter-spacing. Máximo 2 famílias e 3 pesos. Confirme que acentos do português ficam bons. Inspirado em [site].
   ```

**Cuidados:** licença (Google Fonts é livre; fontes pagas exigem licença), peso na página e acentos.

### Paleta

1. Capture as cores da referência (conta-gotas do navegador ou print).
2. Prompt:

   ```text
   Crie tokens/paleta/paleta-[N].css a partir destas cores: [lista com o papel de cada uma: fundo, texto, destaque...]. Mapeie para os tokens semânticos, gere tema claro e escuro e verifique contraste AA. Se alguma combinação reprovar, ajuste e me diga o que mudou.
   ```

3. **Clientes com marca** não usam preset: o `gerar-paleta.mjs` parte de 1 ou 2 cores do cliente e deriva a escala com checagem de contraste.

### Estilo

2 ou 3 pacotes (ex.: sóbrio, suave, editorial) que definem raio, sombra, densidade e borda. Mudam a "personalidade" sem criar componentes.

**Atenção:** inspirar-se em uma paleta é normal; copiar a identidade completa de uma marca conhecida, não.

**Resumo:** descubra fontes e cores pelo navegador, peça os arquivos com os prompts acima, confira licença e contraste, e compare no catálogo.

---

## 12. Passo 6 — Catálogo

**Objetivo:** uma página gerada que mostra todas as variantes, tipografias e paletas lado a lado, com os mesmos dados de teste. É a **sua** ferramenta para escolher.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Crie um script (catalogo.mjs) que gera catalogo/index.html a partir de secoes/, tokens/tipografia e tokens/paleta: mostra cada variante com os dados de teste, com seletor de tipografia e de paleta. Deve ser gerado, nunca escrito à mão. Gere também uma imagem única (screenshot) do catálogo via Chrome headless.
```

O nome `catalogo.mjs` é uma sugestão; use o que o modelo criar e anote no `PROGRESSO.md`.

**Resumo:** o catálogo é gerado dos mesmos arquivos do sistema e serve para você olhar e escolher.

---

## 13. Passo 7 — Criar a página de um cliente

Este é o fluxo completo. O **piloto** é a primeira vez; depois vira rotina.

### 13.1 Briefing

Crie `clientes/<nome>/briefing.md` e a pasta `assets/` com:
- nome, serviços e diferenciais;
- contatos e CTA;
- logo, fotos e cores da marca (se houver);
- textos já aprovados;
- regras do nicho (ex.: advocacia e saúde têm limites de publicidade; **não invente número, depoimento ou promessa**).

### 13.2 Escolher no catálogo

Abra o catálogo e anote:
- IDs das seções, na ordem;
- tipografia (`tipo-N`) e estilo;
- paleta: preset ou gerada a partir das cores da marca.

### 13.3 Pedir a página ao modelo

Sessão nova:

```text
Crie a landing do cliente [NOME] (nicho [X]).
IDs: cabecalho-a, hero-b, como-funciona-c, cards-a, prova-social-a, faq-a, cta-a, rodape-a
Tipografia: tipo-3 | Estilo: sobrio | Paleta: gerar a partir de #[COR1] e #[COR2]
Material em clientes/[nome]/briefing.md e assets/.
Regras: leia só INDEX.md e os schema.json dos IDs escolhidos; não abra os arquivos das variantes. Não invente dado do cliente: se faltar um campo obrigatório, liste o que falta e pergunte. Escreva o pagina.yaml, rode build e qa, corrija o que o QA apontar e me diga o resultado.
```

### 13.4 O que o `pagina.yaml` contém

```yaml
cliente: exemplo-advocacia
nicho: advocacia
versao: 1
tema:
  cores: ["#1f3a5f", "#b08d57"]
  tipografia: tipo-3
  estilo: sobrio
secoes:
  - cabecalho: cabecalho-a
    logo: assets/logo.svg
  - hero: hero-b
    titulo: "..."
    subtitulo: "..."
    cta: { texto: "Falar no WhatsApp", link: "https://wa.me/..." }
  - como-funciona: cf-c
    passos:
      - { titulo: "...", texto: "..." }
  - cards: cards-a
    itens: [ ... ]
  - faq: faq-a
  - rodape: rodape-a
```

**Regra de segurança:** campo obrigatório vazio ou `{{placeholder}}` sobrando **faz o build falhar**. O sistema nunca preenche dado do cliente com valor inventado.

### 13.5 Revisar e ajustar

1. Abra `clientes/<nome>/dist/index.html` no navegador e olhe no celular e no desktop.
2. Peça ajustes de **copy e imagens** de forma específica.
3. Ajustes visuais pequenos vão no `custom.css` do cliente (ver [seção 15](#15-quando-o-cliente-pede-algo-fora-do-catálogo)).
4. Rode o QA de novo.

### 13.6 Fechar

`PROGRESSO.md` (só se aprendeu algo para o sistema) e commit da pasta do cliente:

```bash
git add clientes/<nome>
```

```bash
git commit -m "feat: landing <nome>"
```

**No piloto,** anote o que faltou no sistema (campo, variante, limite). Isso alimenta o Passo 8.

### 13.7 Seções opcionais, copy e imagens

**Todas as seções precisam estar preenchidas?** Não. A página tem só as seções listadas no `pagina.yaml`.

- **Nível da página:** recomenda-se um mínimo fixo de **hero, CTA e rodapé**. O resto é opcional (sem depoimentos, não coloque `prova-social`).
- **Nível do campo:** numa seção escolhida, os campos **obrigatórios** do schema precisam estar preenchidos, senão o build falha. Os **opcionais** podem ficar vazios, e nesse caso o elemento correspondente some em vez de aparecer com texto de exemplo.
- **A variante depende do material.** Sem foto boa, escolha uma variante que não exija imagem (o `INDEX.md` informa se cada variante exige).

**Como alimentar a copy:**

1. Use um `briefing.md` estruturado: serviços, diferenciais, público, contatos, CTA, textos já aprovados e regras do nicho. Pode virar um formulário (por exemplo Google Forms) que o cliente responde sozinho.
2. O modelo lê o briefing e preenche o `pagina.yaml` seguindo o schema de cada seção e o esquema de conteúdo do nicho.
3. Cada trecho é marcado como `briefing` (veio do cliente) ou `gerado` (o modelo redigiu a partir do briefing), para facilitar a sua revisão.
4. O que o briefing não traz vira **lista de pendências**. O modelo não inventa dado do cliente.
5. **Você aprova a copy.** Em nichos regulados (advocacia, saúde) isso é obrigatório.

**Como alimentar as imagens:**

1. Coloque os arquivos em `clientes/<nome>/assets/` com nomes padronizados: `logo.svg`, `hero.jpg`, `equipe-1.jpg`, `equipe-2.jpg`.
2. O `pagina.yaml` aponta para esses arquivos. O texto alternativo (`alt`) é **obrigatório**, e o QA reprova imagem sem ele.
3. Imagem obrigatória que faltar faz o build falhar (ou você troca por uma variante sem imagem).
4. Fotos do cliente, da equipe e do escritório precisam vir do cliente. Imagens de banco ou geradas por IA servem só de apoio e, em advocacia e saúde, costumam enfraquecer a credibilidade; confira também a licença.
5. **Placeholder nunca vai ao ar:** o build precisa barrar.

**Resumo:** só entram as seções listadas, com o mínimo hero, CTA e rodapé. Copy vem do briefing, com origem marcada e pendências listadas. Imagens ficam em `assets/` com `alt` obrigatório, e nada de placeholder em produção.

**Resumo:** briefing, escolha de IDs no catálogo, prompt de criação, `pagina.yaml` com a copy, build e QA, revisão sua, commit. Nunca invente dado do cliente.

---

## 14. Passo 8 — Congelar a v1 e entrar na rotina

1. Corrija contratos e `INDEX.md` com o que o piloto mostrou (versione o schema se mudar).
2. Faça 1 ou 2 pilotos antes de ampliar variantes.
3. Congele:

   ```bash
   git tag v1
   ```

4. **Rotina diária por página:**

   | Etapa | Quem | Tempo/Token |
   |---|---|---|
   | Briefing | Você | — |
   | Escolher IDs no catálogo | Você | — |
   | Prompt de criação + `pagina.yaml` | Modelo | baixo |
   | Build + QA + correções | Modelo/script | baixo |
   | Revisão e ajustes de copy | Você + modelo | médio |

5. A partir daí, novas variantes só entram **quando uma página real pedir**.
6. **Regra dos dois:** se o mesmo ajuste for pedido em 2 clientes, vira opção ou variante do sistema.

### 14.1 Passo 9 (opcional): automação de entrada

Depois do piloto, você já sabe quais perguntas do briefing e quais campos importam. É a hora de automatizar a entrada de cada cliente. Estes scripts ainda **não existem**: são propostas para pedir ao modelo, uma por sessão.

| Automação | O que faz |
|---|---|
| `novo-cliente.mjs` | Você informa o nome e os IDs; ele cria `clientes/<nome>/` com `briefing.md` em branco, `assets/` e um `pagina.yaml` esqueleto com todos os campos obrigatórios, gerado a partir dos `schema.json` |
| Otimização de imagens | No build, converte para WebP ou AVIF, gera tamanhos menores para celular e grava largura e altura |
| Lista de pendências | Compara o `pagina.yaml` com os schemas e informa quais campos e imagens ainda faltam |
| Esquemas por nicho | Para cada nicho, define seções obrigatórias, avisos regulatórios e perguntas do briefing |
| Comando `/nova-pagina` | Conduz o fluxo: briefing, esqueleto, copy, build, QA |

**O que viabiliza isso:** cada campo do `schema.json` declara se é obrigatório, o tipo (texto, imagem, lista), o limite de tamanho e a fonte esperada (briefing, logo, foto). Com isso o esqueleto e a lista de pendências saem automaticamente. Por isso o Comando 1 da seção 9 já pede esses atributos.

**Fluxo ideal de ponta a ponta:**

```
novo-cliente → cliente responde o briefing → modelo preenche o pagina.yaml
→ lista de pendências → você aprova copy e imagens → build + QA → publicar
```

**Limite:** a aprovação da copy e as fotos reais continuam humanas. A automação reduz o trabalho, não elimina a revisão.

**Resumo:** corrija contratos com o piloto, congele a v1 e use a rotina por IDs. Expanda só por demanda real.

---

## 15. Quando o cliente pede algo fora do catálogo

| Situação | O que fazer |
|---|---|
| Ajuste visual pequeno (cor de um botão, espaçamento) | `clientes/<nome>/custom.css`, só com sobrescritas |
| Um campo a mais numa seção | Campo **opcional** no `schema.json` (versione) |
| Seção totalmente nova | Crie variante nova pelo roteiro do Passo 4 |
| Pedido repetido em 2 clientes | Promova para o sistema (variante ou opção) |

`custom.css` **não cria componentes novos**: só ajusta o existente.

**Resumo:** pequeno ajuste vai no `custom.css`; o que se repete entra no sistema.

---

## 16. Sessões, tokens e git

**Por que uma etapa por sessão:** a cada mensagem o modelo relê **toda** a conversa. Sessões longas custam mais e confundem. Sessões curtas começam leves lendo só `CLAUDE.md` e `PROGRESSO.md`.

**Abertura de toda sessão:**

```text
Leia o CLAUDE.md e o PROGRESSO.md e faça a próxima etapa.
```

**Fechamento de toda sessão:**

```text
Atualize o PROGRESSO.md (feito, decisões, próximo) e faça o commit desta etapa.
```

**O que vai no `PROGRESSO.md`:**
- **Feito:** o que já funciona.
- **Decisões:** escolhas que não podem ser refeitas (ex.: campos do schema do hero).
- **Próximo:** qual é a próxima etapa.

**Boas práticas de custo:**
- Modelo mais capaz na fundação e nos contratos; mais barato para derivar variantes depois que o contrato existe.
- Verificação visual consolidada: uma imagem do catálogo em vez de dezenas de prints.
- O modelo **não abre** os arquivos das variantes se só vai montar uma página: lê `INDEX.md` e os `schema.json`.
- Mantenha o `CLAUDE.md` com menos de 100 linhas.

**Atenção às regras globais:** suas regras do Claude (`~/.claude/rules`) podem exigir TDD com 80% de cobertura e agentes de revisão a cada mudança. Neste projeto o `CLAUDE.md` declara que a verificação é `build.mjs` + `qa.mjs`, e que testes automatizados cobrem apenas `build.mjs`, `qa.mjs` e `gerar-paleta.mjs`.

**Resumo:** uma etapa por sessão, `PROGRESSO.md` como memória, commit ao fechar.

---

## 17. Comandos de referência

**Git (rode separados no PowerShell do Windows 5.1):**

```bash
git status
```

```bash
git add .
```

```bash
git commit -m "feat: descrição"
```

```bash
git log --oneline
```

```bash
git tag v1
```

**Sistema** (nomes e argumentos exatos dependem do `build.mjs` criado na Fase 0; confirme lá):

```bash
node build.mjs clientes/<nome>
```

```bash
node qa.mjs clientes/<nome>
```

**Ferramentas:**

```bash
node -v
```

```bash
git --version
```

**Resumo:** git para histórico, `build` e `qa` para gerar e verificar.

---

## 18. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `&&` dá erro no PowerShell | PowerShell 5.1 não aceita `&&` | Rode os comandos em linhas separadas |
| `Author identity unknown` | git sem nome e e-mail | `git config --global user.name` e `user.email` |
| `nothing to commit` | Nada foi alterado ou já foi commitado | `git status` e `git log` |
| `not a git repository` | Pasta errada ou falta `git init` | `cd` para a pasta certa, `git init` |
| Screenshot em branco | Painel oculto do app não renderiza | Usar Chrome headless |
| Efeito de rolagem não aparece no print | Conteúdo depende de animação para ficar visível | Conteúdo deve ser visível sem animação |
| Build falha com campo vazio | Comportamento esperado | Preencher o campo no `pagina.yaml` |
| Variante nova quebra outras | Schema alterado | Versionar o schema e revisar a seção toda |
| Páginas parecidas demais | Pouca variedade de tokens | Usar mais estilos, tipografias e `custom.css` |
| Modelo propõe framework | Tendência a "robustecer" | Recusar; manter HTML/CSS estático |

**Resumo:** a maioria dos erros é de ambiente (PowerShell, git) ou de contrato (schema). Ambos têm solução simples.

---

## 19. Limites do sistema

- **Fotos e textos** continuam sendo o gargalo; o sistema acelera layout, não conteúdo.
- **Variantes nunca usadas** viram peso morto: corte.
- **Páginas parecidas:** o risco cai com tokens, estilos e `custom.css`, mas não some.
- **Mudança incompatível de componente** exige versionar o schema.
- **SEO e performance** entram desde a Fase 0 (meta tags, Open Graph, dados estruturados, peso das imagens), porque corrigir depois, página a página, custa muito mais.
- **Personalizar tudo é o caminho mais caro:** muitas variantes com várias rodadas cada exigem muitas sessões. Priorize as seções de uso universal.
- **Começar pelas variantes visuais** (a parte divertida) sem build, schema e QA gera arquivos soltos. Respeite a ordem.

**Resumo:** o sistema resolve layout e consistência, não conteúdo nem mídia. Priorize, corte e versione.

---

## 20. Glossário

- **Build:** script que transforma `pagina.yaml` + seções + tokens em HTML final.
- **Catálogo:** página gerada com todas as variantes, para você escolher visualmente.
- **Chrome headless:** Chrome rodando sem janela, usado para tirar screenshots e testar.
- **Contrato / schema:** lista dos campos que uma seção aceita; igual em todas as variantes.
- **`custom.css`:** sobrescritas pequenas e específicas de um cliente.
- **`dist/`:** pasta gerada com a página pronta de um cliente.
- **ID:** nome único de uma variante (`hero-b`), também nome de arquivo.
- **`INDEX.md`:** lista em texto das variantes, lida pelo modelo.
- **OKLCH:** espaço de cor que facilita derivar escalas previsíveis.
- **`pagina.yaml`:** planta da página: tema, IDs e conteúdo.
- **`PROGRESSO.md`:** registro entre sessões (feito, decisões, próximo).
- **QA automático:** script que verifica a página sem gastar tokens do modelo.
- **`prefers-reduced-motion`:** preferência do sistema de quem pede menos animação.
- **Sessão:** uma conversa com o modelo; o contexto cresce a cada turno.
- **Token (design):** variável CSS que guarda uma decisão visual.
- **Token (IA):** unidade de texto processada pelo modelo; é o que custa.
- **Token semântico:** nomeado pela função (`--accent`), não pela aparência.
- **Variante:** versão estrutural de uma seção (`hero-a`, `hero-b`).
- **WCAG AA:** nível mínimo de contraste de acessibilidade para texto.
