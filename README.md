# Design System de Landing Pages por IDs de Seção

Material base e didático. Explica **o porquê**, **a arquitetura** e **como construir** um sistema que gera landing pages de clientes a partir de IDs de seções (`hero-b`, `como-funciona-c`, `cards-a`…), com o menor gasto de tokens por página.

> Os números de economia citados aqui são **estimativas**, não medições. Meça com suas próprias páginas.

---

## Sumário

1. [Objetivo e a pergunta inicial](#1-objetivo-e-a-pergunta-inicial)
2. [Onde a economia é real (e onde não é)](#2-onde-a-economia-é-real-e-onde-não-é)
3. [Arquitetura: três camadas](#3-arquitetura-três-camadas)
4. [Formato técnico e estrutura de pastas](#4-formato-técnico-e-estrutura-de-pastas)
5. [Tokens: a camada de variedade barata](#5-tokens-a-camada-de-variedade-barata)
6. [Seções e contratos](#6-seções-e-contratos)
7. [A especificação da página (`pagina.yaml`)](#7-a-especificação-da-página-paginayaml)
8. [Instruções para o modelo](#8-instruções-para-o-modelo)
9. [QA automático](#9-qa-automático)
10. [Como gastar tokens com eficiência na criação](#10-como-gastar-tokens-com-eficiência-na-criação)
11. [Roadmap por fases](#11-roadmap-por-fases)
12. [Como iniciar (passo a passo)](#12-como-iniciar-passo-a-passo)
13. [Limites e armadilhas](#13-limites-e-armadilhas)
14. [Glossário](#14-glossário)

---

## 1. Objetivo e a pergunta inicial

Criar landing pages para clientes de nichos diferentes, o mais rápido possível e gastando poucos tokens por página. A ideia: montar uma biblioteca com várias opções por seção (3 heros, 5 "como funciona", 5 cards, 5 tipografias, 5 paletas…) e, a cada cliente, apenas escolher IDs e preencher o conteúdo.

**Pergunta inicial:** isso torna a criação mais rápida e barata?

**Resposta sincera:** sim, mas a economia vem de **eliminar decisões e retrabalho**, não de ter muitas opções. A quantidade de opções, sozinha, pode atrapalhar.

**Resumo:** vale a pena se o sistema for bem desenhado. O ganho está em reaproveitar peças testadas e reduzir correções.

---

## 2. Onde a economia é real (e onde não é)

### Economia real
1. **Menos decisões de design por página.** Sem biblioteca o modelo reinventa layout, espaçamento e hierarquia a cada vez.
2. **Menos ciclos de correção.** Um componente já testado em mobile, com contraste e acessibilidade resolvidos, não gera bug.
3. **Consistência.** Menos cara de "feito por IA".
4. **Previsibilidade.** Você sabe o que vai sair antes de rodar.

A primeira geração de uma seção custa poucos milhares de tokens. O grande custo está em **iterar e verificar** (prints, correções), e é isso que o sistema reduz.

### Onde pode dar errado
- **Mais opções não é melhor.** 3×5×5×5×5 combinações = milhares, e você não testa todas. Variante nunca usada é promessa não verificada.
- **Carregar o sistema inteiro no contexto custa caro.** Só economiza se o modelo ler um índice pequeno e abrir apenas o necessário.
- **Paleta fixa quase não serve.** Cada cliente tem marca própria. O que vale é um gerador de paleta a partir da cor da marca.
- **Variantes sem contrato comum quebram a troca.** Se hero A e B esperam dados diferentes, trocar exige reescrita.
- **Risco de sameness.** Páginas saindo do mesmo kit ficam parecidas, o que pesa em advocacia e saúde, onde a identidade é o argumento.

### Ordem de grandeza (estimativa)
Página gerada do zero com iterações: pode passar de 50 mil tokens. Com sistema: spec + copy em 3 a 8 mil, mais revisão. O sistema tende a se pagar entre a 5ª e a 10ª página. Se forem só 2 ou 3 páginas, não compensa.

**Resumo:** a economia vem de reuso testado, contratos e QA automático. Muitas variantes sem uso real viram peso morto.

---

## 3. Arquitetura: três camadas

| Camada | O que é | Exemplo |
|---|---|---|
| **1. Tokens** | Cores, tipografia, raio, sombra, espaçamento, como variáveis CSS | `--accent`, `tipo-3`, `estilo-sobrio` |
| **2. Seções** | Hero, como funciona, cards etc., cada uma com várias variantes e **um contrato de dados comum** | `hero-a`, `hero-b`, `hero-c` |
| **3. Composição** | Um arquivo por cliente dizendo quais IDs usar e trazendo o conteúdo | `pagina.yaml` |

### O papel do "mostruário"
A página com várias opções por seção é o **catálogo**. Ele deve ser **gerado** a partir dos mesmos arquivos das seções, nunca desenhado à mão (senão diverge do sistema).

- O catálogo serve a **você**: escolher visualmente.
- O `INDEX.md` serve ao **modelo**: escolher por texto.
- Você passa só os IDs escolhidos ao modelo. Isso evita gastar tokens com imagens.

### Construir já modular
Não faça uma página monolítica com todas as variações para extrair depois: isso custa duas vezes (gera e depois refatora). Cada seção nasce como arquivo próprio.

**Resumo:** tokens + seções + composição. O catálogo é gerado e é para você. O modelo trabalha por IDs e texto.

---

## 4. Formato técnico e estrutura de pastas

**HTML/CSS estático + script de build em Node.** Sem React, Next ou outro framework.

Motivos:
- A página sai pronta em poucos arquivos, publicável em qualquer hospedagem.
- Nenhuma dependência para quebrar.
- Menos código = menos tokens, na criação e em cada correção.
- O `dist/` de cada cliente é independente do sistema: mudar o sistema depois **não quebra** páginas entregues.

```
design-system-lp/
  CLAUDE.md              # regras curtas (< 100 linhas), relidas todo turno
  PROGRESSO.md           # ponte entre sessões
  README.md              # este documento
  INDEX.md               # 1 linha por variante: o que é, quando usar, limites
  tokens/
    base.css             # reset, escala, grid
    tipografia/tipo-1..5.css
    estilo/sobrio.css, suave.css, ...   # raio, sombra, densidade
    gerar-paleta.mjs     # 1-2 cores da marca -> tokens completos
  secoes/
    hero/
      schema.json        # contrato de dados, igual para todas as variantes
      hero-a.html  hero-a.css
      hero-b.html  hero-b.css
    como-funciona/ ...
  build.mjs              # lê pagina.yaml e gera o HTML final
  qa.mjs                 # verificações automáticas
  catalogo/              # gerado: mostruário de todas as variantes
  clientes/<nome>/pagina.yaml, assets/, dist/
```

Cada variante é um parcial HTML com campos (`{{titulo}}`, `{{cta.texto}}`) mais um CSS que só usa variáveis de token. O `build.mjs` junta tudo.

**Resumo:** HTML/CSS estático, parciais com campos, build em Node, uma pasta `dist` por cliente.

---

## 5. Tokens: a camada de variedade barata

Use **tokens semânticos**, não nomes de cor: `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--on-accent`, `--border`. Componentes **nunca** usam hex direto. Assim trocar a marca é trocar um arquivo pequeno.

### Paleta
Em vez de 5 presets, um `gerar-paleta.mjs` que:
- recebe 1 ou 2 cores da marca;
- deriva a escala em OKLCH, em tema claro e escuro;
- **testa contraste** (WCAG AA) e ajusta ou avisa.

Mantenha 2 ou 3 presets só para clientes sem marca definida.

### Tipografia
4 a 5 pares são viáveis e baratos (poucas linhas de CSS cada). Defina escala, pesos, `line-height`, `letter-spacing`; `font-display: swap`.

### Estilo
2 a 3 pacotes (ex.: sóbrio, suave, editorial) que definem raio, sombra, densidade e espessura de borda. Muda a "personalidade" sem criar componente novo.

**Resumo:** tokens semânticos; paleta gerada com checagem de contraste; 5 pares tipográficos; 3 pacotes de estilo. Muita variedade vem daqui, de graça.

---

## 6. Seções e contratos

**Regra central:** todas as variantes de uma seção aceitam **exatamente os mesmos dados**.

Exemplo para `como-funciona`:
- `titulo`
- `intro` (opcional)
- `passos[]` com `titulo`, `texto`, `icone` (opcional)

Trocar `cf-a` por `cf-d` é mudar um ID, sem reescrever conteúdo.

### Regras para as variantes valerem a pena
- **Diferir em estrutura**, não só em cor (cor é trabalho dos tokens).
- Definir **eixos de variação** por seção. Exemplos:
  - Hero: texto à esquerda com imagem à direita; centralizado; tela dividida.
  - Como funciona: linha do tempo vertical; cards numerados; passos horizontais; acordeão; grade de ícones.
- Cada variante tem uma linha no `INDEX.md` com **quando usar** (ex.: "bom com 3 a 4 passos, ruim com texto longo").
- Declarar **limites** (máx. 6 passos, título até 60 caracteres). O QA verifica.

### Quantidades sugeridas
Hero 3, como funciona 3 a 5, cards 3 a 5, mais prova social, FAQ, CTA final, rodapé. Construa em **ondas**: primeiro **uma** variante base por seção (fixa o contrato), depois derive as outras. Se o contrato mudar no meio, você refaz tudo.

**Resumo:** mesmo contrato em todas as variantes, variação estrutural real, "quando usar" documentado, limites declarados, e primeiro 1 variante por seção.

---

## 7. A especificação da página (`pagina.yaml`)

É aqui que a economia acontece. O modelo escreve só este arquivo; o build faz o resto.

```yaml
cliente: exemplo-advocacia
nicho: advocacia
versao: 1
tema:
  cores: ["#1f3a5f", "#b08d57"]
  tipografia: tipo-3
  estilo: sobrio
secoes:
  - hero: hero-b
    titulo: "..."
    cta: { texto: "Falar no WhatsApp", link: "..." }
  - como-funciona: cf-c
    passos: [ ... ]
  - cards: cards-a
    itens: [ ... ]
  - faq: faq-a
  - contato: contato-a
```

### Regras importantes
- **Campo em branco nunca vira texto padrão.** O build **falha** se sobrar `{{campo}}` ou campo obrigatório vazio. Isso protege contra inventar dado do cliente.
- **Esquemas de conteúdo por nicho** (advocacia, saúde etc.): seções obrigatórias, avisos regulatórios, perguntas de briefing. Para esse público, isso economiza tanto quanto as variantes visuais.
- Registre a `versao` do schema para mudanças incompatíveis.

### O prompt do dia a dia (depois que o sistema existir)
> Crie a landing do cliente X com hero-b, como-funciona-c, cards-a, tipo-3, estilo-sobrio e paleta a partir de #1f3a5f.

O modelo lê o `INDEX.md` e os `schema.json` dos IDs, escreve o `pagina.yaml` com a copy e roda o build. Se o ID não existir no índice, o build falha em vez de improvisar.

**Resumo:** a página é um YAML (IDs + tokens + copy). O build monta o HTML e falha se faltar dado. Esquemas por nicho valem muito.

---

## 8. Instruções para o modelo

- **`CLAUDE.md` com menos de 100 linhas.** Ele é relido em todo turno; cada linha custa o tempo todo.
- **`INDEX.md`** com uma linha por variante e os campos do schema. É o único catálogo que o modelo lê.
- **Um comando ou skill `/nova-pagina`** que conduz o fluxo: briefing, spec, build, QA, correção.
- **Regra explícita:** o modelo não abre os arquivos das variantes sem necessidade (só para criar ou corrigir uma).

### Atenção às regras globais
Regras globais do usuário (`~/.claude/rules`) podem exigir TDD com 80% de cobertura e agentes de revisão a cada mudança. Num sistema de HTML/CSS isso gasta tokens sem proteger nada. O `CLAUDE.md` do projeto deve declarar que **a verificação aqui é `build.mjs` + `qa.mjs`**, e que testes automatizados cobrem apenas `build.mjs`, `qa.mjs` e `gerar-paleta.mjs`.

**Resumo:** contexto fixo mínimo, índice curto, comando que guia o fluxo, e a regra de não ler componentes sem necessidade.

---

## 9. QA automático

Um `qa.mjs` que roda após cada build, sem gastar tokens do modelo:

- Placeholders não substituídos e campos obrigatórios vazios.
- Contraste de texto sobre fundo.
- Overflow horizontal em 375, 768 e 1280 px.
- Imagens sem `alt`, links vazios ou `#`, ordem de títulos (h1, h2).
- Peso total da página e imagens sem dimensão.
- Screenshots por viewport salvos em arquivo (o modelo só olha o que o script apontou).

Use **Chrome headless** para os screenshots, não o painel oculto do app (painel oculto não renderiza frames e gera print em branco).

**Resumo:** script que falha cedo e barato; o modelo só vê imagem quando há problema.

---

## 10. Como gastar tokens com eficiência na criação

1. **Fundação primeiro, com o modelo mais capaz:** pastas, schema de uma seção, `build.mjs`, `gerar-paleta.mjs`, `qa.mjs`. Erro de arquitetura aqui custa muito depois.
2. **Uma etapa por sessão.** A cada mensagem o modelo relê **toda** a conversa; sessões longas ficam caras e confusas.
3. **`PROGRESSO.md` como ponte.** Ao fim de cada etapa registre: feito, decisões, próximo. A sessão seguinte começa leve lendo `CLAUDE.md` + `PROGRESSO.md`.
4. **Derive variantes com modelo mais barato**, depois que o contrato existe ("crie `hero-c` com este schema, seguindo `hero-a`").
5. **Verificação visual consolidada:** o script gera uma única imagem do catálogo com todas as variantes.
6. **Direção antes do código:** defina em texto os eixos de variação de cada seção. Barato, evita variantes quase iguais.
7. **Git por etapa:** um commit por etapa permite reverter uma variante ruim.
8. **Piloto real cedo:** 1 ou 2 páginas reais revelam o que falta no contrato antes de construir todas as variantes.

### Exemplo de ritmo de sessões

| Sessão | Etapa | Ao terminar |
|---|---|---|
| 1 | Fundação: build + `hero-a` | Atualiza `PROGRESSO.md` e commita |
| 2 | QA automático | idem |
| 3 | Variante base de como-funciona e cards | idem |
| 4 | Piloto com cliente real | idem |

Abertura de cada sessão: *"Leia o CLAUDE.md e o PROGRESSO.md e faça a próxima etapa."*

**Resumo:** modelo forte na fundação, mais barato nas variantes; sessões curtas com progresso registrado; QA por script; git por etapa; piloto antes de expandir.

---

## 11. Roadmap por fases

| Fase | Entrega | Pronto quando |
|---|---|---|
| 0 | Estrutura, `build.mjs`, `qa.mjs`, `gerar-paleta.mjs`, tokens base | Uma página mínima com 1 hero builda e passa no QA |
| 1 | 1 variante base de cada seção + schemas + `INDEX.md` | Uma página completa gerada só por spec |
| 2 | Piloto com 1 ou 2 clientes reais | Publica sem retrabalho estrutural |
| 3 | Demais variantes + catálogo | Catálogo gerado e tudo passando no QA |
| 4 | Esquemas por nicho + `/nova-pagina` | Briefing vira página em uma sessão curta |

Estimativa: de 6 a 10 sessões para chegar a algo utilizável (depende do nível de exigência visual).

**Resumo:** cinco fases; a decisão de ampliar variantes só vem depois do piloto real.

---

## 12. Como iniciar (passo a passo)

### Antes do novo chat

1. **Conferir ferramentas** (Node 18+, git, Chrome ou Edge):
   ```bash
   node -v
   git --version
   ```
2. **Criar pasta e repositório:**
   ```bash
   mkdir "D:\CLAUDE PROJECTS\design-system-lp"
   cd "D:\CLAUDE PROJECTS\design-system-lp"
   git init
   ```
3. **Decidir três coisas** (para o modelo não perguntar nem inventar):
   - nicho inicial (sugestão: um só, ex.: advocacia);
   - CTA padrão (ex.: WhatsApp com mensagem pré-preenchida);
   - 2 ou 3 referências visuais de páginas que você acha boas.
4. **Criar o `CLAUDE.md`** (curto, ver modelo no arquivo do projeto).
5. **Criar o `PROGRESSO.md`** com decisões, feito e próximo.
6. **Primeiro commit** (no PowerShell do Windows 5.1 o `&&` não funciona; rode separado):
   ```bash
   git add .
   git commit -m "chore: base do design system"
   ```
   Se der `Author identity unknown`, configure uma vez:
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

### No novo chat

Abra a sessão **dentro** da pasta `design-system-lp` (é assim que o `CLAUDE.md` carrega) e cole:

> Leia o CLAUDE.md e o PROGRESSO.md. Fase 0, só isto: crie a estrutura de pastas, `tokens/base.css` (escala de espaçamento, tipografia e uma paleta de teste com os tokens semânticos), `build.mjs` (lê `clientes/<nome>/pagina.yaml`, valida contra o `schema.json`, monta o HTML em `dist/` e falha com campos vazios), a seção `hero-a` com schema, e `clientes/teste/pagina.yaml`. Não crie outras variantes nem o QA ainda. Ao final rode o build e me diga o que passou ou falhou. Atualize o PROGRESSO.md.

### Dicas
- Revise o schema do hero antes de seguir: ele serve de molde para as outras seções.
- Se o modelo propuser framework, TypeScript ou algo "mais robusto", recuse. A simplicidade é o que economiza tokens aqui.
- Traga dúvidas de arquitetura para uma conversa de consultoria separada; o chat de execução fica só com a execução.

**Resumo:** conferir ferramentas, criar pasta e git, decidir nicho/CTA/referências, criar `CLAUDE.md` e `PROGRESSO.md`, commitar, abrir novo chat na pasta e colar o prompt da Fase 0.

---

## 13. Limites e armadilhas

- **Imagens e copy continuam sendo o gargalo.** O sistema acelera layout, não fotos do cliente nem aprovação de texto.
- **Variantes não usadas viram peso morto.** Se após 10 páginas uma variante nunca foi escolhida, corte.
- **Páginas parecidas.** O risco cai com tokens e pacotes de estilo, mas não some. Permita um CSS opcional por cliente (`clientes/<nome>/`).
- **Manutenção.** Mudança incompatível de componente exige versionar o schema.
- **SEO e conversão desde a fase 0.** Meta tags, Open Graph, dados estruturados e performance entram no `base` e no QA; corrigir depois, página a página, custa muito mais.
- **Começar pelas variantes visuais é o maior risco.** Sem build, schema e QA, você terá arquivos soltos.
- **Sem piloto real**, os erros de contrato aparecem só depois de todas as variantes prontas.

**Resumo:** o sistema resolve layout e consistência, não conteúdo nem mídia. Corte o que não for usado, permita ajuste por cliente e inclua SEO e performance desde o início.

---

## 14. Glossário

- **Token:** variável CSS que guarda uma decisão visual (cor, fonte, raio).
- **Token semântico:** nomeado pela função (`--accent`), não pela aparência (`--azul`).
- **Variante:** uma versão estrutural de uma seção (`hero-a`, `hero-b`).
- **Contrato / schema:** lista dos campos que uma seção aceita; igual para todas as variantes.
- **Spec (`pagina.yaml`):** arquivo que descreve uma página: tema, IDs das seções e conteúdo.
- **Build:** script que transforma spec + seções + tokens em HTML final.
- **Catálogo:** página gerada com todas as variantes, para escolha visual.
- **INDEX.md:** índice em texto das variantes, lido pelo modelo.
- **QA automático:** script que verifica a página sem gastar tokens do modelo.
- **Sessão:** uma conversa com o modelo; o contexto cresce a cada turno.
- **OKLCH:** espaço de cor que facilita derivar escalas com luminosidade previsível.
- **WCAG AA:** nível de contraste mínimo de acessibilidade para texto.
