# INDEX de variantes

Uma linha por variante: o que é, quando usar, limites, se exige imagem.
Formato obrigatório: ``- `<id>` — ...`` (o `lint.mjs` lê o ID entre crases).

## hero
- `hero-a` — Hero centralizado, texto empilhado (título, subtítulo, botão CTA) sobre fundo `--surface`. Usar como abertura de qualquer página quando a mensagem é só texto. Limites: 1 CTA, sem lista de pontos; campo `imagem` existe no schema mas esta variante NÃO o exibe. Exige imagem: não.

## cabecalho
- `cabecalho-a` — Barra simples: marca (texto não clicável, com logo opcional) à esquerda, links de navegação e botão CTA opcionais à direita. Usar no topo de site ou landing (em landing de anúncio, só marca + CTA). Limites: até 6 links; sem menu hambúrguer (links quebram de linha no celular). Bloco `cabecalho` do pagina.yaml, fora da ordem do nicho. Exige imagem: não.

## rodape
- `rodape-a` — Rodapé em duas colunas: identificação (nome, texto, redes) e contatos (telefone, e-mail, endereço, links), com aviso legal e copyright opcionais abaixo. Usar no fim de qualquer página. Limites: até 8 links e 6 redes; sem formulário. Bloco `rodape` do pagina.yaml, fora da ordem do nicho. Exige imagem: não.
