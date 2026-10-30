import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToCart, getCart, removeFromCart, updateCartQuantity } from '@/api/cart'
import { getNfts } from '@/api/nfts'
import { getStoredSessionEmail } from '@/api/session'
import { SiteHeader } from '@/components/SiteHeader'
import './shop-pages.css'

const homeSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, view: 'all' as const, network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }

function formatEth(value: number | string) {
  return `${Number(value).toFixed(2)} ETH`
}

export default function CartPage() {
  const queryClient = useQueryClient()
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeRecommendationPage, setActiveRecommendationPage] = useState(1)
  const [promoDraft, setPromoDraft] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['cart', sessionEmail], queryFn: getCart })
  const { data: recommendations } = useQuery({
    queryKey: ['cart-recommendations'],
    queryFn: async () => {
      const pages = await Promise.all([1, 2, 3, 4].map((page) => getNfts({ q: '', category: 'Todas', sort: 'featured', page, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' })))
      return pages.flatMap((result) => result.items)
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) => updateCartQuantity(nftId, quantity),
    onSuccess: (cart) => { queryClient.setQueryData(['cart', sessionEmail], cart) },
  })
  const removeMutation = useMutation({
    mutationFn: (nftId: string) => removeFromCart(nftId),
    onSuccess: (cart) => { queryClient.setQueryData(['cart', sessionEmail], cart) },
  })
  const addMutation = useMutation({
    mutationFn: (nftId: string) => addToCart(nftId),
    onSuccess: (cart) => { queryClient.setQueryData(['cart', sessionEmail], cart); void queryClient.invalidateQueries({ queryKey: ['cart'] }) },
  })
  const cartIds = useMemo(() => new Set(data?.items.map((item) => item.nftId) ?? []), [data?.items])
  const availableSuggestions = (recommendations ?? []).filter((nft) => !cartIds.has(nft.id))
  // Keep the carousel useful even when every catalog NFT is already in the cart.
  const suggested = (availableSuggestions.length ? availableSuggestions : recommendations ?? []).slice(0, 36)
  const subtotal = Number(data?.subtotalEth ?? 0)
  const discount = promoApplied ? subtotal * 0.1 : 0
  const networkFee = Number(data?.networkFeeEth ?? 0)
  const total = Math.max(0, subtotal - discount) + networkFee
  const itemCount = data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  function applyPromo() {
    if (promoDraft.trim().toUpperCase() === 'KURIO10') {
      setPromoApplied(true)
      setPromoMessage('Código aplicado: 10% de desconto simulado.')
    } else {
      setPromoApplied(false)
      setPromoMessage('Código não reconhecido. Tente KURIO10.')
    }
  }

  return (
    <main className="shop-page cart-page">
      <SiteHeader active="market" />
      <div className="shop-breadcrumb"><Link to="/" search={homeSearch}>Início</Link><span>/</span><Link to="/" search={{ ...homeSearch, view: 'all' }}>Mercado</Link><span>/</span><span>Carrinho</span></div>
      <Link className="cart-mobile-back" to="/" search={homeSearch} aria-label="Voltar ao mercado"><ArrowLeft size={22}/></Link>
      <section className="cart-page-content">
        <div className="cart-heading"><p className="eyebrow">SUA PRÓXIMA COLEÇÃO</p><h1>Carrinho <span>de NFTs.</span></h1><p>Revise as peças antes de seguir para o pagamento simulado.</p></div>
        {isPending ? <div className="page-message"><span className="skeleton-line" /><span className="skeleton-block" /></div> : isError ? <div className="page-message"><h2>Não foi possível carregar o carrinho.</h2><Button className="primary-cta" onClick={() => void refetch()}>Tentar novamente</Button></div> : !data?.items.length ? <div className="cart-empty"><ShoppingBag size={36} /><h2>Seu carrinho está vazio.</h2><p>Encontre uma peça que combine com você e adicione-a ao carrinho.</p><Link className="shop-primary-link" to="/" search={homeSearch}>Explorar NFTs <ArrowLeft size={15} /></Link></div> : (
          <div className="cart-layout">
            <div className="cart-table-wrap">
              <div className="cart-table-head"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span aria-hidden="true" /></div>
              <div className="cart-items">{data.items.map(({ nft, quantity }) => (
                <article className="cart-item" key={nft.id}>
                  <div className="cart-product"><img src={nft.image} alt={`Arte digital ${nft.name}`} /><div className="cart-item-info"><h2>{nft.name}</h2><span className="cart-item-edition">Edição: {nft.edition}</span><strong className="cart-mobile-price">{formatEth(nft.priceEth)}</strong></div></div>
                  <strong className="cart-unit-price">{formatEth(nft.priceEth)}</strong>
                  <div className="cart-quantity"><button type="button" aria-label={`Diminuir quantidade de ${nft.name}`} disabled={quantity <= 1 || updateMutation.isPending} onClick={() => quantity === 1 ? removeMutation.mutate(nft.id) : updateMutation.mutate({ nftId: nft.id, quantity: quantity - 1 })}><Minus size={15} /></button><output aria-label={`Quantidade de ${nft.name}`}>{quantity}</output><button type="button" aria-label={`Aumentar quantidade de ${nft.name}`} disabled={quantity >= 10 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId: nft.id, quantity: quantity + 1 })}><Plus size={15} /></button></div>
                  <strong className="cart-line-total">{formatEth(Number(nft.priceEth) * quantity)}</strong>
                </article>
              ))}</div>
            </div>
            <aside className="cart-summary">
              <h2>Resumo da carteira</h2>
              <label className="promo-label" htmlFor="cart-promo">Código promocional</label>
              <div className="promo-control"><input id="cart-promo" value={promoDraft} onChange={(event) => setPromoDraft(event.target.value)} placeholder="Digite o código promocional..." /><button type="button" onClick={applyPromo}>Aplicar</button></div>
              {promoMessage && <p className={promoApplied ? 'promo-feedback success' : 'promo-feedback'} role="status">{promoMessage}</p>}
              <div className="summary-line"><span>Subtotal</span><strong>{formatEth(subtotal)}</strong></div>
              <div className="summary-line"><span>Desconto do lançamento</span><strong>{promoApplied ? `(-) ${formatEth(discount)}` : '(-) 0.00 ETH'}</strong></div>
              <div className="summary-line network-fee"><span>Taxa de rede</span><strong>{formatEth(networkFee)}</strong></div>
              <span className="fee-caption">Taxa estimada</span>
              <div className="summary-total"><span>Total</span><strong>{formatEth(total)}</strong></div>
              <p className="cart-summary-note">{itemCount} {itemCount === 1 ? 'edição selecionada' : 'edições selecionadas'}. Valores simulados; nenhuma transação real será realizada.</p>
              <Link className="primary-cta checkout-placeholder" to="/checkout">Conectar e finalizar</Link>
              <Link to="/" search={homeSearch} className="continue-shopping">Continuar explorando</Link>
            </aside>
          </div>
        )}
      </section>

      {suggested.length > 0 && (
        <section className="cart-recommendations" aria-labelledby="cart-recommendations-title">
          <div className="cart-recommendations-heading"><h2 id="cart-recommendations-title">Colecionadores também viram</h2><Link to="/" search={homeSearch}>Ver mercado <ArrowRight size={15}/></Link></div>
          <div className="cart-recommendations-viewport" ref={carouselRef} onScroll={() => {
            const element = carouselRef.current
            if (!element) return
            const maxScroll = element.scrollWidth - element.clientWidth
            setActiveRecommendationPage(maxScroll > 0 ? Math.min(2, Math.round((element.scrollLeft / maxScroll) * 2)) : 0)
          }}>
            <div className="cart-recommendations-grid">{suggested.map((nft) => {
              const alreadyInCart = cartIds.has(nft.id)
              return <article className="cart-recommendation-card" key={nft.id}>
                <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="cart-recommendation-image"><img src={nft.image} alt={nft.name} loading="lazy"/></Link>
                <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="cart-recommendation-name">{nft.name}</Link>
                <div className="cart-recommendation-bottom"><strong>{formatEth(nft.priceEth)}</strong><button type="button" disabled={alreadyInCart || addMutation.isPending} onClick={() => addMutation.mutate(nft.id)}>{alreadyInCart ? 'No carrinho' : 'Adicionar'}</button></div>
              </article>
            })}</div>
          </div>
          <div className="cart-carousel-dots" aria-label="Páginas de recomendações">
            {[0, 1, 2].map((page) => <button key={page} type="button" className={activeRecommendationPage === page ? 'active' : ''} aria-label={`Ir para página ${page + 1} das recomendações`} aria-current={activeRecommendationPage === page ? 'page' : undefined} onClick={() => {
              const element = carouselRef.current
              if (!element) return
              const maxScroll = element.scrollWidth - element.clientWidth
              element.scrollTo({ left: maxScroll * (page / 2), behavior: 'smooth' })
            }}/>)}
          </div>
        </section>
      )}

      <section className="trust-newsletter cart-trust" aria-label="Benefícios e novidades">
        <article className="trust-item"><span className="trust-initial">W</span><h3>Segurança da carteira</h3><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></article>
        <article className="trust-item"><span className="trust-initial">C</span><h3>Criadores em destaque</h3><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></article>
        <article className="trust-item"><span className="trust-initial">D</span><h3>Alertas de lançamentos</h3><p>Receba calendários de cunhagem, novidades e listas de acesso antecipado.</p></article>
        <Newsletter />
      </section>
      <footer className="site-footer cart-site-footer">
        <div className="footer-brand-row"><Link className="brand" to="/" search={homeSearch}>KURIO<span>.</span></Link><p>Feito para colecionadores,<br/>criadores e cultura</p><a href="mailto:contato@email.com">contato@email.com</a><span>+55 11 4002 8922</span></div>
        <div className="footer-columns">
          <div><h3>Meu perfil</h3><Link to="/profile">Meu perfil</Link><Link to="/profile">Minha coleção</Link><Link to="/" search={homeSearch}>Atividade</Link><Link to="/profile">Estúdio do criador</Link><Link to="/" search={homeSearch}>Lista de interesse</Link></div>
          <div><h3>Central de ajuda</h3><Link to="/" search={homeSearch}>Central de ajuda</Link><Link to="/" search={homeSearch}>Como comprar NFTs</Link><Link to="/" search={homeSearch}>Carteira e segurança</Link><Link to="/" search={homeSearch}>Política de mercado</Link><Link to="/" search={homeSearch}>Denunciar item</Link></div>
          <div><h3>Coleções</h3><Link to="/" search={{ ...homeSearch, category: 'Arte digital' }}>Arte digital</Link><Link to="/" search={{ ...homeSearch, category: 'Fotografia' }}>Fotografia</Link><Link to="/" search={{ ...homeSearch, category: 'Música' }}>Música</Link><Link to="/" search={{ ...homeSearch, category: 'Arte 3D' }}>Arte 3D</Link><Link to="/" search={{ ...homeSearch, category: 'Utilidade' }}>Utilidade</Link></div>
          <div><h3>Redes sociais</h3><div className="social-links"><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://instagram.com" aria-label="Instagram">◎</a><a href="https://twitter.com" aria-label="Twitter">♥</a><a href="https://linkedin.com" aria-label="LinkedIn">in</a><a href="https://youtube.com" aria-label="YouTube">▶</a></div><h3 className="wallet-title">Carteiras compatíveis</h3><div className="wallet-tags"><span>METAMASK</span><span>WALLETCONNECT</span><span>COINBASE</span></div></div>
        </div>
        <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
      </footer>
    </main>
  )
}

function Newsletter() {
  const [message, setMessage] = useState('')
  return <div className="newsletter-box"><h3>Antecipe-se ao próximo lançamento</h3><form onSubmit={(event) => { event.preventDefault(); setMessage('Inscrição registrada nesta demonstração.') }}><label className="sr-only" htmlFor="cart-newsletter-email">Seu e-mail</label><input id="cart-newsletter-email" type="email" placeholder="digite seu e-mail..." required/><button type="submit">Enviar</button></form><p>{message || 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}</p></div>
}
