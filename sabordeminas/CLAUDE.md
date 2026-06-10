# Sabor de Minas — Documentação do Projeto

## Visão Geral

Site de e-commerce estático para a loja **Sabor de Minas**, especializada em produtos da culinária mineira (pão de queijo, farofas, guaraná mineiro e café em grãos). Os pedidos são enviados diretamente pelo WhatsApp. Há um painel administrativo separado protegido por autenticação.

**Stack:** HTML5 + CSS3 + JavaScript Vanilla + Supabase (banco, auth, storage) + Chart.js  
**Sem build tools.** Nenhum npm, webpack, ou framework — arquivos estáticos puros.

---

## Estrutura de Arquivos

```
sabordeminas/
├── index.html          # Loja pública (vitrine)
├── style.css           # Todos os estilos da loja
├── script.js           # JS da loja (produtos, carrinho, WhatsApp)
├── admin.html          # Painel admin (styles e scripts inline)
├── login.html          # Login do admin
├── manifest.json       # PWA manifest (apontado para admin.html)
├── service-worker.js   # Service worker mínimo (sem cache)
└── imagens/
    ├── sabordeminas.jpeg   # Logo (usado no header e footer)
    ├── pao.jpeg            # Hero background + imagem padrão de produto
    └── cafepao.jpeg        # Seção "Nossa História"
```

---

## Design System

### Paleta de Cores (CSS Variables em `style.css`)

| Variável         | Valor       | Uso                                      |
|------------------|-------------|------------------------------------------|
| `--orange`       | `#f56600`   | Cor principal — botões, destaques, links |
| `--orange-dark`  | `#c74600`   | Hover states, gradientes                 |
| `--cream`        | `#fff8ef`   | Background geral do site                 |
| `--white`        | `#ffffff`   | Cards, painéis                           |
| `--text`         | `#1a120c`   | Texto principal                          |
| `--muted`        | `#6f5a49`   | Texto secundário/descritivo              |
| `--shadow`       | `0 10px 30px rgba(108,59,18,.15)` | Sombra padrão de cards |
| `--line`         | `rgba(245,102,0,.18)` | Bordas sutis                   |

### Tipografia

- **Inter** — fonte principal (pesos: 400, 500, 600, 700, 800, 900)
- **Pacifico** — apenas no `<h1>` da hero (`<span class="script">`)
- Carregadas via Google Fonts no `<head>` do `index.html`

### Componentes Reutilizáveis

- `.btn` — botão base (pill shape, `border-radius: 999px`)
  - `.btn-orange` — fundo laranja com shadow
  - `.btn-outline` — borda laranja, fundo branco
- `.tag` — badge de produto (`background: #fff1e3`)
- `.reveal` — elemento com animação de entrada (IntersectionObserver)
- `.section-title` + `.underline` — título de seção com sublinhado laranja

### Breakpoints Responsivos

| Breakpoint | Comportamento principal                                        |
|------------|----------------------------------------------------------------|
| `≤ 1050px` | Layout de produtos vira 1 coluna; footer 2 colunas            |
| `≤ 780px`  | Menu hambúrguer ativo; hero com backdrop blur; steps 1 coluna |
| `≤ 480px`  | Botões em largura total; produto showcase compacto            |
| `≤ 768px`  | (segunda media query) Order panel vira bottom sheet           |

---

## Backend — Supabase

**URL:** `https://dkajekepsxbgjzaznfgl.supabase.co`  
**Chave pública:** `sb_publishable_ph00G7Qw0EOkHF0qZNeRRg_HKycEpfD`  
**SDK:** carregado via CDN `@supabase/supabase-js@2`

### Tabelas

#### `products`
| Coluna        | Tipo    | Notas                                              |
|---------------|---------|----------------------------------------------------|
| `id`          | int     | PK, ordenação ascendente                           |
| `name`        | text    | Nome exibido na loja e nas abas                    |
| `description` | text    | Texto descritivo do produto                        |
| `price`       | numeric | Preço base (não usado para café — ver `coffee`)    |
| `image`       | text    | URL da imagem (Supabase Storage ou externa)        |
| `tags`        | text    | String com tags separadas por vírgula              |
| `coffee`      | boolean | `true` → ativa o seletor de gramatura              |

#### `orders`
| Coluna       | Tipo      | Notas                                                    |
|--------------|-----------|----------------------------------------------------------|
| `id`         | int       | PK                                                       |
| `items`      | text      | Lista de itens formatada (separada por `\n`)             |
| `total`      | numeric   | Valor total do pedido                                    |
| `status`     | text      | `Pendente` / `Preparando` / `Entregue` / `Cancelado`    |
| `created_at` | timestamp | Gerado automaticamente pelo Supabase                     |

### Storage

- Bucket: `product-images`
- Acesso público
- URL padrão: `https://dkajekepsxbgjzaznfgl.supabase.co/storage/v1/object/public/product-images/{filename}`

