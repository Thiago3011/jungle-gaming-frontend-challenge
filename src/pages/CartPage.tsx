import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCart, removeFromCart, updateCartQuantity } from '@/api/cart'
import { getStoredSessionEmail } from '@/api/session'
import './shop-pages.css'
import { SiteHeader } from '@/components/SiteHeader'

function formatEth(value: string) {
  const [whole = '0', fraction = ''] = value.split('.')
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const displayedFraction = fraction.slice(0, 4).padEnd(2, '0')
  return `${groupedWhole},${displayedFraction} ETH`
}

export default function CartPage() {
  const queryClient = useQueryClient()
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['cart', sessionEmail], queryFn: getCart })
  const updateMutation = useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) => updateCartQuantity(nftId, quantity),
    onSuccess: (cart) => { queryClient.setQueryData(['cart', sessionEmail], cart) },
  })
  const removeMutation = useMutation({
    mutationFn: (nftId: string) => removeFromCart(nftId),
    onSuccess: (cart) => { queryClient.setQueryData(['cart', sessionEmail], cart) },
  })

  return (
    <main className="shop-page">
      <SiteHeader active="market"/>
      <div className="shop-breadcrumb"><Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }}>Catálogo</Link><span>/</span><span>Carrinho</span></div>
      <section className="cart-page-content">
        <div className="cart-heading"><p className="eyebrow">SUA PRÓXIMA COLEÇÃO</p><h1>Carrinho <span>de NFTs.</span></h1><p>Revise as peças antes de seguir para o pagamento simulado.</p></div>
        {isPending ? <div className="page-message"><span className="skeleton-line" /><span className="skeleton-block" /></div> : isError ? <div className="page-message"><h2>Não foi possível carregar o carrinho.</h2><Button className="primary-cta" onClick={() => void refetch()}>Tentar novamente</Button></div> : !data?.items.length ? <div className="cart-empty"><ShoppingBag size={36} /><h2>Seu carrinho está vazio.</h2><p>Encontre uma peça que combine com você e adicione-a ao carrinho.</p><Link className="shop-primary-link" to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }}>Explorar NFTs <ArrowLeft size={15} /></Link></div> : <div className="cart-layout">
          <div className="cart-items">{data.items.map(({ nft, quantity }) => <article className="cart-item" key={nft.id}><img src={nft.image} alt={`Arte digital ${nft.name}`} /><div className="cart-item-info"><span className="cart-collection">{nft.collection}</span><h2>{nft.name}</h2><span className="cart-edition">Edição {nft.edition}</span><div className="quantity-control"><button type="button" aria-label={`Diminuir quantidade de ${nft.name}`} disabled={quantity <= 1 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId: nft.id, quantity: quantity - 1 })}><Minus size={14} /></button><output aria-label={`Quantidade de ${nft.name}`}>{quantity}</output><button type="button" aria-label={`Aumentar quantidade de ${nft.name}`} disabled={quantity >= 10 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId: nft.id, quantity: quantity + 1 })}><Plus size={14} /></button></div></div><div className="cart-item-price"><strong>{formatEth((Number(nft.priceEth) * quantity).toFixed(4))}</strong><span>{formatEth(nft.priceEth)} / unidade</span><button type="button" className="remove-item" aria-label={`Remover ${nft.name}`} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(nft.id)}><Trash2 size={15} /> Remover</button></div></article>)}</div>
          <aside className="cart-summary"><h2>Resumo do pedido</h2><div className="summary-line"><span>Itens ({data.items.reduce((total, item) => total + item.quantity, 0)})</span><strong>{formatEth(data.subtotalEth)}</strong></div><div className="summary-line"><span>Taxa de rede estimada</span><strong>{formatEth(data.networkFeeEth)}</strong></div><div className="summary-total"><span>Total estimado</span><strong>{formatEth(data.totalEth)}</strong></div><p>Valores simulados. Nenhuma carteira ou pagamento real será acionado.</p><Link className="primary-cta checkout-placeholder" to="/checkout">Conectar e finalizar</Link><Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }} className="continue-shopping"><ArrowLeft size={14} /> Continuar explorando</Link></aside>
        </div>}
      </section>
      <footer className="shop-footer"><Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }} className="brand">KURIO</Link><span>Marketplace demonstrativo · Nenhuma transação real será realizada.</span></footer>
    </main>
  )
}
