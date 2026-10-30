import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Search, ShoppingBag, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { getCart } from '@/api/cart'
import { getStoredSessionEmail } from '@/api/session'
import './site-header.css'

const homeSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, view: 'all' as const, network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }

export function SiteHeader({ active = '', onSearchClick, searchContent }: { active?: string; onSearchClick?: () => void; searchContent?: ReactNode }) {
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const { data: cart } = useQuery({ queryKey: ['cart', sessionEmail], queryFn: getCart })
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  return <header className="kurio-site-header"><div className="kurio-site-header-inner">
    <Link className="kurio-brand" to="/" search={homeSearch}>KURIO<span>.</span></Link>
    <nav className="kurio-main-nav" aria-label="Navegação principal">
      <Link className={active === 'home' ? 'active' : ''} to="/" search={homeSearch}>Início</Link>
      <Link className={active === 'market' ? 'active' : ''} to="/" search={{ ...homeSearch, view: 'all' }}>Mercado</Link>
      <a href="/#criadores">Criadores</a><a href="/#aprenda">Aprenda</a>
    </nav>
    <div className="kurio-header-actions"><span className="kurio-header-search-slot">{onSearchClick ? <button className="kurio-header-icon" type="button" aria-label="Abrir busca" onClick={onSearchClick}><Search size={20}/></button> : null}</span>{searchContent}
      <Link className="kurio-header-icon kurio-cart-link" to="/cart" aria-label={`Carrinho com ${cartCount} itens`}><ShoppingBag size={19}/><span className="kurio-cart-count">{cartCount}</span></Link>
      <Link className="kurio-account-button" to={sessionEmail !== 'guest' ? '/profile' : '/login'}><Wallet size={15}/>{sessionEmail !== 'guest' ? 'Minha conta' : 'Entrar'}</Link>
    </div>
  </div></header>
}
