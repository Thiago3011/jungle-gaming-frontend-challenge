import { Outlet, useRouterState } from '@tanstack/react-router'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <><Outlet />{pathname !== '/cart' && <MobileBottomNav />}</>
}
