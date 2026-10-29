import { http, HttpResponse } from 'msw'
import { nfts } from '@/mocks/data/nfts'
import type { Nft, NftSort } from '@/types/nft'

const PAGE_SIZE = 9
type StoredCartItem = { nftId: string; quantity: number }
type CartItemResponse = { nftId: string; quantity: number; nft: Nft; lineTotalEth: string }
const CART_KEY = 'kurio-cart'
const WEI = 10n ** 18n
const decimalToWei = (value: string): bigint => {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole || '0') * WEI + BigInt((fraction + '0'.repeat(18)).slice(0, 18) || '0')
}
const weiToDecimal = (value: bigint): string => {
  const whole = value / WEI
  const fraction = (value % WEI).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}
const readCart = (): StoredCartItem[] => {
  try {
    const value = localStorage.getItem(CART_KEY)
    const parsed = value ? JSON.parse(value) as StoredCartItem[] : []
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item.nftId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) : []
  } catch {
    return []
  }
}
const saveCart = (items: StoredCartItem[]) => localStorage.setItem(CART_KEY, JSON.stringify(items))
const buildCartResponse = () => {
  const items: CartItemResponse[] = readCart().flatMap((item) => {
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    return nft ? [{ ...item, nft, lineTotalEth: weiToDecimal(decimalToWei(nft.priceEth) * BigInt(item.quantity)) }] : []
  })
  const subtotal = items.reduce((sum, item) => sum + decimalToWei(item.nft.priceEth) * BigInt(item.quantity), 0n)
  const networkFee = items.length ? decimalToWei('0.003') : 0n
  return { items, subtotalEth: weiToDecimal(subtotal), networkFeeEth: weiToDecimal(networkFee), totalEth: weiToDecimal(subtotal + networkFee) }
}
const cartError = (message: string, status: number) => HttpResponse.json({ detail: message }, { status })

