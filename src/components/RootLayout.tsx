import { Outlet, useRouterState } from '@tanstack/react-router'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hideMobileNav = pathname === '/cart' || pathname.startsWith('/nft/')
  return <><Outlet />{!hideMobileNav && <MobileBottomNav />}</>
}
