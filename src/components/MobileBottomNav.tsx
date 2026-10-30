import { Link } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, UserRound } from 'lucide-react'

const homeSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, view: 'all' as const, network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }

export function MobileBottomNav() {
  return <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
    <Link to="/" search={homeSearch} hash="inicio" aria-label="Início"><House size={21} fill="currentColor"/></Link>
    <Link to="/favorites" aria-label="Lista de interesse"><Heart size={22} fill="currentColor"/></Link>
    <button type="button" className="mobile-scan-button" aria-label="Leitor de QR Code"><ScanLine size={25}/></button>
    <Link to="/cart" aria-label="Carrinho"><ShoppingCart size={21}/></Link>
    <Link to="/profile" aria-label="Minha conta"><UserRound size={21} fill="currentColor"/></Link>
  </nav>
}
