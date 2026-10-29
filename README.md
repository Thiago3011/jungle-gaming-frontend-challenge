# Kurio — Marketplace de NFTs

Aplicação frontend demonstrativa construída com React, TypeScript, Vite, TanStack Router, TanStack Query e MSW.

## Executar localmente

```bash
npm install
npm run dev
```

## Validação

```bash
npm run build
npm run lint
npm run test:e2e
```

Na primeira execução dos testes E2E, instale o navegador do Playwright:

```bash
npx playwright install chromium
```

Os testes sobem o Vite automaticamente em `http://127.0.0.1:4173`.

## Contas para demonstração

O MSW inicializa duas contas fictícias no armazenamento local:

| E-mail | Senha | Perfil |
| --- | --- | --- |
| `thiago@kurio.demo` | `Kurio123!` | Thiago Colecionador |
| `bia@kurio.demo` | `Kurio123!` | Beatriz Colecionadora |

Também é possível criar uma nova conta pela tela de cadastro. O e-mail é único, sem distinção entre maiúsculas e minúsculas.

## Isolamento de dados

O mock mantém os dados privados associados à conta autenticada: perfil, carteiras, carrinho e último pedido. Os favoritos também usam uma chave local específica por conta. O cache privado do TanStack Query é limpo ao entrar, cadastrar ou sair.

O carrinho de visitante permanece separado das contas e é mesclado ao carrinho da conta quando a pessoa faz login ou conclui o cadastro. Quantidades mescladas respeitam o limite de 10 unidades por NFT.

Os handlers de perfil, carteiras e pedidos exigem uma sessão válida. O carrinho pode ser usado como visitante; a finalização do pedido exige autenticação.

## Limites da demonstração

A autenticação, as contas, os dados e as compras são simulados pelo MSW no navegador. As credenciais ficam no `localStorage` apenas para viabilizar o fluxo demonstrativo. Isso **não é autenticação de produção**: uma aplicação real deve validar credenciais e autorizações em um backend confiável, armazenar senhas com hash apropriado e manter dados privados no servidor. Nenhuma transação financeira ou transferência real de NFT acontece.
