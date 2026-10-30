import { http, HttpResponse, ws } from 'msw'
import { SocketIo } from '@mswjs/socket.io-binding'
import { nfts } from '@/mocks/data/nfts'
import type { Nft, NftSort } from '@/types/nft'

const PAGE_SIZE = 9
type StoredCartItem = { nftId: string; quantity: number }
type CartItemResponse = { nftId: string; quantity: number; nft: Nft; lineTotalEth: string }
type MockProfile = { displayName: string; username: string; email: string; ensName: string; walletNickname: string; avatar: string }
type MockWallet = { id: string; displayName?: string; nickname: string; network: string; profileName: string; address: string; type: string; email: string; ensName: string; primary: boolean }
type MockUser = { email: string; password: string; profile: MockProfile; wallets: MockWallet[]; cart: StoredCartItem[]; favorites: string[]; latestOrder: Record<string, unknown> | null }

const USERS_KEY = 'kurio-users-v2'
const SESSION_KEY = 'kurio-session-v2'
const GUEST_CART_KEY = 'kurio-cart-guest'
const LEGACY_CART_KEY = 'kurio-cart'
const DEFAULT_PROFILE: MockProfile = { displayName: '', username: '', email: '', ensName: '', walletNickname: '', avatar: '' }
const WEI = 10n ** 18n

const demoUsers: MockUser[] = [
  {
    email: 'thiago@kurio.demo',
    password: 'Kurio123!',
    profile: { ...DEFAULT_PROFILE, displayName: 'Thiago Colecionador', username: 'thiago', email: 'thiago@kurio.demo', walletNickname: 'Minha MetaMask' },
    wallets: [{ id: 'wallet-thiago-main', nickname: 'Minha MetaMask', network: 'Ethereum', profileName: 'Thiago', address: '0xA91F00000000000000000000000000000000E82C', type: 'MetaMask', email: 'thiago@kurio.demo', ensName: 'thiago.eth', primary: true }],
    cart: [],
    favorites: [],
    latestOrder: null,
  },
  {
    email: 'bia@kurio.demo',
    password: 'Kurio123!',
    profile: { ...DEFAULT_PROFILE, displayName: 'Beatriz Colecionadora', username: 'bia', email: 'bia@kurio.demo', walletNickname: 'WalletConnect principal' },
    wallets: [{ id: 'wallet-bia-main', nickname: 'WalletConnect principal', network: 'Polygon', profileName: 'Bia', address: '0xB1A0000000000000000000000000000000001234', type: 'WalletConnect', email: 'bia@kurio.demo', ensName: 'bia.eth', primary: true }],
    cart: [],
    latestOrder: null,
  },
]

const decimalToWei = (value: string): bigint => {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole || '0') * WEI + BigInt((fraction + '0'.repeat(18)).slice(0, 18) || '0')
}
const weiToDecimal = (value: bigint): string => {
  const whole = value / WEI
  const fraction = (value % WEI).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? String(whole) + '.' + fraction : String(whole)
}
const cartError = (message: string, status: number) => HttpResponse.json({ detail: message }, { status })

