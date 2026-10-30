import { useEffect } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { getStoredSessionEmail } from '@/api/session'
import { connectRealtime } from '@/api/realtime'

export default function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const queryClient = useQueryClient()
  const sessionEmail = getStoredSessionEmail()
  const hideMobileNav = pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/nft/')

  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return
    return connectRealtime(sessionEmail, {
    onNftUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      void queryClient.invalidateQueries({ queryKey: ['nft'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onOrderUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ['latest-order', sessionEmail ?? 'guest'] })
    },
    })
  }, [pathname, queryClient, sessionEmail])

  return <><Outlet />{!hideMobileNav && <MobileBottomNav />}</>
}
