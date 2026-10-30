import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import App from '@/App'
import NftDetailPage from '@/pages/NftDetailPage'
import CartPage from '@/pages/CartPage'
import { CheckoutPage, LoginPage, OrderConfirmationPage, ProfilePage, RegisterPage, WalletsPage } from '@/pages/AccountPages'
import type { CatalogView, NftSort } from '@/types/nft'
import RootLayout from '@/components/RootLayout'

const validSorts: NftSort[] = ['recent', 'featured', 'price-asc', 'price-desc']
const validViews: CatalogView[] = ['all', 'new', 'trending']

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
    category: typeof search.category === 'string' ? search.category : 'Todas',
    sort: validSorts.includes(search.sort as NftSort) ? search.sort as NftSort : 'recent',
    page: Math.max(1, Number.isFinite(Number(search.page)) ? Math.floor(Number(search.page)) : 1),
    view: validViews.includes(search.view as CatalogView) ? search.view as CatalogView : 'all',
    network: typeof search.network === 'string' ? search.network : 'Todas',
    minPrice: typeof search.minPrice === 'string' ? search.minPrice : '0.02',
    maxPrice: typeof search.maxPrice === 'string' ? search.maxPrice : '12.30',
  }),
  component: App,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegisterPage })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: ProfilePage })
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/wallets', component: WalletsPage })
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: CheckoutPage })
const orderConfirmationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/order-confirmation', component: OrderConfirmationPage })

const routeTree = rootRoute.addChildren([indexRoute, nftDetailRoute, cartRoute, loginRoute, registerRoute, profileRoute, walletsRoute, checkoutRoute, orderConfirmationRoute])
export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
