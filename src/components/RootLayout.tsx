import { Outlet } from '@tanstack/react-router'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default function RootLayout() {
  return <><Outlet /><MobileBottomNav /></>
}
