# Design System de Landing Pages — Tutorial Completo

Este documento é um **tutorial passo a passo**. Quem ler do início ao fim sabe exatamente o que fazer, em que ordem e quais comandos dar para:

1. montar o sistema (fundação, tokens, seções e variantes);
2. personalizar cada seção com referências (efeitos, microanimações, tipografia, cores);
3. criar a landing page de um cliente usando só IDs.

> **Para o modelo (Claude):** não leia este arquivo por padrão. Ele é longo e serve ao humano. As regras de trabalho estão no `CLAUDE.md`; o estado está no `PROGRESSO.md`.
>
> Os números de economia de tokens citados aqui são **estimativas**, não medições.
>
> **Estado atual do código** (a fonte de verdade é o `PROGRESSO.md`):
> - **Implementado (Fase 0 + auditoria):** `node build.mjs <cliente>`; `pagina.yaml` com o bloco `pagina` (lang, titulo, descricao) e `secoes: [{id, dados}]`; um `schema.json` por seção, com validação (obrigatórios, opcionais, `minLength`, `maxLength`, `enum`, `format: url`); templates com `{{campo}}`, `{{#if}}` e `{{#each}}`; falha em campo obrigatório vazio e em `{{placeholder}}` sobrando; `<id>.js` opcional, `custom.css` e `assets/` do cliente; `tokens/base.css`; a seção `hero-a` (schema v2); testes do build (`npm test`).
> - **Ainda não implementado** (descrito neste tutorial como alvo): `INDEX.md` e lint de variantes, tema no `pagina.yaml` (cores, tipografia, estilo, paleta), `nicho`/`tipo` com validação da ordem, SEO além de `title`/`description`, otimização de imagens, catálogo e as automações do Passo 9 (`novo-cliente.mjs` etc.).
>
> **Sequência certa (não pule):** Passo 0 ambiente → **1 Fase 0 (já feito)** → 2 QA → 3 `INDEX.md` e lint → 4 tokens provisórios e `tema` → 5 decisões estruturais → **só então** 6 criar seções. Sem os Passos 2 a 5, cada seção seria criada sem o juiz (QA), sem tema e sem registro, e teria de ser refeita depois.
>
> Quando uma parte for implementada, atualize esta lista.

---

## Sumário

