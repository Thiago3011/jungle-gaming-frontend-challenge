import { useQuery } from '@tanstack/react-query'
import { Search, ShoppingBag, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { getCart } from '@/api/cart'
import { getStoredSessionEmail } from '@/api/session'
import './site-header.css'

export function SiteHeader({ active = '', onSearchClick, searchContent }: { active?: string; onSearchClick?: () => void; searchContent?: ReactNode }) {
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const { data: cart } = useQuery({ queryKey: ['cart', sessionEmail], queryFn: getCart })
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  return <header className="kurio-site-header"><div className="kurio-site-header-inner">
    <a className="kurio-brand" href="/#inicio">KURIO<span>.</span></a>
    <nav className="kurio-main-nav" aria-label="Navegação principal">
      <a className={active === 'home' ? 'active' : ''} href="/#inicio">Início</a>
      <a className={active === 'market' ? 'active' : ''} href="/#mercado">Mercado</a>
      <a href="/#criadores">Criadores</a><a href="/#aprenda">Aprenda</a>
    </nav>
    <div className="kurio-header-actions"><span className="kurio-header-search-slot">{onSearchClick ? <button className="kurio-header-icon" type="button" aria-label="Abrir busca" onClick={onSearchClick}><Search size={20}/></button> : null}</span>{searchContent ? <div className="kurio-header-search-popover">{searchContent}</div> : null}
      <a className="kurio-header-icon kurio-cart-link" href="/cart" aria-label={`Carrinho com ${cartCount} itens`}><ShoppingBag size={19}/><span className="kurio-cart-count">{cartCount}</span></a>
      <a className="kurio-account-button" href={sessionEmail !== 'guest' ? '/profile' : '/login'}><Wallet size={15}/>{sessionEmail !== 'guest' ? 'Minha conta' : 'Entrar'}</a>
    </div>
  </div></header>
}
