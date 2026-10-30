# Architecture — Kurio

## Camadas

- Apresentação: páginas React e componentes compartilhados; o layout aprovado deve permanecer estável.
- Roteamento: TanStack Router mantém parâmetros do catálogo na URL.
- Estado remoto: TanStack Query gerencia catálogo, detalhe, carrinho, perfil, carteiras, favoritos e pedido recente.
- HTTP: Axios usa /api como base.
- Mock backend: MSW implementa os contratos REST e persiste dados demonstrativos no localStorage.
- Realtime: Socket.IO client em src/api/realtime.ts; MSW intercepta o WebSocket em ws://localhost:3001.

## Contratos REST simulados

| Recurso | Métodos | Finalidade |
| --- | --- | --- |
| /auth/login, /auth/register, /auth/logout, /auth/session | POST/GET | Sessão demonstrativa |
| /profile, /profile/password | GET/PATCH/POST | Perfil e senha |
| /wallets, /wallets/:id | GET/POST/PUT/DELETE | Carteiras |
| /favorites, /favorites/:nftId | GET/POST/DELETE | Favoritos por conta |
| /cart, /cart/:nftId | GET/POST/PATCH/DELETE | Carrinho |
| /quote | POST | Cotação calculada a partir do carrinho atual |
| /orders, /orders/latest | POST/GET | Pedido e recuperação do último pedido |
| /nfts, /nfts/:nftId | GET | Catálogo e detalhe |

Handlers privados resolvem a conta pela sessão demonstrativa. Carrinho visitante tem proprietário separado. Favoritos autenticados usam REST; favoritos anônimos permanecem locais.

## Dinheiro e pedidos

Valores ETH trafegam como strings decimais. O carrinho usa bigint em wei para somas. O endpoint de pedido recalcula subtotal, desconto e taxa a partir do carrinho do mock, sem confiar no total enviado pelo navegador.

POST /orders exige Idempotency-Key. Mesma chave e mesmo payload retorna o pedido já criado; mesma chave com payload diferente retorna HTTP 409. Em produção, a chave e o pedido devem ser persistidos atomicamente no backend.

## Eventos

- nft.updated: eventId, version, nftId, priceEth, available, emittedAt.
- order.updated: eventId, version, orderId, status, emittedAt.

O cliente descarta IDs duplicados e versões não crescentes. Atualização de NFT invalida catálogo, detalhe e carrinho; atualização de pedido invalida o pedido recente da conta atual. A simulação associa conexões Socket.IO à conta identificada e publica eventos de pedido apenas para conexões dessa conta.

## Sessão e propriedade

A sessão demonstrativa armazena e-mail e expiração de oito horas. Handlers privados exigem sessão válida. Dados privados e subscriptions são separados por conta. Isso não é uma fronteira de segurança real: a aplicação de produção deve autenticar e autorizar cada chamada no servidor.

## Validação

    npm run typecheck
    npm run lint
    npm run build
    npm run test:e2e

Lighthouse exige preview ativo em http://127.0.0.1:4173.

## Gaps conhecidos antes da submissão

- Ampliar Playwright para os grupos de compra, falhas, sessão, eventos, acessibilidade e regressão visual descritos no desafio.
- Validar o handshake Socket.IO, entrega por conta e reconexão no Chromium.
- Integrar cotação autoritativa em todas as telas e bloquear cotação desatualizada.
- Implementar estados pendente/recusado e recuperação de pagamento interrompido.
- Implementar proteção de rotas e return-to após login.
- Aguardar a execução do workflow Lighthouse, conferir as três amostras por dispositivo e revisar as medianas/Core Web Vitals.
- Publicar deploy e validar deep links, refresh e URL pública.