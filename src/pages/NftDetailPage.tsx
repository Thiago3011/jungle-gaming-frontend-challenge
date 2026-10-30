import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight, Heart, Minus, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/api/client'
import { addToCart } from '@/api/cart'
import type { CartResponse } from '@/api/cart'
import { getNfts } from '@/api/nfts'
import { getStoredSessionEmail } from '@/api/session'
import type { Nft } from '@/types/nft'
import { SiteHeader } from '@/components/SiteHeader'
import './shop-pages.css'

const homeSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, view: 'all' as const, network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }

function formatEth(value: string) {
  return `${value.replace('.', ',')} ETH`
}

async function getNft(nftId: string): Promise<Nft> {
  const response = await api.get<Nft>(`/nfts/${nftId}`)
  return response.data
}

export default function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedEdition, setSelectedEdition] = useState('1/50')
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const [isFavorite, setIsFavorite] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kurio-favorites:' + sessionEmail) ?? '[]') as string[] }
    catch { return [] as string[] }
  })
  const { data: nft, isPending, isError } = useQuery({ queryKey: ['nft', nftId], queryFn: () => getNft(nftId) })
  const { data: collection } = useQuery({
    queryKey: ['nft-collection', nftId],
    queryFn: async () => (await getNfts({ ...homeSearch, sort: 'featured', page: 1 })).items,
  })
  const addMutation = useMutation({
    mutationFn: () => addToCart(nftId, quantity),
    onSuccess: (cart: CartResponse) => {
      queryClient.setQueryData(['cart', sessionEmail], cart)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  function toggleFavorite() {
    const next = isFavorite.includes(nftId) ? isFavorite.filter((id) => id !== nftId) : [...isFavorite, nftId]
    setIsFavorite(next)
    localStorage.setItem('kurio-favorites:' + sessionEmail, JSON.stringify(next))
  }

  if (isPending) return <main className="shop-page nft-detail-page"><SiteHeader active="market"/><div className="page-message"><span className="skeleton-line"/><span className="skeleton-block"/><span className="skeleton-line short"/></div></main>
  if (isError || !nft) return <main className="shop-page nft-detail-page"><SiteHeader active="market"/><div className="page-message"><p className="eyebrow">PEÇA NÃO ENCONTRADA</p><h1>Não encontramos esse NFT.</h1><p>Ele pode ter sido removido ou o endereço está incorreto.</p><Link className="shop-text-link" to="/" search={homeSearch}>Voltar ao catálogo</Link></div></main>

  const isSaved = isFavorite.includes(nftId)
  const related = (collection ?? []).filter((item) => item.id !== nftId).slice(0, 5)
  const images = [nft.image, nft.image, nft.image, nft.image]

  return (
    <main className="shop-page nft-detail-page">
      <SiteHeader active="market"/>
      <div className="shop-breadcrumb"><Link to="/" search={homeSearch}>Início</Link><span>/</span><Link to="/" search={homeSearch}>Mercado</Link><span>/</span><span>{nft.name}</span></div>

      <section className="nft-detail-layout">
        <div className="nft-gallery">
          <div className="nft-gallery-thumbnails" aria-label="Imagens do NFT">
            {images.map((image, index) => <button key={image + index} type="button" className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`Exibir imagem ${index + 1}`} aria-pressed={activeImage === index}><img src={image} alt=""/></button>)}
          </div>
          <div className="nft-detail-art"><img src={images[activeImage] ?? nft.image} alt={`Arte digital ${nft.name}`}/><span className="nft-detail-edition">EDIÇÃO {nft.edition}</span><span className="nft-image-zoom" aria-hidden="true">⌕</span></div>
        </div>
        <div className="nft-detail-info">
          <h1>{nft.name}</h1>
          <div className="nft-price-review-row">
            <strong className="nft-current-price">{formatEth(nft.priceEth)}</strong>
            <div className="nft-review-summary"><span className="nft-stars" aria-label="Avaliação média de demonstração"><Star/><Star/><Star/><Star/><Star/></span><span>19 avaliações de colecionadores</span></div>
          </div>
          <div className="nft-detail-divider"/>
          <div className="nft-about">
            <h2>Sobre este NFT:</h2>
            <p>Um colecionável digital finalizado à mão da coleção {nft.collection}, verificado na {nft.network ?? 'Ethereum'}, com arte desbloqueável e acesso para colecionadores.</p>
          </div>
          <div className="nft-edition-options">
            <strong>Edição:</strong>
            <div role="group" aria-label="Selecionar edição">
              {['1/1', '1/10', '1/50', 'ABERTA'].map((edition) => <button key={edition} type="button" className={selectedEdition === edition ? 'selected' : ''} aria-pressed={selectedEdition === edition} onClick={() => setSelectedEdition(edition)}>{edition}</button>)}
            </div>
          </div>
          <div className="nft-purchase-meta-row">
            <div className="nft-purchase-left">
              <div className="nft-actions-row">
                <div className="quantity-control" aria-label="Quantidade">
                  <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16}/></button>
                  <output aria-live="polite">{quantity}</output>
                  <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))}><Plus size={16}/></button>
                </div>
                <div className="nft-buy-favorite">
                  <Button className="primary-cta" disabled={addMutation.isPending} onClick={() => addMutation.mutate()}>{addMutation.isPending ? 'Adicionando...' : 'COMPRAR'}</Button>
                  <button className={`detail-favorite ${isSaved ? 'saved' : ''}`} type="button" onClick={toggleFavorite} aria-pressed={isSaved}><Heart size={21} fill={isSaved ? 'currentColor' : 'none'}/>{isSaved ? 'Favoritado' : 'Favoritar'}</button>
                </div>
              </div>
              {addMutation.isSuccess && <p className="inline-success" role="status"><Check size={15}/> NFT adicionado ao carrinho.</p>}
              {addMutation.isError && <p className="inline-error" role="alert">Não foi possível adicionar. Tente novamente.</p>}
              <div className="nft-token-details">
                <p>ID do token: <span>#{nft.name.match(/#(\d+)/)?.[1] ?? nft.id.slice(0, 8)}</span></p>
                <p>Coleção: <span>{nft.collection}</span></p>
                <p>Atributos: <span>Óculos, Esmeralda, Raro</span></p>
                <div className="nft-share-row"><strong>Compartilhar este NFT:</strong><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} aria-label="Compartilhar no LinkedIn">in</a><a href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(window.location.href)}`} aria-label="Compartilhar por e-mail">✉</a><a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(nft.name)}`} aria-label="Compartilhar no Twitter">♥</a></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nft-information">
        <div className="nft-information-tabs" role="tablist" aria-label="Informações do NFT">
          <button type="button" role="tab" aria-selected={activeTab === 'details'} className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Detalhes do NFT</button>
          <button type="button" role="tab" aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Avaliações de colecionadores (19)</button>
        </div>
        {activeTab === 'details' ? <div className="nft-information-copy"><p><strong>{nft.name}</strong> é uma obra digital da coleção {nft.collection}, criada por {nft.creator}. Cada atributo faz parte da identidade visual desta peça colecionável.</p><p>A propriedade digital é apresentada nesta demonstração do marketplace Kurio. As informações de preço e edição são dados simulados.</p><h3>Rede:</h3><p>{nft.network ?? 'Rede compatível conforme disponibilidade da coleção.'}</p><h3>Contrato:</h3><p>Informações de contrato inteligente demonstrativas.</p><h3>Direitos autorais:</h3><p>Consulte os termos da coleção e do criador antes de qualquer negociação.</p></div> : <div className="nft-reviews-panel"><div className="nft-stars"><Star/><Star/><Star/><Star/><Star/></div><h3>Avaliações da comunidade</h3><p>As avaliações detalhadas não estão disponíveis nesta demonstração.</p></div>}
      </section>

      {related.length > 0 && <section className="nft-more-collection"><div className="nft-more-heading"><h2>Mais desta coleção</h2><div className="nft-more-arrows"><button type="button" aria-label="Ver itens anteriores" onClick={(event) => { const el = event.currentTarget.closest('section')?.querySelector('.nft-more-grid'); el?.scrollBy({ left: -el.clientWidth, behavior: 'smooth' }) }}><ChevronLeft size={18}/></button><button type="button" aria-label="Ver próximos itens" onClick={(event) => { const el = event.currentTarget.closest('section')?.querySelector('.nft-more-grid'); el?.scrollBy({ left: el.clientWidth, behavior: 'smooth' }) }}><ChevronRight size={18}/></button></div></div><div className="nft-more-grid">{related.map((item) => <article className="nft-more-card" key={item.id}><Link to="/nft/$nftId" params={{ nftId: item.id }}><img src={item.image} alt={item.name}/></Link><Link className="nft-more-name" to="/nft/$nftId" params={{ nftId: item.id }}>{item.name}</Link><strong>{formatEth(item.priceEth)}</strong></article>)}</div><div className="nft-more-dots" aria-label="Navegação da coleção"><button className="active" type="button" aria-label="Início da coleção" onClick={(event) => event.currentTarget.closest("section")?.querySelector(".nft-more-grid")?.scrollTo({ left: 0, behavior: "smooth" })}/><button type="button" aria-label="Meio da coleção" onClick={(event) => { const el = event.currentTarget.closest("section")?.querySelector(".nft-more-grid"); if (el) el.scrollTo({ left: el.scrollWidth / 2, behavior: "smooth" }) }}/><button type="button" aria-label="Fim da coleção" onClick={(event) => { const el = event.currentTarget.closest("section")?.querySelector(".nft-more-grid"); if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" }) }}/></div></section>}

      <section className="trust-newsletter home-wide nft-detail-trust" aria-label="Benefícios e novidades">
        <article className="trust-item"><span className="trust-initial">W</span><h3>Segurança da carteira</h3><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></article>
        <article className="trust-item"><span className="trust-initial">C</span><h3>Criadores em destaque</h3><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></article>
        <article className="trust-item"><span className="trust-initial">D</span><h3>Alertas de lançamentos</h3><p>Receba calendários de cunhagem, novidades e listas de acesso antecipado.</p></article>
        <div className="newsletter-box"><h3>Antecipe-se ao próximo lançamento</h3><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="detail-newsletter">Seu e-mail</label><input id="detail-newsletter" type="email" placeholder="digite seu e-mail..." required/><button type="submit">Enviar</button></form><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p></div>
      </section>
      <footer className="site-footer nft-detail-footer" id="footer">
        <div className="footer-brand-row"><Link className="brand" to="/" search={homeSearch}>KURIO<span>.</span></Link><p>Feito para colecionadores,<br/>criadores e cultura</p><a href="mailto:contato@email.com">contato@email.com</a><span>+55 11 4002 8922</span></div>
        <div className="footer-columns"><div><h3>Meu perfil</h3><Link to="/profile">Meu perfil</Link><Link to="/profile">Minha coleção</Link><Link to="/profile">Atividade</Link><Link to="/profile">Estúdio do criador</Link><Link to="/profile">Lista de interesse</Link></div><div><h3>Central de ajuda</h3><Link to="/" search={homeSearch}>Central de ajuda</Link><Link to="/" search={homeSearch}>Como comprar NFTs</Link><Link to="/" search={homeSearch}>Carteira e segurança</Link><Link to="/" search={homeSearch}>Política de mercado</Link><Link to="/" search={homeSearch}>Denunciar item</Link></div><div><h3>Coleções</h3><Link to="/" search={{...homeSearch,category:'Arte digital'}}>Arte digital</Link><Link to="/" search={{...homeSearch,category:'Fotografia'}}>Fotografia</Link><Link to="/" search={{...homeSearch,category:'Música'}}>Música</Link><Link to="/" search={{...homeSearch,category:'Arte 3D'}}>Arte 3D</Link><Link to="/" search={{...homeSearch,category:'Utilidade'}}>Utilidade</Link></div><div><h3>Redes sociais</h3><div className="social-links"><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://instagram.com" aria-label="Instagram">◎</a><a href="https://twitter.com" aria-label="Twitter">♥</a><a href="https://linkedin.com" aria-label="LinkedIn">in</a><a href="https://youtube.com" aria-label="YouTube">▶</a></div><h3 className="wallet-title">Carteiras compatíveis</h3><div className="wallet-tags"><span>METAMASK</span><span>WALLETCONNECT</span><span>COINBASE</span></div></div></div>
        <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
      </footer>
    </main>
  )
}