0. [Onde estou? (checklist de progresso)](#0-onde-estou-checklist-de-progresso)
1. [A ideia em 5 minutos](#1-a-ideia-em-5-minutos)
2. [Conceitos que você precisa conhecer](#2-conceitos-que-você-precisa-conhecer)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Mapa do caminho (visão geral)](#4-mapa-do-caminho-visão-geral)
5. [Passo 0 — Preparar o ambiente](#5-passo-0--preparar-o-ambiente)
6. [Passo 1 — Fase 0: fundação (concluído)](#6-passo-1--fase-0-fundação-concluído)
7. [Passo 2 — QA automático](#7-passo-2--qa-automático)
8. [Passo 3 — INDEX.md e lint das variantes](#8-passo-3--indexmd-e-lint-das-variantes)
9. [Passo 4 — Tokens provisórios e tema](#9-passo-4--tokens-provisórios-e-tema)
10. [Passo 5 — Decisões estruturais](#10-passo-5--decisões-estruturais)
11. [Passo 6 — Criar uma seção (roteiro de 4 comandos)](#11-passo-6--criar-uma-seção-roteiro-de-4-comandos)
12. [Como personalizar com referências](#12-como-personalizar-com-referências)
13. [Passo 7 — Tipografias e paletas finais](#13-passo-7--tipografias-e-paletas-finais)
14. [Passo 8 — Catálogo](#14-passo-8--catálogo)
15. [Passo 9 — Criar a página de um cliente](#15-passo-9--criar-a-página-de-um-cliente)
16. [Passo 10 — Congelar a v1 e entrar na rotina](#16-passo-10--congelar-a-v1-e-entrar-na-rotina)
17. [Quando o cliente pede algo fora do catálogo](#17-quando-o-cliente-pede-algo-fora-do-catálogo)
18. [Sessões, tokens e git](#18-sessões-tokens-e-git)
19. [Comandos de referência](#19-comandos-de-referência)
20. [Problemas comuns](#20-problemas-comuns)
21. [Limites do sistema](#21-limites-do-sistema)
22. [Glossário](#22-glossário)

---

## 0. Onde estou? (checklist de progresso)

Siga **de cima para baixo**. Cada item é explicado no passo de mesmo número. Estado em 2026-11-14.

- [x] Passo 0: ambiente pronto (Node, git, pasta, `CLAUDE.md`, `PROGRESSO.md`, commit inicial)
- [x] Passo 1: Fase 0 (build, tokens base, `hero-a`, página de teste) e auditoria do build (`npm test` passa)
- [x] Passo 2: `qa.mjs` funcionando
- [ ] Passo 3: `INDEX.md` (com `hero-a`) e lint das variantes
- [ ] Passo 4: 1 tipografia, 1 paleta provisórias e bloco `tema` no build
- [ ] Passo 5: decisões estruturais (cabeçalho/rodapé, SEO, `nicho`/`tipo` no `pagina.yaml`)
- [ ] Passo 6: seções criadas (marque cada uma)
  - [ ] hero (landing e site): `hero-a` existe; falta refinar e derivar as outras
  - [ ] problema (landing)
  - [ ] solucoes (landing)
  - [ ] requisitos (landing)
  - [ ] atuacao (landing e site)
  - [ ] autoridade (landing e site)
  - [ ] fundamentacao (landing)
  - [ ] faq (landing e site)
  - [ ] contato / CTA final (landing e site)
  - [ ] areas (site)
  - [ ] servicos (site)
  - [ ] conteudos (site)

  A ordem acima é a de **criação** para o nicho piloto (advocacia): as 9 primeiras completam a landing; as 3 últimas completam o site. Ver [seção 2.1](#21-nichos-tipos-de-página-e-regra-de-congruência).
- [ ] Passo 7: 5 tipografias e 5 paletas finais
- [ ] Passo 8: catálogo gerado
- [ ] Passo 9: piloto com cliente real
- [ ] Passo 10: v1 congelada (`git tag v1`)
- [ ] Passo 11 (opcional): automação de entrada (novo-cliente, imagens, pendências)

---

## 1. A ideia em 5 minutos

**Problema:** criar muitas landing pages de clientes por dia sem gastar uma montanha de tokens, mantendo qualidade e consistência.

**Solução:** uma biblioteca de peças prontas (seções com várias variantes, tipografias, paletas). Para cada cliente você apenas **escolhe os IDs** (`hero-b`, `atuacao-c`, `faq-a`…) e **preenche o conteúdo**. Um script monta a página.

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
| **Seção** | Um bloco da página | hero, atuação, autoridade |
| **Família de seção** | A pasta de uma seção em `secoes/`, com todas as suas variantes | `atuacao/` (`atuacao-a`, `atuacao-b`…) |
| **Tipo de página** | Estrutura de seções de um nicho (na advocacia: `site` com 8 e `landing` com 9) | ver seção 2.1 |
| **Perfil de nicho** | Pasta `nichos/<nicho>/` com os tipos de página, a ordem das seções, as regras de conteúdo e o briefing do nicho | `nichos/advocacia/nicho.yaml` |
| **Variante** | Uma versão estrutural de uma seção | `hero-a`, `hero-b`, `hero-c` |
| **ID** | Nome único de uma variante, também usado como nome de arquivo | `hero-b` |
| **Schema** (contrato) | Lista dos campos que uma seção aceita; igual para todas as variantes | `titulo`, `subtitulo`, `cta` |
| **`pagina.yaml`** | A planta da página de um cliente: tema, IDs e conteúdo | ver Passo 9 |
| **Build** | Script que monta o HTML final | `node build.mjs ...` |
| **QA** | Script que verifica a página automaticamente | `node qa.mjs ...` |
| **Catálogo** | Página gerada que mostra todas as variantes lado a lado | para **você** escolher |
| **`INDEX.md`** | Lista em texto, uma linha por variante | para o **modelo** escolher |
| **Sessão** | Uma conversa com o modelo | uma etapa por sessão |
| **`PROGRESSO.md`** | Ponte entre sessões: feito, decisões, próximo | lido no início de cada sessão |

### As três camadas

1. **Tokens:** cores, tipografia, raio, sombra, espaçamento.
2. **Seções:** hero, problema, atuação, autoridade, FAQ etc., cada uma com várias variantes e um schema comum.
3. **Composição:** o `pagina.yaml` de cada cliente.

### Regra de ouro dos contratos

**Todas as variantes de uma seção aceitam exatamente os mesmos dados.** Assim, trocar `cf-a` por `cf-d` é mudar um ID, sem reescrever conteúdo. Se uma variante precisar de campo extra, ele deve ser **opcional**.

### Por que um arquivo por variante

Cada variante tem seus próprios arquivos (`hero-a.html`, `hero-a.css`). Motivos: o modelo abre só o que precisa (economia), o build liga ID a arquivo sem procurar, e editar uma variante não arrisca as outras.

**Resumo:** tokens (aparência), seções (estrutura), `pagina.yaml` (composição). Mesmo schema em todas as variantes. Um arquivo por variante.

### 2.1 Nichos, tipos de página e regra de congruência

O sistema serve a **vários nichos** (advocacia, barbearia, clínica…). Para não engessar, o que depende do nicho fica **separado** dos componentes.

| Camada | Muda por nicho? | Exemplo |
|---|---|---|
| Componentes (variantes `hero-a`, `faq-b`) | Quase nunca | Um FAQ é um FAQ em qualquer nicho |
| Tokens (cores, tipografia, estilo) | Por cliente, não por nicho | |
| **Quais seções, em que ordem** | **Sim** | Advocacia tem `fundamentacao`; barbearia teria `galeria` e `localizacao` |
| **Regras de conteúdo** | **Sim** | Advocacia segue a OAB; barbearia quase não tem restrição |
| **Perguntas do briefing** | **Sim** | Barbearia: preços, horários, endereço |
| Tom, CTA e tipo de imagem | **Sim** | |

#### Perfil de nicho

Cada nicho tem uma pasta própria, chamada **perfil**:

```
nichos/
  _modelo/nicho.yaml     # ponto de partida para um nicho novo
  advocacia/
    nicho.yaml           # tipos de página, ordem das seções, regras, tom, CTA
    briefing.md          # perguntas do briefing deste nicho
    conteudo.md          # o que pode e o que não pode dizer
  barbearia/ ...         # exemplo: criado quando houver o primeiro cliente
```

O `nicho.yaml` é a **fonte de verdade** da estrutura de páginas do nicho. Ele define, para cada tipo de página (por exemplo `site` e `landing`): a lista de seções **na ordem**, as seções obrigatórias e a regra de congruência (a lógica que liga uma seção à seguinte). Também guarda as regras de conteúdo (`nunca_inventar`, `proibido`, `termos_vetados`), o tom, o CTA padrão e o tipo de imagem.

Ao montar uma página, o modelo lê **só o perfil do nicho do cliente**. Isso economiza tokens e impede que regras de um nicho contaminem outro. O `CLAUDE.md` fica genérico.

**Planejado (ainda não implementado):** o `pagina.yaml` declarar `nicho` e `tipo`, e o build ler o `nicho.yaml` para validar a ordem e as seções obrigatórias, e o QA verificar os termos vetados.

#### Famílias de seção: uma biblioteca para todos os nichos

Cada seção é uma **família** (uma pasta em `secoes/`) com suas variantes (`hero-a`, `atuacao-b`…). Todas as famílias ficam na mesma pasta e **são compartilhadas entre nichos**; cada perfil escolhe quais usa.

- **Regra:** crie uma família nova **só quando um nicho precisar dela**.
- **Famílias compartilhadas** entre tipos de página ou nichos usam **campos opcionais** no schema para o que muda. Se os usos divergirem demais, divida a família em duas.
- As 12 famílias atuais nasceram da advocacia. Algumas são gerais (`hero`, `faq`, `contato`, `atuacao`, `autoridade`, `problema`, `solucoes`), outras são típicas do nicho (`fundamentacao`, `requisitos`, `areas`, `conteudos`). A barbearia, por exemplo, pediria `galeria`, `servicos` com preços e `localizacao`. Não renomeie as famílias antes de o segundo nicho mostrar o que é realmente comum.

#### Exemplo: o nicho advocacia

Áreas: Direito Bancário, Imobiliário e do Consumidor. O perfil completo está em `nichos/advocacia/nicho.yaml`. Resumo:

**Tipo `site` (institucional): 8 seções**

1. **Hero institucional:** apresentação do escritório, posicionamento e CTA.
2. **Áreas de atuação:** Direito Bancário, Imobiliário e do Consumidor.
3. **Serviços jurídicos:** serviços específicos de cada área.
4. **Forma de atuação:** como é o atendimento e a análise jurídica.
5. **Sobre o escritório:** apresentação institucional, advogados e credenciais.
6. **Conteúdos jurídicos:** artigos do blog e informações educativas.
7. **Perguntas frequentes (FAQ):** principais dúvidas.
8. **Contato e CTA final:** convite ao contato e canais de atendimento.

**Tipo `landing`: 9 seções**

1. **Hero:** título H1, subtítulo, imagem contextual quando pertinente e CTA.
2. **Identificação do problema:** situações jurídicas com as quais o visitante pode se identificar.
3. **Possíveis soluções jurídicas:** alternativas legais.
4. **Quem pode se beneficiar:** requisitos e condições para usar as medidas jurídicas.
5. **Como funciona a atuação:** etapas do atendimento e CTA intermediário.
6. **Autoridade profissional:** advogado, OAB e credenciais.
7. **Fundamentação jurídica:** legislação, jurisprudência e explicações relevantes.
8. **Perguntas frequentes (FAQ):** dúvidas específicas sobre o serviço.
9. **Encerramento e CTA final:** conclusão e convite ao contato.

**Regra de congruência (a ordem não muda):**

- **Site:** Apresentação → Áreas → Serviços → Atuação → Autoridade → Conteúdo → Dúvidas → Contato.
- **Landing:** Reconhecimento → Problema → Solução → Requisitos → Processo → Autoridade → Fundamentação → Dúvidas → Conversão.

Não reordene nem pule seção sem decidir isso conscientemente.

| Família (pasta) | Site institucional | Landing page |
|---|---|---|
| `hero` | 1. Hero institucional | 1. Hero |
| `problema` | — | 2. Identificação do problema |
| `solucoes` | — | 3. Possíveis soluções jurídicas |
| `requisitos` | — | 4. Quem pode se beneficiar |
| `areas` | 2. Áreas de atuação | — |
| `servicos` | 3. Serviços jurídicos | — |
| `atuacao` | 4. Forma de atuação | 5. Como funciona a atuação (com CTA intermediário) |
| `autoridade` | 5. Sobre o escritório | 6. Autoridade profissional |
| `conteudos` | 6. Conteúdos jurídicos | — |
| `fundamentacao` | — | 7. Fundamentação jurídica |
| `faq` | 7. FAQ | 8. FAQ |
| `contato` | 8. Contato e CTA final | 9. Encerramento e CTA final |

Total: **12 famílias**. **Compartilhadas entre site e landing:** `hero`, `atuacao`, `autoridade`, `faq`, `contato`. **Só landing:** `problema`, `solucoes`, `requisitos`, `fundamentacao`. **Só site:** `areas`, `servicos`, `conteudos`.

#### Como adicionar um nicho novo (por exemplo, barbearia)

Faça isto **depois** de ter o primeiro cliente do nicho, ou ao planejar o nicho. É só texto e configuração, e custa pouco. Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Vamos criar o perfil do nicho [NICHO]. Ainda NÃO crie componentes. Proponha, em texto, e espere minha aprovação:
1) Os tipos de página (site, landing...) e a ordem das seções de cada um, seguindo uma regra de congruência.
2) Quais famílias já existentes em secoes/ serão reaproveitadas e quais famílias novas serão necessárias.
3) As perguntas do briefing deste nicho.
4) As regras de conteúdo: o que nunca inventar, termos vetados, avisos obrigatórios (conselho profissional, se houver), tom e CTA padrão.
Depois de aprovado, crie nichos/[nicho]/nicho.yaml, briefing.md e conteudo.md, usando nichos/_modelo/ como base.
```

Depois, crie só as famílias que faltarem, pelo roteiro de 4 comandos do Passo 6. **Valide o formato do perfil com o segundo nicho antes de considerá-lo estável.**

#### Decisões em aberto

1. Os **nomes das famílias** (`atuacao`, `autoridade`, `requisitos`…) são propostas derivadas da estrutura da advocacia. Confirme antes de criar as seções.
2. **Cabeçalho e rodapé** não constam na estrutura informada. Se forem necessários (menu, links legais, aviso da OAB), serão elementos fixos de apoio; decida se entram.
3. Se `hero`, `atuacao`, `autoridade`, `faq` e `contato` ficam **compartilhadas** ou se alguma deve ser dividida.
4. O formato do perfil de nicho ainda não foi testado com um segundo nicho.

**Resumo:** cada nicho tem um perfil em `nichos/<nicho>/` com tipos de página, ordem das seções, regras de conteúdo e briefing. As famílias de seção são uma biblioteca única, compartilhada, e só cresce quando um nicho precisa. O modelo lê apenas o perfil do nicho em uso. A advocacia é o nicho piloto, e o formato deve ser validado com um segundo nicho.

---

## 3. Estrutura de pastas

```
design-system-lp/
  CLAUDE.md              # regras curtas (< 100 linhas), lidas pelo modelo a cada turno
  package.json           # scripts: npm run build, npm test
  test/                  # testes do build.mjs (node --test)
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
  nichos/                # perfil de cada nicho (estrutura, regras, briefing)
    _modelo/nicho.yaml   # ponto de partida para um nicho novo
    advocacia/           # nicho.yaml, briefing.md, conteudo.md
  secoes/
    hero/
      schema.json        # contrato da seção (1 por seção)
      hero-a.html  hero-a.css  [hero-a.js opcional]
      hero-b.html  hero-b.css
      hero-c.html  hero-c.css
    problema/ solucoes/ requisitos/ atuacao/ autoridade/
    fundamentacao/ faq/ contato/ areas/ servicos/ conteudos/   # 12 famílias (ver seção 2.1)
  build.mjs              # lê pagina.yaml e gera o HTML final
  qa.mjs                 # verificações automáticas (Passo 2)
  lint.mjs               # confere variantes: schema, tokens, INDEX (Passo 3)
  catalogo/              # GERADO: mostruário de todas as variantes
  clientes/
    <nome>/
      briefing.md        # material do cliente
      pagina.yaml        # a planta da página
      custom.css         # (opcional, planejado) pequenas sobrescritas
      assets/            # logo, fotos
      dist/              # GERADO: a página pronta
```

Cada arquivo `.html` de variante deve ter, no topo, um comentário com o ID e uma linha de descrição.

**Resumo:** tokens, seções, clientes, mais os scripts `build.mjs` e `qa.mjs`. `catalogo/` e `dist/` são gerados, não escritos à mão.

---

## 4. Mapa do caminho (visão geral)

```
Passo 0   Ambiente
Passo 1   Fase 0: fundação (build + hero-a + página de teste)   [FEITO]
Passo 2   QA automático (qa.mjs)
Passo 3   INDEX.md e lint das variantes
Passo 4   Tokens provisórios (1 tipografia, 1 paleta) + bloco tema no build
Passo 5   Decisões estruturais (cabeçalho/rodapé, SEO, nicho/tipo)
Passo 6   Para CADA seção:  definir → base → refinar com referências → derivar variantes
Passo 7   Tipografias e paletas finais (5 de cada)
Passo 8   Catálogo
Passo 9   Piloto: página de um cliente real
Passo 10  Congelar v1 → rotina diária
Passo 11  (opcional) Automação de entrada: esqueleto, imagens, pendências
```

Os Passos 2 a 5 são a **preparação**: criam o juiz (QA), o registro (INDEX), o tema e as decisões que toda seção usa. Pular qualquer um deles obriga a refazer as seções depois.

Regra de ouro do processo: **uma etapa por sessão**, sempre terminando com `PROGRESSO.md` atualizado e commit.

**Resumo:** fundação, QA, tokens provisórios, loop de seções, tokens finais, catálogo, piloto, v1.

---

## 5. Passo 0 — Preparar o ambiente

**Objetivo:** ter pasta, git e os dois arquivos de instrução.

1. Conferir ferramentas (Node 20 ou superior, git, Chrome ou Edge):

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
   - **nicho inicial** (definido: advocacia, com as áreas Direito Bancário, Imobiliário e do Consumidor);
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

## 6. Passo 1 — Fase 0: fundação (concluído)

> **Já feito neste repositório.** Não rode o prompt abaixo de novo: ele só serve de registro e para recriar o sistema do zero. Para retomar, rode `npm install` e confira com `node build.mjs` e `npm test`.

**Objetivo:** ter o motor funcionando com **uma** seção, antes de criar qualquer variante.

Abra uma **sessão nova dentro da pasta** `design-system-lp` (é assim que o `CLAUDE.md` carrega) e cole:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Fase 0, só isto: crie a estrutura de pastas, tokens/base.css (escala de espaçamento, tipografia e uma paleta de teste com os tokens semânticos), build.mjs (lê clientes/<nome>/pagina.yaml, valida contra o schema.json, monta o HTML em dist/ e falha com campos vazios), a seção hero-a com schema, e clientes/teste/pagina.yaml. Não crie outras variantes nem o QA ainda. Ao final rode o build e me diga o que passou ou falhou. Atualize o PROGRESSO.md.
```

**Revise antes de seguir:** o `schema.json` do hero. Ele serve de molde para todas as outras seções.

**Se o modelo propuser** framework, TypeScript ou algo "mais robusto": recuse. A simplicidade é o que economiza tokens.

**Pronto quando:** o build gera `clientes/teste/dist/index.html`, ele abre no navegador e `npm test` passa.

**Feche a sessão:** `PROGRESSO.md` atualizado e commit (`feat: fase 0 fundação`).

**Resumo:** uma sessão, um prompt, e o resultado é um build funcionando com `hero-a`. Revise o schema do hero e não aceite frameworks.

---

## 7. Passo 2 — QA automático

**Objetivo:** um script que verifica a página sem gastar tokens do modelo.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Rode npm install e npm test. Crie qa.mjs que, para um cliente, verifica: placeholders {{...}} sobrando e campos obrigatórios vazios; contraste de texto sobre fundo; overflow horizontal em 375, 768 e 1280 px; imagens sem alt; links vazios ou "#"; ordem dos títulos (h1, h2); peso da página. Gere screenshots por viewport em arquivo usando Chrome headless (não o painel do app). Rode sobre clientes/teste e reporte. Não crie variantes novas.
```

**Por que Chrome headless:** o painel oculto do app não renderiza frames, então prints saem em branco e efeitos que dependem de rolagem não disparam.

**Pronto quando:** `qa.mjs` roda na página de teste e reporta resultados claros (passou ou o que falhou).

**Resumo:** o QA por script substitui revisões visuais caras. Ele é o juiz de cada variante daqui para frente.

---

## 8. Passo 3 — INDEX.md e lint das variantes

**Objetivo:** criar o registro que o modelo lê para escolher variantes (`INDEX.md`) e um verificador que barra variantes fora do padrão antes de elas se espalharem.

**Por que agora:** o `CLAUDE.md` exige uma linha no `INDEX.md` para toda variante nova, e o `hero-a` ainda não está lá. O lint evita os erros que o build não pega sozinho.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Rode npm install e npm test. Crie INDEX.md com 1 linha por variante existente (hoje só hero-a: o que é, quando usar, limites, se exige imagem). Crie lint.mjs (com testes em test/) que, para todas as variantes de secoes/, verifica: (1) todo {{campo}} do .html existe no schema.json da família; (2) o .css não tem cor hex nem rgb() direta (só tokens var(--...)); (3) cada .html começa com comentário de ID e descrição; (4) cada variante está listada no INDEX.md; (5) todas as variantes da família usam o mesmo schema.json (um por pasta). Rode sobre o repositório, corrija o que reprovar e atualize o PROGRESSO.md. Não crie seções novas.
```

**Pronto quando:** `node lint.mjs` passa e o `INDEX.md` lista o `hero-a`. A partir daqui, a verificação de cada variante é `node build.mjs` + `node qa.mjs` + `node lint.mjs`.

**Resumo:** o `INDEX.md` é o catálogo textual para o modelo; o lint garante que toda variante nova respeita o contrato.

---

## 9. Passo 4 — Tokens provisórios e tema

**Objetivo:** ter pelo menos uma tipografia e uma paleta reais **e** um jeito de o `pagina.yaml` escolhê-las. Hoje o build só carrega `tokens/base.css`: arquivos `tipo-1.css` e `paleta-1.css` criados sem esta etapa **nunca entrariam na página**.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Rode npm install e npm test. Parte 1: crie tokens/tipografia/tipo-1.css (fontes: [TÍTULO] e [TEXTO], do Google Fonts; escala de tamanhos, pesos e line-height; acentos do português) e tokens/paleta/paleta-1.css (tokens semânticos: --bg, --surface, --text, --muted, --accent, --on-accent, --border; cores: [...]). Verifique contraste AA. Parte 2: implemente no build.mjs um bloco opcional "tema" no pagina.yaml ({tipografia: tipo-1, paleta: paleta-1, estilo: opcional}) que anexa o CSS correspondente ao style.css logo depois do base.css; id de tema inexistente faz o build falhar; sem bloco tema, o comportamento atual continua. Para fonte do Google Fonts, adicione o <link> no <head>. Escreva testes em test/ para o tema. Aplique tipo-1 e paleta-1 em clientes/teste/pagina.yaml e rode build + qa + lint. Atualize PROGRESSO.md e README (seção 13.4).
```

**Pronto quando:** `clientes/teste` builda com `tema: {tipografia: tipo-1, paleta: paleta-1}`, o QA passa e `npm test` cobre o tema.

As 5 tipografias e 5 paletas finais ficam para o Passo 7, quando você já tiver seções para testá-las. `gerar-paleta.mjs` (cores da marca do cliente) também fica para lá.

**Resumo:** 1 tipografia, 1 paleta e o bloco `tema` no build. Sem o bloco, os arquivos de tokens não chegam à página.

---

## 10. Passo 5 — Decisões estruturais

**Objetivo:** fechar, **antes** de criar seções, o que muda o esqueleto de toda página. Decidir isso depois obriga a mexer em todas as variantes e em todos os `pagina.yaml`.

Estas decisões são suas. O modelo propõe em texto, você aprova, e só então ele implementa.

| Decisão | Opções | Efeito se mudar depois |
|---|---|---|
| **Cabeçalho e rodapé** | Entram como seções fixas de apoio (menu, links legais, aviso da OAB) ou ficam de fora | Nova família, novo schema e revisão de todas as páginas |
| **SEO básico** | Hoje só `title` e `description`. Incluir Open Graph, favicon e dados estruturados? | Mudança no build e no bloco `pagina` do schema da página |
| **`nicho` e `tipo` no `pagina.yaml`** | O build lê `nichos/<nicho>/nicho.yaml` e valida ordem e seções obrigatórias | Páginas já criadas precisam ganhar os campos |
| **Famílias compartilhadas** | `hero`, `atuacao`, `autoridade`, `faq` e `contato` ficam únicas ou alguma se divide | Reescrita de schema e variantes |
| **CTA padrão e referências visuais** | Definir (hoje "a definir") | Retrabalho de copy e de refinamento |

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Passo 5, só decisões. Proponha em texto, com recomendação para cada item, e espere minha aprovação: (1) cabeçalho e rodapé: entram ou não, com quais campos; (2) SEO: o que o bloco "pagina" deve ter além de titulo, lang e descricao; (3) nicho e tipo no pagina.yaml e como o build valida a ordem pelo nicho.yaml; (4) se as 5 famílias compartilhadas ficam únicas. Depois de aprovado, implemente no build.mjs com testes, atualize clientes/teste/pagina.yaml, o CLAUDE.md, o README e o PROGRESSO.md.
```

**Pronto quando:** as decisões estão registradas no `PROGRESSO.md` (sem "a definir" nos itens acima), o build implementa o que foi aprovado e `npm test` passa.

**Resumo:** cinco decisões que moldam toda página, tomadas uma vez, antes da primeira seção nova.

---

## 11. Passo 6 — Criar uma seção (roteiro de 4 comandos)

Este é o **ciclo central**. Repita para cada seção, trocando `[SEÇÃO]`.

**O ciclo tem 4 comandos:**

| Comando | O que faz | Quem decide |
|---|---|---|
| 1. Definir | Fixa o contrato (schema) e os eixos de variação, sem código | Você aprova |
| 2. Criar a base | Gera a variante `-a` e valida no build e no QA | Você olha o screenshot |
| 3. Refinar | Personaliza a base com referências, efeitos e microanimações | Você dirige |
| 4. Derivar | Cria as demais variantes e fecha a seção | Você confere no catálogo |

> Se você viu um roteiro de 3 comandos em outro lugar (por exemplo numa conversa anterior), a diferença é só esta: o refinamento com referências (Comando 3) foi acrescentado, e o antigo "Comando 3" virou o Comando 4.

**Ordem de criação das seções (nicho piloto: advocacia)** (completa a landing primeiro, depois as exclusivas do site): `hero`, `problema`, `solucoes`, `requisitos`, `atuacao`, `autoridade`, `fundamentacao`, `faq`, `contato`; depois `areas`, `servicos`, `conteudos`. Comece pelo **hero**, que já existe como base desde a Fase 0, e siga a lista. Faça **uma seção por sessão**, ou duas se forem simples (por exemplo `faq` e `contato`).

Atenção: esta é a ordem de **criação**. A ordem **na página** segue a regra de congruência da [seção 2.1](#21-nichos-tipos-de-página-e-regra-de-congruência). Nas famílias compartilhadas (`hero`, `atuacao`, `autoridade`, `faq`, `contato`), o schema deve atender site e landing, com campos opcionais para o que muda.

**Pré-requisito:** Passos 1 a 5 concluídos (build, QA, `INDEX.md`/lint, tema e decisões estruturais). Se algum faltar, volte a ele: criar seções antes obriga a refazê-las.

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

O prompt, as regras e as dicas de custo estão na [seção 12](#12-como-personalizar-com-referências). Em resumo: copie a técnica, nunca o conteúdo; a animação só enfeita; e dê feedback específico.

### Comando 4 — Derivar as outras variantes e fechar

**O que faz:** cria as variantes `-b`, `-c` etc. com o mesmo schema, registra cada uma no `INDEX.md`, valida e faz o commit.
**Quando usar:** só depois de a base estar aprovada e refinada.
**O que esperar:** variantes novas na página de teste, `INDEX.md` e `PROGRESSO.md` atualizados e um commit da seção. Como o contrato já existe, esta etapa pode ser feita com um modelo mais barato.

```text
A base [seção]-a está aprovada. Crie as variantes [seção]-b até [seção]-[última] conforme os eixos aprovados, usando [seção]-a como referência de estrutura e o MESMO schema.json. Para cada uma: adicione ao INDEX.md (1 linha: o que é, quando usar, limites, se exige imagem), troque o ID no clientes/teste/pagina.yaml, rode build + qa. Ao terminar: atualize o PROGRESSO.md e faça um commit "feat: seção [SEÇÃO] (N variantes)".
```

Cada variante derivada também pode passar pelo refinamento da [seção 12](#12-como-personalizar-com-referências) (uma por sessão).

### Checklist de fechamento de cada seção

- [ ] `schema.json` único para a seção
- [ ] cada variante com `.html` e `.css`, usando só tokens (nenhum hex)
- [ ] todas passam em build e QA com os mesmos dados de teste
- [ ] `INDEX.md` com uma linha por variante
- [ ] `PROGRESSO.md` atualizado e commit feito

### Sintaxe dos templates (leia antes do Comando 2)

O `build.mjs` entende só isto no `<id>.html`:

| Marcação | Efeito |
|---|---|
| `{{campo}}`, `{{a.b}}` | Valor com HTML escapado. Vazio ou ausente = build falha |
| `{{#if campo}}...{{/if}}` | Bloco só aparece se o campo opcional tiver valor |
| `{{#each lista}}...{{/each}}` | Repete o bloco por item; dentro, `{{campo}}` lê do item (ou do escopo externo) e `{{this}}` é o item de uma lista de texto |

Listas de tamanho variável (FAQ, passos, áreas) **sempre** com `each`. No `schema.json`, tudo o que não está em `required` é opcional; campos de link usam `"format": "url"`; imagem é um objeto `{src, alt}` com `alt` obrigatório. A raiz de cada variante leva `id="<familia>"` (ex.: `id="contato"`), para os links `#contato` funcionarem. JS opcional vai em `<id>.js` (vira `script.js`). A referência completa está no `CLAUDE.md`.

### Regras que mantêm o padrão

1. **Não pule o Comando 1.** Sem ele o modelo cria variantes que só diferem em cor.
2. **Não mude o `schema.json`** com variantes já criadas sem avisar e incrementar a `versao`.
3. **Variantes diferem em estrutura**, não em cor (cor é trabalho dos tokens).

**Resumo:** para cada seção: definir (você aprova), criar a base, refinar com referências, derivar as outras, fechar com checklist e commit.

---

## 12. Como personalizar com referências

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
- Capriche mais nas seções que aparecem em toda página (hero, atuação, contato) e aceite acabamento mais simples nas outras.

**Resumo:** referência é fonte de técnica, nunca de conteúdo. Peça o efeito com o prompt acima, mantenha leve e acessível, e limite as rodadas.

---

## 13. Passo 7 — Tipografias e paletas finais

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

## 14. Passo 8 — Catálogo

**Objetivo:** uma página gerada que mostra todas as variantes, tipografias e paletas lado a lado, com os mesmos dados de teste. É a **sua** ferramenta para escolher.

Sessão nova:

```text
Leia o CLAUDE.md e o PROGRESSO.md. Crie um script (catalogo.mjs) que gera catalogo/index.html a partir de secoes/, tokens/tipografia e tokens/paleta: mostra cada variante com os dados de teste, com seletor de tipografia e de paleta. Deve ser gerado, nunca escrito à mão. Gere também uma imagem única (screenshot) do catálogo via Chrome headless.
```

O nome `catalogo.mjs` é uma sugestão; use o que o modelo criar e anote no `PROGRESSO.md`.

**Resumo:** o catálogo é gerado dos mesmos arquivos do sistema e serve para você olhar e escolher.

---

## 15. Passo 9 — Criar a página de um cliente

Este é o fluxo completo. O **piloto** é a primeira vez; depois vira rotina.

### 15.1 Briefing

Crie `clientes/<nome>/briefing.md` e a pasta `assets/` com:
- nome, serviços e diferenciais;
- contatos e CTA;
- logo, fotos e cores da marca (se houver);
- textos já aprovados;
- regras do nicho (em `nichos/<nicho>/conteudo.md`). Na advocacia, a publicidade segue as normas da OAB (por exemplo o Código de Ética e Disciplina e o Provimento 205/2021 do CFOAB; confirme a versão vigente com o advogado responsável): sem promessa de resultado e sem captação indevida de clientela. **Legislação, jurisprudência, número de OAB, credenciais e depoimentos vêm do briefing e são conferidos pelo advogado; o modelo nunca os inventa.**

### 15.2 Escolher no catálogo

Abra o catálogo e anote:
- IDs das seções, na ordem;
- tipografia (`tipo-N`) e estilo;
- paleta: preset ou gerada a partir das cores da marca.

### 15.3 Pedir a página ao modelo

Sessão nova:

```text
Crie a [landing | site] do cliente [NOME] (nicho [NICHO]; na advocacia, informe também a área: bancário, imobiliário ou consumidor).
Leia o perfil nichos/[nicho]/ e siga a ordem de seções do nicho.yaml.
IDs (exemplo de landing de advocacia):
hero-b, problema-a, solucoes-a, requisitos-a, atuacao-c, autoridade-a, fundamentacao-a, faq-a, contato-a
Tipografia: tipo-3 | Estilo: sobrio | Paleta: gerar a partir de #[COR1] e #[COR2]
Material em clientes/[nome]/briefing.md e assets/.
Regras: leia só INDEX.md e os schema.json dos IDs escolhidos; não abra os arquivos das variantes. Não invente dado do cliente: se faltar um campo obrigatório, liste o que falta e pergunte. Escreva o pagina.yaml, rode build e qa, corrija o que o QA apontar e me diga o resultado.
```

### 15.4 O que o `pagina.yaml` contém

Formato **atual**, o que o `build.mjs` lê hoje (exemplo real de `clientes/teste/pagina.yaml`):

```yaml
pagina:
  lang: pt-BR
  titulo: Cliente Exemplo
  descricao: Descrição curta para SEO.
secoes:
  - id: hero-a
    dados:
      titulo: "..."
      subtitulo: "..."
      cta:
        texto: "Falar no WhatsApp"
        url: "https://wa.me/..."
  - id: atuacao-c            # exemplo: esta variante ainda não existe
    dados:
      passos:
        - { titulo: "...", texto: "..." }
```

Cada item de `secoes` tem um `id` (o ID da variante, por exemplo `hero-a`) e os `dados` da seção, que devem seguir o `schema.json` dela. O que o schema não declara é rejeitado pelo build.

**Planejado (ainda não implementado):** um bloco `tema` para escolher cores, tipografia e estilo por cliente. Hoje o build só carrega `tokens/base.css`.

```yaml
tema:
  cores: ["#1f3a5f", "#b08d57"]
  tipografia: tipo-3
  estilo: sobrio
```

**Regra de segurança:** campo obrigatório vazio ou `{{placeholder}}` sobrando **faz o build falhar**. O sistema nunca preenche dado do cliente com valor inventado.

### 15.5 Revisar e ajustar

1. Abra `clientes/<nome>/dist/index.html` no navegador e olhe no celular e no desktop.
2. Peça ajustes de **copy e imagens** de forma específica.
3. Ajustes visuais pequenos vão no `custom.css` do cliente (ver [seção 17](#17-quando-o-cliente-pede-algo-fora-do-catálogo)). 
4. Rode o QA de novo.

### 15.6 Fechar

`PROGRESSO.md` (só se aprendeu algo para o sistema) e commit da pasta do cliente:

```bash
git add clientes/<nome>
```

```bash
git commit -m "feat: landing <nome>"
```

**No piloto,** anote o que faltou no sistema (campo, variante, limite). Isso alimenta o Passo 10.

### 15.7 Seções opcionais, copy e imagens

**Todas as seções precisam estar preenchidas?** Não. A página tem só as seções listadas no `pagina.yaml`.

- **Nível da página:** cada tipo de página do nicho tem estrutura completa (na advocacia: site com 8 seções e landing com 9), na ordem do `nicho.yaml` ([regra de congruência](#21-nichos-tipos-de-página-e-regra-de-congruência)). Omita uma seção só quando não houver material aprovado para ela (por exemplo `fundamentacao` sem legislação e jurisprudência conferidas pelo advogado), e nunca a preencha com texto inventado. O mínimo absoluto é `hero` e `contato`.
- **Nível do campo:** numa seção escolhida, os campos **obrigatórios** do schema precisam estar preenchidos, senão o build falha. Os **opcionais** podem ficar vazios, e nesse caso o elemento correspondente some em vez de aparecer com texto de exemplo: na variante, envolva-o em `{{#if campo}}...{{/if}}` (implementado).
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

**Resumo:** cada tipo de página tem estrutura completa (site 8, landing 9), com o mínimo absoluto `hero` e `contato`. Copy vem do briefing, com origem marcada e pendências listadas. Imagens ficam em `assets/` com `alt` obrigatório, e nada de placeholder em produção.

**Resumo:** briefing, escolha de IDs no catálogo, prompt de criação, `pagina.yaml` com a copy, build e QA, revisão sua, commit. Nunca invente dado do cliente.

---

## 16. Passo 10 — Congelar a v1 e entrar na rotina

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

### 16.1 Passo 11 (opcional): automação de entrada

Depois do piloto, você já sabe quais perguntas do briefing e quais campos importam. É a hora de automatizar a entrada de cada cliente. Estes scripts ainda **não existem**: são propostas para pedir ao modelo, uma por sessão.

| Automação | O que faz |
|---|---|
| `novo-cliente.mjs` | Você informa o nome e os IDs; ele cria `clientes/<nome>/` com `briefing.md` em branco, `assets/` e um `pagina.yaml` esqueleto com todos os campos obrigatórios, gerado a partir dos `schema.json` |
| Otimização de imagens | No build, converte para WebP ou AVIF, gera tamanhos menores para celular e grava largura e altura |
| Lista de pendências | Compara o `pagina.yaml` com os schemas e informa quais campos e imagens ainda faltam |
| `novo-nicho` | Dado o nome de um nicho, o modelo propõe o perfil (tipos de página, ordem, famílias, briefing, regras) e, aprovado, grava `nichos/<nicho>/` |
| Comando `/nova-pagina` | Conduz o fluxo: briefing, esqueleto, copy, build, QA |

**O que viabiliza isso:** cada campo do `schema.json` declara se é obrigatório, o tipo (texto, imagem, lista), o limite de tamanho e a fonte esperada (briefing, logo, foto). Com isso o esqueleto e a lista de pendências saem automaticamente. Por isso o Comando 1 da seção 11 já pede esses atributos.

**Fluxo ideal de ponta a ponta:**

```
novo-cliente → cliente responde o briefing → modelo preenche o pagina.yaml
→ lista de pendências → você aprova copy e imagens → build + QA → publicar
```

**Limite:** a aprovação da copy e as fotos reais continuam humanas. A automação reduz o trabalho, não elimina a revisão.

**Resumo:** corrija contratos com o piloto, congele a v1 e use a rotina por IDs. Expanda só por demanda real.

---

## 17. Quando o cliente pede algo fora do catálogo

| Situação | O que fazer |
|---|---|
| Ajuste visual pequeno (cor de um botão, espaçamento) | `clientes/<nome>/custom.css`, só com sobrescritas |
| Um campo a mais numa seção | Campo **opcional** no `schema.json` (versione) |
| Seção totalmente nova | Crie variante nova pelo roteiro do Passo 6 |
| Pedido repetido em 2 clientes | Promova para o sistema (variante ou opção) |

`custom.css` **não cria componentes novos**: só ajusta o existente.

**Estado atual:** o `build.mjs` carrega `clientes/<nome>/custom.css` (se existir) e o anexa ao `style.css` depois dos CSS das seções, para que as sobrescritas valham. A pasta `clientes/<nome>/assets/` também é copiada para `dist/assets/`.

**Resumo:** pequeno ajuste vai no `custom.css`; o que se repete entra no sistema.

---

## 18. Sessões, tokens e git

**Por que uma etapa por sessão:** a cada mensagem o modelo relê **toda** a conversa. Sessões longas custam mais e confundem. Sessões curtas começam leves lendo só `CLAUDE.md` e `PROGRESSO.md`.

**Abertura de toda sessão:**

```text
Leia o CLAUDE.md e o PROGRESSO.md, rode npm install e npm test, e faça a próxima etapa.
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

## 19. Comandos de referência

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

**Sistema:**

```bash
node build.mjs <cliente>
```

Sem argumento, o build usa o cliente `teste`. Ele lê `clientes/<cliente>/pagina.yaml` e gera `clientes/<cliente>/dist/index.html` e `style.css`. Antes do primeiro uso, rode `npm install` (a única dependência é o `js-yaml`).

Testes do build:

```bash
npm test
```

O QA (Passo 2) roda assim (use `--sem-browser` para pular overflow, contraste e prints):

```bash
node qa.mjs <cliente>
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

## 20. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `&&` dá erro no PowerShell | PowerShell 5.1 não aceita `&&` | Rode os comandos em linhas separadas |
| `Author identity unknown` | git sem nome e e-mail | `git config --global user.name` e `user.email` |
| `nothing to commit` | Nada foi alterado ou já foi commitado | `git status` e `git log` |
| `not a git repository` | Pasta errada ou falta `git init` | `cd` para a pasta certa, `git init` |
| Screenshot em branco | Painel oculto do app não renderiza | Usar Chrome headless |
| Efeito de rolagem não aparece no print | Conteúdo depende de animação para ficar visível | Conteúdo deve ser visível sem animação |
| Build falha com campo vazio | Comportamento esperado | Preencher o campo no `pagina.yaml` |
| `esperado texto` num telefone ou número | O YAML converteu o valor em número | Pôr aspas: `telefone: "11999999999"` |
| Texto cortado depois de `#` ou `:` | O YAML leu como comentário ou chave | Pôr o texto entre aspas |
| `npm test` ou build dizem `Cannot find package 'js-yaml'` | Falta `npm install` (também em worktree novo) | Rodar `npm install` |
| Variante nova quebra outras | Schema alterado | Versionar o schema e revisar a seção toda |
| Páginas parecidas demais | Pouca variedade de tokens | Usar mais estilos, tipografias e `custom.css` |
| Modelo propõe framework | Tendência a "robustecer" | Recusar; manter HTML/CSS estático |

**Resumo:** a maioria dos erros é de ambiente (PowerShell, git) ou de contrato (schema). Ambos têm solução simples.

---

## 21. Limites do sistema

- **Fotos e textos** continuam sendo o gargalo; o sistema acelera layout, não conteúdo.
- **Variantes nunca usadas** viram peso morto: corte.
- **Páginas parecidas:** o risco cai com tokens, estilos e `custom.css`, mas não some.
- **Mudança incompatível de componente** exige versionar o schema.
- **SEO e performance** entram desde a Fase 0 (meta tags, Open Graph, dados estruturados, peso das imagens), porque corrigir depois, página a página, custa muito mais.
- **Personalizar tudo é o caminho mais caro:** muitas variantes com várias rodadas cada exigem muitas sessões. Priorize as seções de uso universal.
- **Começar pelas variantes visuais** (a parte divertida) sem build, schema e QA gera arquivos soltos. Respeite a ordem.

**Resumo:** o sistema resolve layout e consistência, não conteúdo nem mídia. Priorize, corte e versione.

---

## 22. Glossário

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