type MockProfile = { displayName: string; username: string; email: string; ensName: string; walletNickname: string; avatar: string }
type MockWallet = { id: string; nickname: string; network: string; profileName: string; address: string; type: string; email: string; ensName: string; primary: boolean }
const PROFILE_KEY = 'kurio-profile'
const WALLETS_KEY = 'kurio-wallets'
const ORDER_KEY = 'kurio-latest-order'
const DEFAULT_PROFILE: MockProfile = { displayName: 'Thiago Colecionador', username: 'thiago', email: 'contato@email.com', ensName: '', walletNickname: 'Carteira principal', avatar: '' }
const readProfile = (): MockProfile => {
  try { return { ...DEFAULT_PROFILE, ...(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') as Partial<MockProfile>) } }
  catch { return DEFAULT_PROFILE }
}
const saveProfile = (profile: MockProfile) => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
const readWallets = (): MockWallet[] => {
  try {
    const stored = localStorage.getItem(WALLETS_KEY)
    if (stored) return JSON.parse(stored) as MockWallet[]
  } catch { /* use demo defaults */ }
  return [{ id: 'wallet-main', nickname: 'Carteira principal', network: 'Ethereum', profileName: 'Thiago', address: '0xA91F...E82C', type: 'MetaMask', email: 'contato@email.com', ensName: '', primary: true }]
}
const saveWallets = (wallets: MockWallet[]) => localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
const readLatestOrder = (): Record<string, unknown> | null => {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? 'null') as Record<string, unknown> | null }
  catch { return null }
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: unknown; password?: unknown }
    if (typeof body.email !== 'string' || !body.email.includes('@') || typeof body.password !== 'string' || body.password.length < 6) {
      return cartError('E-mail ou senha inválidos.', 401)
    }
    localStorage.setItem('kurio-session', JSON.stringify({ email: body.email, signedInAt: new Date().toISOString() }))
    const profile = readProfile()
    saveProfile({ ...profile, email: body.email })
    return HttpResponse.json({ authenticated: true, profile: readProfile() })
  }),
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { username?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown }
    if (typeof body.username !== 'string' || body.username.trim().length < 3 || typeof body.email !== 'string' || !body.email.includes('@') || typeof body.password !== 'string' || body.password.length < 6 || body.password !== body.confirmPassword) {
      return cartError('Dados de cadastro inválidos.', 422)
    }
    const profile = { ...readProfile(), username: body.username.trim(), displayName: body.username.trim(), email: body.email }
    saveProfile(profile)
    localStorage.setItem('kurio-session', JSON.stringify({ email: body.email, signedInAt: new Date().toISOString() }))
    return HttpResponse.json({ authenticated: true, profile }, { status: 201 })
  }),
  http.get('/api/profile', () => HttpResponse.json(readProfile())),
  http.patch('/api/profile', async ({ request }) => {
    const body = await request.json() as Partial<MockProfile>
    const current = readProfile()
    const next = { ...current, ...body }
    if (!next.displayName.trim() || !next.username.trim() || !next.email.includes('@')) return cartError('Nome, usuário e e-mail são obrigatórios.', 422)
    saveProfile(next)
    return HttpResponse.json(next)
  }),
  http.post('/api/profile/password', async ({ request }) => {
    const body = await request.json() as { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown }
    if (typeof body.currentPassword !== 'string' || body.currentPassword.length < 1 || typeof body.newPassword !== 'string' || body.newPassword.length < 6 || body.newPassword !== body.confirmPassword) return cartError('Dados de senha inválidos.', 422)
    return HttpResponse.json({ updated: true })
  }),
  http.get('/api/wallets', () => HttpResponse.json(readWallets())),
  http.post('/api/wallets', async ({ request }) => {
    const body = await request.json() as Partial<MockWallet>
    if (!body.nickname?.trim() || !body.network || !body.profileName?.trim() || !body.address?.trim() || !body.type || !body.email?.includes('@')) return cartError('Preencha os campos obrigatórios da carteira.', 422)
    const wallets = readWallets()
    const wallet: MockWallet = { id: `wallet-${Date.now()}`, nickname: body.nickname.trim(), network: body.network, profileName: body.profileName.trim(), address: body.address.trim(), type: body.type, email: body.email, ensName: body.ensName ?? '', primary: wallets.length === 0 }
    wallets.push(wallet)
    saveWallets(wallets)
    return HttpResponse.json(wallet, { status: 201 })
  }),
  http.delete('/api/wallets/:walletId', ({ params }) => {
    const wallets = readWallets().filter((wallet) => wallet.id !== params.walletId || wallet.primary)
    saveWallets(wallets)
    return HttpResponse.json(wallets)
  }),
  http.get('/api/orders/latest', () => HttpResponse.json(readLatestOrder())),
  http.post('/api/orders', async ({ request }) => {
    const body = await request.json() as { profile?: Record<string, unknown>; paymentMethod?: unknown; promoCode?: unknown }
    const profile = body.profile ?? {}
    const required = ['displayName', 'username', 'profileName', 'address', 'email']
    if (required.some((key) => typeof profile[key] !== 'string' || !(profile[key] as string).trim()) || typeof profile.email !== 'string' || !profile.email.includes('@')) return cartError('Preencha todos os campos obrigatórios do colecionador.', 422)
    const cart = buildCartResponse()
    if (!cart.items.length) return cartError('O carrinho está vazio.', 409)
    if (!['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(String(body.paymentMethod))) return cartError('Selecione uma carteira válida.', 422)
    const subtotal = Number(cart.subtotalEth)
    const discount = String(body.promoCode ?? '').trim().toUpperCase() === 'KURIO10' ? subtotal * 0.1 : 0
    const networkFee = Number(cart.networkFeeEth)
    const total = Math.max(0, subtotal - discount + networkFee)
    const order = {
      id: `KUR-${Date.now()}`,
      createdAt: new Date().toISOString(),
      paymentMethod: String(body.paymentMethod),
      network: String(profile.network ?? 'Ethereum'),
      items: cart.items,
      subtotalEth: subtotal.toFixed(4),
      networkFeeEth: networkFee.toFixed(4),
      discountEth: discount.toFixed(4),
      totalEth: total.toFixed(4),
      txHash: `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
    }
    localStorage.setItem(ORDER_KEY, JSON.stringify(order))
    localStorage.setItem(CART_KEY, JSON.stringify([]))
    saveProfile({ ...readProfile(), displayName: String(profile.displayName), username: String(profile.username), email: String(profile.email), ensName: String(profile.ensName ?? '') })
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get('/api/nfts/:nftId', ({ params }) => {
    const nft = nfts.find((item) => item.id === params.nftId)
    if (!nft) return HttpResponse.json({ detail: 'NFT não encontrado.' }, { status: 404 })
    return HttpResponse.json(nft)
  }),
  http.get('/api/cart', () => HttpResponse.json(buildCartResponse())),
  http.post('/api/cart', async ({ request }) => {
    const body = await request.json() as { nftId?: unknown; quantity?: unknown }
    if (typeof body.nftId !== 'string' || !Number.isInteger(body.quantity ?? 1) || Number(body.quantity ?? 1) < 1) {
      return cartError('Informe um NFT e uma quantidade válida.', 422)
    }
    const nft = nfts.find((item) => item.id === body.nftId)
    if (!nft) return cartError('NFT não encontrado.', 404)
    const cart = readCart()
    const existing = cart.find((item) => item.nftId === nft.id)
    const nextQuantity = (existing?.quantity ?? 0) + Number(body.quantity ?? 1)
    if (nextQuantity > 10) return cartError('Limite de 10 unidades por NFT.', 409)
    if (existing) existing.quantity = nextQuantity
    else cart.push({ nftId: nft.id, quantity: nextQuantity })
    saveCart(cart)
    return HttpResponse.json(buildCartResponse())
  }),
  http.patch('/api/cart/:nftId', async ({ params, request }) => {
    const body = await request.json() as { quantity?: unknown }
    if (!Number.isInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > 10) {
      return cartError('A quantidade deve ser um inteiro entre 1 e 10.', 422)
    }
    const cart = readCart()
    const item = cart.find((entry) => entry.nftId === params.nftId)
    if (!item) return cartError('Item não encontrado no carrinho.', 404)
    item.quantity = Number(body.quantity)
    saveCart(cart)
    return HttpResponse.json(buildCartResponse())
  }),
  http.delete('/api/cart/:nftId', ({ params }) => {
    const cart = readCart().filter((item) => item.nftId !== params.nftId)
    saveCart(cart)
    return HttpResponse.json(buildCartResponse())
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