### Autenticação

- Email + senha via `supabase.auth.signInWithPassword()`
- Admin verifica sessão no load com `supabase.auth.getSession()`
- Sem sessão → redireciona para `login.html`

---

## Funcionalidades da Loja (`index.html` + `script.js`)

### Produtos

- Carregados do Supabase na tabela `products` em ordem de `id` ascendente
- Renderizados como abas clicáveis em `#productTabs`
- Showcase dinâmico com imagem, nome, descrição, tags e preço
- Produto "Farofas Mineiras" usa `object-fit: contain` na imagem (identificado pelo nome)
- Produto "Café em Grãos" exibe seletor de gramatura com preços fixos:
  - 250g → R$ 22,90
  - 500g → R$ 42,90
  - 1kg → R$ 79,90

### Carrinho

- Estado em memória (`cart[]`) e persistido em `localStorage` com a chave `saborDeMinasCart`
- Operações: adicionar, aumentar (`+`), diminuir (`−`), remover (`×`), limpar tudo
- Exibe subtotal calculado em tempo real
- Contador sincronizado no header e no botão flutuante

### Envio de Pedido

1. Usuário preenche nome e endereço no painel lateral
2. Clique em "Enviar pedido pelo WhatsApp":
   - Salva pedido na tabela `orders` do Supabase (status "Pendente")
   - Abre `wa.me/5583988551234` com mensagem pré-formatada

> **Atenção:** O número do WhatsApp hardcoded em `script.js` (`5583988551234`) diverge do número exibido no footer `(83) 98710-9484`. Verificar qual é o correto antes de alterar.

### Animações

- Elementos com `.reveal` são observados via `IntersectionObserver` (threshold 0.12)
- Ao entrar na viewport ganham `.show` → opacidade 1, translateY(0)

### Carrossel de Avaliações

- Track CSS com `transform: translateX` controlado por JS
- Botões prev/next e dots de navegação gerados dinamicamente
- 4 avaliações fixas no HTML (Mariana, João, Fernanda, Lucas)

---

## Painel Administrativo (`admin.html`)

Arquivo autocontido — todos os estilos e scripts estão inline.

### Acesso

- `login.html` → autentica via Supabase Auth → redireciona para `admin.html`
- Logout: `supabase.auth.signOut()` + redirect para `login.html`

### Dashboard

- Métricas: total de pedidos, pendentes, entregues, cancelados, faturamento, produto mais vendido
- Gráfico de linha (Chart.js) com faturamento diário (excluindo cancelados)
- Lista de pedidos por dia
- Auto-refresh a cada 5 segundos (`setInterval`)

### Gestão de Produtos

- Seleciona produto por ID, define novo preço e/ou nova imagem
- Upload de imagem vai para o bucket `product-images` no Supabase Storage
- Atualiza via `supabase.from("products").update()`

### Gestão de Pedidos

- Tabela com todos os pedidos (ordem decrescente por `created_at`)
- Dropdown inline para mudar status de cada pedido
- Status possíveis: Pendente, Preparando, Entregue, Cancelado

---

## PWA

- `manifest.json` aponta `start_url` para `/admin.html`
- Ícone: `sabordeminas.jpeg` (192×192 e 512×512)
- `service-worker.js` registrado em `admin.html` — sem cache, apenas install + activate + claim
- Theme color: `#f56600`

---

## Contato e Redes

- **WhatsApp:** (83) 98710-9484 (exibido no footer)
- **Instagram:** [@cesar.sabordeminas](https://www.instagram.com/cesar.sabordeminas/)
- **Formas de pagamento:** Pix, VISA, Mastercard

---

## Convenções e Pontos de Atenção

1. **Sem framework CSS** — não adicionar Bootstrap, Tailwind ou similares. Manter o CSS manual em `style.css`.
2. **Sem build** — todo JS deve ser compatível com browsers modernos sem transpilação.
3. **Imagens** ficam em `./imagens/`. Nomes de arquivo sem espaços.
4. **Admin autocontido** — `admin.html` tem tudo inline propositalmente para facilitar deploy simples.
5. **IDs de Supabase** — não rotacionar a chave pública sem atualizar `script.js`, `admin.html` e `login.html` simultaneamente.
6. **Número do WhatsApp** — há inconsistência entre o footer e o `script.js`. Confirmar e unificar.
7. **Tags de produtos** — campo `tags` no Supabase é uma string separada por vírgula; o `script.js` faz `.split(",")` e `.trim()` em cada item.
8. **Produto "Café"** — a lógica de mostrar o seletor de gramatura depende exatamente do nome `"Café em Grãos"` — não renomear sem atualizar `script.js:96`.
9. **Produto "Farofas"** — `object-fit: contain` depende do nome exato `"Farofas Mineiras"` — ver `script.js:81`.