const readUsers = (): MockUser[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (stored !== null) {
      const users = JSON.parse(stored) as MockUser[]
      return Array.isArray(users) ? users.map((user) => ({ ...user, favorites: Array.isArray(user.favorites) ? user.favorites : [] })) : []
    }
  } catch {
    // Restore the demo fixtures when local mock storage is invalid.
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers))
  return demoUsers
}
const saveUsers = (users: MockUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users))
const readSession = (): { email: string } | null => {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as { email?: string } | null
    return value && typeof value.email === 'string' ? { email: value.email.trim().toLowerCase() } : null
  } catch {
    return null
  }
}
const writeSession = (email: string) => localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedInAt: new Date().toISOString() }))
const currentUser = (): MockUser | null => {
  const email = readSession()?.email
  return email ? readUsers().find((user) => user.email === email) ?? null : null
}
const updateUser = (email: string, updater: (user: MockUser) => MockUser): MockUser | null => {
  const users = readUsers()
  const index = users.findIndex((user) => user.email === email)
  if (index < 0) return null
  users[index] = updater(users[index])
  saveUsers(users)
  return users[index]
}
const requireUser = () => {
  const user = currentUser()
  return user ? { user } : { response: cartError('Faça login para acessar seus dados.', 401) }
}
const readGuestCart = (): StoredCartItem[] => {
  try {
    // Move the old anonymous cart once, without assigning it to another person's account.
    if (localStorage.getItem(GUEST_CART_KEY) === null) {
      const legacy = localStorage.getItem(LEGACY_CART_KEY)
      if (legacy) localStorage.setItem(GUEST_CART_KEY, legacy)
      localStorage.removeItem(LEGACY_CART_KEY)
    }
    const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? '[]') as StoredCartItem[]
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item.nftId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) : []
  } catch {
    return []
  }
}
const saveGuestCart = (cart: StoredCartItem[]) => localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))
const mergeCarts = (accountCart: StoredCartItem[], guestCart: StoredCartItem[]): StoredCartItem[] => {
  const merged = accountCart.map((item) => ({ ...item }))
  guestCart.forEach((guestItem) => {
    const existing = merged.find((item) => item.nftId === guestItem.nftId)
    if (existing) existing.quantity = Math.min(10, existing.quantity + guestItem.quantity)
    else merged.push({ ...guestItem, quantity: Math.min(10, guestItem.quantity) })
  })
  return merged
}
const moveGuestCartToUser = (email: string) => {
  const guestCart = readGuestCart()
  if (!guestCart.length) return
  updateUser(email, (user) => ({ ...user, cart: mergeCarts(user.cart, guestCart) }))
  saveGuestCart([])
}
const buildCartResponse = (cart: StoredCartItem[]) => {
  const items: CartItemResponse[] = cart.flatMap((item) => {
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    return nft ? [{ ...item, nft, lineTotalEth: weiToDecimal(decimalToWei(nft.priceEth) * BigInt(item.quantity)) }] : []
  })
  const subtotal = items.reduce((sum, item) => sum + decimalToWei(item.nft.priceEth) * BigInt(item.quantity), 0n)
  const networkFee = items.length ? decimalToWei('0.003') : 0n
  return { items, subtotalEth: weiToDecimal(subtotal), networkFeeEth: weiToDecimal(networkFee), totalEth: weiToDecimal(subtotal + networkFee) }
}
const readActiveCart = () => {
  const user = currentUser()
  return user ? { owner: user.email, items: user.cart } : { owner: null, items: readGuestCart() }
}
const saveActiveCart = (items: StoredCartItem[]) => {
  const user = currentUser()
  if (user) updateUser(user.email, (current) => ({ ...current, cart: items }))
  else saveGuestCart(items)
}

const realtime = ws.link('ws://localhost:3001', { protocol: new SocketIo() })
const realtimeHandler = realtime.addEventListener('connection', ({ client }) => {
  client.send(JSON.stringify(['nft.updated', {
    eventId: 'demo-nft-update-001',
    version: 1,
    nftId: 'ape-009',
    priceEth: '1.69',
    available: true,
    emittedAt: new Date().toISOString(),
  }]))
})

export const handlers = [
  realtimeHandler,
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: unknown; password?: unknown }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const user = readUsers().find((candidate) => candidate.email === email)
    if (!user || typeof body.password !== 'string' || user.password !== body.password) {
      return cartError('E-mail ou senha inválidos.', 401)
    }
    writeSession(email)
    moveGuestCartToUser(email)
    return HttpResponse.json({ authenticated: true, profile: user.profile })
  }),
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { username?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown }
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (username.length < 3 || !email.includes('@') || typeof body.password !== 'string' || body.password.length < 6 || body.password !== body.confirmPassword) {
      return cartError('Dados de cadastro inválidos.', 422)
    }
    const users = readUsers()
    if (users.some((user) => user.email === email)) return cartError('Este e-mail já está cadastrado.', 409)
    const profile = { ...DEFAULT_PROFILE, username, displayName: username, email }
    const user: MockUser = { email, password: body.password, profile, wallets: [], cart: [], favorites: [], latestOrder: null }
    users.push(user)
    saveUsers(users)
    writeSession(email)
    moveGuestCartToUser(email)
    return HttpResponse.json({ authenticated: true, profile }, { status: 201 })
  }),
  http.post('/api/auth/logout', () => {
    localStorage.removeItem(SESSION_KEY)
    return HttpResponse.json({ authenticated: false })
  }),
  http.get('/api/auth/session', () => {
    const user = currentUser()
    return user
      ? HttpResponse.json({ authenticated: true, email: user.email, profile: user.profile })
      : cartError('Não autenticado.', 401)
  }),
  http.get('/api/profile', () => {
    const auth = requireUser()
    return 'response' in auth ? auth.response : HttpResponse.json(auth.user.profile)
  }),
  http.patch('/api/profile', async ({ request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as Partial<MockProfile>
    const next = { ...auth.user.profile, ...body, email: auth.user.email }
    if (!next.displayName.trim() || !next.username.trim()) return cartError('Nome e usuário são obrigatórios.', 422)
    updateUser(auth.user.email, (user) => ({ ...user, profile: next }))
    return HttpResponse.json(next)
  }),
  http.post('/api/profile/password', async ({ request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown }
    if (body.currentPassword !== auth.user.password || typeof body.newPassword !== 'string' || body.newPassword.length < 6 || body.newPassword !== body.confirmPassword) {
      return cartError('Confira a senha atual e confirme a nova senha.', 422)
    }
    updateUser(auth.user.email, (user) => ({ ...user, password: body.newPassword as string }))
    return HttpResponse.json({ updated: true })
  }),
  http.get('/api/favorites', () => {
    const auth = requireUser()
    return 'response' in auth ? auth.response : HttpResponse.json(auth.user.favorites ?? [])
  }),
  http.post('/api/favorites', async ({ request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as { nftId?: unknown }
    if (typeof body.nftId !== 'string' || !nfts.some((nft) => nft.id === body.nftId)) return cartError('NFT inválido.', 404)
    const favorites = [...new Set([...(auth.user.favorites ?? []), body.nftId])]
    updateUser(auth.user.email, (user) => ({ ...user, favorites }))
    return HttpResponse.json(favorites, { status: 201 })
  }),
  http.delete('/api/favorites/:nftId', ({ params }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const favorites = (auth.user.favorites ?? []).filter((id) => id !== params.nftId)
    updateUser(auth.user.email, (user) => ({ ...user, favorites }))
    return HttpResponse.json(favorites)
  }),
  http.get('/api/wallets', () => {
    const auth = requireUser()
    return 'response' in auth ? auth.response : HttpResponse.json(auth.user.wallets)
  }),
  http.post('/api/wallets', async ({ request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as Partial<MockWallet>
    if (!body.nickname?.trim() || !body.network || !body.profileName?.trim() || !body.address?.trim() || !body.type || !body.email?.includes('@')) {
      return cartError('Preencha os campos obrigatórios da carteira.', 422)
    }
    const wallet: MockWallet = {
      id: 'wallet-' + Date.now(),
      displayName: body.displayName?.trim() ?? body.profileName?.trim() ?? '',
      nickname: body.nickname.trim(),
      network: body.network,
      profileName: body.profileName.trim(),
      address: body.address.trim(),
      type: body.type,
      email: body.email.trim().toLowerCase(),
      ensName: body.ensName ?? '',
      primary: auth.user.wallets.length === 0,
    }
    updateUser(auth.user.email, (user) => ({ ...user, wallets: [...user.wallets, wallet] }))
    return HttpResponse.json(wallet, { status: 201 })
  }),
  http.put('/api/wallets/:walletId', async ({ params, request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as Partial<MockWallet>
    if (!body.nickname?.trim() || !body.displayName?.trim() || !body.profileName?.trim() || !body.address?.trim() || !body.email?.includes('@')) return cartError('Preencha os campos obrigatórios da carteira.', 422)
    let updatedWallet: MockWallet | undefined
    updateUser(auth.user.email, (user) => ({
      ...user,
      wallets: user.wallets.map((wallet) => {
        if (wallet.id !== params.walletId || !wallet.primary) return wallet
        updatedWallet = { ...wallet, displayName: body.displayName!.trim(), nickname: body.nickname!.trim(), network: body.network ?? wallet.network, profileName: body.profileName!.trim(), address: body.address!.trim(), type: body.type ?? wallet.type, email: body.email!.trim().toLowerCase(), ensName: body.ensName ?? '' }
        return updatedWallet
      }),
    }))
    return updatedWallet ? HttpResponse.json(updatedWallet) : cartError('Carteira principal não encontrada.', 404)
  }),
  http.delete('/api/wallets/:walletId', ({ params }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const updated = updateUser(auth.user.email, (user) => ({
      ...user,
      wallets: user.wallets.filter((wallet) => wallet.id !== params.walletId || wallet.primary),
    }))
    return HttpResponse.json(updated?.wallets ?? [])
  }),
  http.post('/api/quote', async ({ request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as { promoCode?: unknown }
    const cart = buildCartResponse(auth.user.cart)
    const subtotalWei = decimalToWei(cart.subtotalEth)
    const networkFeeWei = decimalToWei(cart.networkFeeEth)
    const code = String(body.promoCode ?? '').trim().toUpperCase()
    const expired = code === 'KURIOEXPIRED'
    const valid = code === '' || code === 'KURIO10'
    const discountWei = code === 'KURIO10' ? subtotalWei / 10n : 0n
    return HttpResponse.json({
      valid: valid && !expired,
      reason: expired ? 'expired' : valid ? null : 'invalid',
      items: cart.items,
      subtotalEth: weiToDecimal(subtotalWei),
      discountEth: weiToDecimal(discountWei),
      networkFeeEth: weiToDecimal(networkFeeWei),
      totalEth: weiToDecimal(subtotalWei - discountWei + networkFeeWei),
      quotedAt: new Date().toISOString(),
    })
  }),
  http.get('/api/orders/latest', () => {
    const auth = requireUser()
    return 'response' in auth ? auth.response : HttpResponse.json(auth.user.latestOrder)
  }),
  http.post('/api/orders', async ({ request }) => {
    const auth = requireUser()
    if ('response' in auth) return auth.response
    const body = await request.json() as { profile?: Record<string, unknown>; paymentMethod?: unknown; promoCode?: unknown }
    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    if (!idempotencyKey) return cartError('Informe a chave de idempotência da tentativa de compra.', 400)
    const fingerprint = JSON.stringify(body)
    const previous = auth.user.latestOrder
    if (previous?.idempotencyKey === idempotencyKey) {
      if (previous.requestFingerprint !== fingerprint) return cartError('A chave de idempotência já foi utilizada com outro conteúdo.', 409)
      return HttpResponse.json(previous)
    }
    const profile = body.profile ?? {}
    const required = ['displayName', 'username', 'profileName', 'address', 'email']
    if (required.some((key) => typeof profile[key] !== 'string' || !(profile[key] as string).trim()) || typeof profile.email !== 'string' || profile.email.trim().toLowerCase() !== auth.user.email) {
      return cartError('Preencha os campos obrigatórios e use o e-mail da conta autenticada.', 422)
    }
    const cart = buildCartResponse(auth.user.cart)
    if (!cart.items.length) return cartError('O carrinho está vazio.', 409)
    if (!['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(String(body.paymentMethod))) return cartError('Selecione uma carteira válida.', 422)
    const subtotalWei = decimalToWei(cart.subtotalEth)
    const discountWei = String(body.promoCode ?? '').trim().toUpperCase() === 'KURIO10' ? subtotalWei / 10n : 0n
    const networkFeeWei = decimalToWei(cart.networkFeeEth)
    const totalWei = subtotalWei - discountWei + networkFeeWei
    const order = {
      id: 'KUR-' + Date.now(),
      idempotencyKey,
      requestFingerprint: fingerprint,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      paymentMethod: String(body.paymentMethod),
      network: String(profile.network ?? 'Ethereum'),
      items: cart.items,
      subtotalEth: weiToDecimal(subtotalWei),
      networkFeeEth: weiToDecimal(networkFeeWei),
      discountEth: weiToDecimal(discountWei),
      totalEth: weiToDecimal(totalWei),
      txHash: '0x' + Math.random().toString(16).slice(2, 8).toUpperCase() + '...' + Math.random().toString(16).slice(2, 6).toUpperCase(),
    }
    updateUser(auth.user.email, (user) => ({
      ...user,
      latestOrder: order,
      cart: [],
      profile: { ...user.profile, displayName: String(profile.displayName), username: String(profile.username), ensName: String(profile.ensName ?? '') },
    }))
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get('/api/cart', () => {
    const active = readActiveCart()
    return HttpResponse.json(buildCartResponse(active.items))
  }),
  http.post('/api/cart', async ({ request }) => {
    const body = await request.json() as { nftId?: unknown; quantity?: unknown }
    if (typeof body.nftId !== 'string' || !Number.isInteger(body.quantity ?? 1) || Number(body.quantity ?? 1) < 1) {
      return cartError('Informe um NFT e uma quantidade válida.', 422)
    }
    const nft = nfts.find((item) => item.id === body.nftId)
    if (!nft) return cartError('NFT não encontrado.', 404)
    const cart = readActiveCart().items.map((item) => ({ ...item }))
    const existing = cart.find((item) => item.nftId === nft.id)
    const nextQuantity = (existing?.quantity ?? 0) + Number(body.quantity ?? 1)
    if (nextQuantity > 10) return cartError('Limite de 10 unidades por NFT.', 409)
    if (existing) existing.quantity = nextQuantity
    else cart.push({ nftId: nft.id, quantity: nextQuantity })
    saveActiveCart(cart)
    return HttpResponse.json(buildCartResponse(cart))
  }),
  http.patch('/api/cart/:nftId', async ({ params, request }) => {
    const body = await request.json() as { quantity?: unknown }
    if (!Number.isInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > 10) {
      return cartError('A quantidade deve ser um inteiro entre 1 e 10.', 422)
    }
    const cart = readActiveCart().items.map((item) => ({ ...item }))
    const item = cart.find((entry) => entry.nftId === params.nftId)
    if (!item) return cartError('Item não encontrado no carrinho.', 404)
    item.quantity = Number(body.quantity)
    saveActiveCart(cart)
    return HttpResponse.json(buildCartResponse(cart))
  }),
  http.delete('/api/cart/:nftId', ({ params }) => {
    const cart = readActiveCart().items.filter((item) => item.nftId !== params.nftId)
    saveActiveCart(cart)
    return HttpResponse.json(buildCartResponse(cart))
  }),
  http.get('/api/nfts/:nftId', ({ params }) => {
    const nft = nfts.find((item) => item.id === params.nftId)
    if (!nft) return HttpResponse.json({ detail: 'NFT não encontrado.' }, { status: 404 })
    return HttpResponse.json(nft)
  }),
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const query = (url.searchParams.get('q') ?? '').trim().toLocaleLowerCase('pt-BR')
    const category = url.searchParams.get('category') ?? 'Todas'
    const sort = (url.searchParams.get('sort') ?? 'recent') as NftSort
    const view = url.searchParams.get('view') ?? 'all'
    const network = url.searchParams.get('network') ?? 'Todas'
    const minPrice = Number(url.searchParams.get('minPrice') ?? 0.02)
    const maxPrice = Number(url.searchParams.get('maxPrice') ?? 12.3)
    const requestedPage = Number(url.searchParams.get('page') ?? 1)

    const matchesSearchAndPrice = (nft: typeof nfts[number]) => {
      const searchable = [nft.name, nft.collection, nft.creator].some((value) => value.toLocaleLowerCase('pt-BR').includes(query))
      const matchesQuery = !query || searchable
      const price = Number(nft.priceEth)
      return matchesQuery && price >= minPrice && price <= maxPrice
    }

    // Facet counts reflect the current search/price constraints while excluding
    // their own facet, so users can combine category and network filters.
    const categoryCounts = Object.fromEntries(
      [...new Set(nfts.map((nft) => nft.category))].map((name) => [
        name,
        nfts.filter((nft) => matchesSearchAndPrice(nft)
          && (network === 'Todas' || nft.network === network)
          && nft.category === name).length,
      ]),
    ) as Record<string, number>
    const networkCounts = Object.fromEntries(
      [...new Set(nfts.map((nft) => nft.network).filter((name): name is string => Boolean(name)))].map((name) => [
        name,
        nfts.filter((nft) => matchesSearchAndPrice(nft)
          && (category === 'Todas' || nft.category === category)
          && nft.network === name).length,
      ]),
    ) as Record<string, number>

    let results = nfts.filter((nft) => {
      return matchesSearchAndPrice(nft)
        && (category === 'Todas' || nft.category === category)
        && (network === 'Todas' || nft.network === network)
    })

    if (view === 'new' || sort === 'recent') results = [...results].sort((a, b) => (b.listedAt ?? 0) - (a.listedAt ?? 0))
    if (view === 'trending') results = [...results].sort((a, b) => b.likes - a.likes)
    if (sort === 'price-asc') results = [...results].sort((a, b) => Number(a.priceEth) - Number(b.priceEth))
    if (sort === 'price-desc') results = [...results].sort((a, b) => Number(b.priceEth) - Number(a.priceEth))
    if (sort === 'featured') results = [...results].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))

    const total = results.length
    const page = Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1)
    const start = (page - 1) * PAGE_SIZE
    return HttpResponse.json({ items: results.slice(start, start + PAGE_SIZE), total, page, pageSize: PAGE_SIZE, facets: { categories: categoryCounts, networks: networkCounts } })
  }),
]
