import { useEffect, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  ArrowRight, ChevronDown, Heart, Menu, Search, ShoppingBag, X, Wallet,
} from 'lucide-react'
import { getNfts } from '@/api/nfts'
import { getCart } from '@/api/cart'
import { getStoredSessionEmail } from '@/api/session'
import type { CatalogView, NftSort } from '@/types/nft'
import './App.css'

const categories = [
  'Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis',
  'Generativa', 'Jogos', 'Assinaturas', 'Utilidade',
]
const networks = ['Ethereum', 'Polygon', 'Solana']
const initialSearch = {
  q: '', category: 'Todas', sort: 'recent' as NftSort, page: 1,
  view: 'all' as CatalogView, network: 'Todas', minPrice: '0.02', maxPrice: '12.30',
}

function formatEth(value: string) {
  return `${value.replace('.', ',')} ETH`
}

export default function App() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('kurio-favorites')
      return stored ? JSON.parse(stored) as string[] : []
    } catch {
      return []
    }
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [minPriceDraft, setMinPriceDraft] = useState(Number(search.minPrice))
  const [maxPriceDraft, setMaxPriceDraft] = useState(Number(search.maxPrice))
  const [newsletterMessage, setNewsletterMessage] = useState('')

  useEffect(() => {
    setMinPriceDraft(Number(search.minPrice))
    setMaxPriceDraft(Number(search.maxPrice))
  }, [search.minPrice, search.maxPrice])

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['nfts', search.q, search.category, search.sort, search.page, search.view, search.network, search.minPrice, search.maxPrice],
    queryFn: () => getNfts(search),
    placeholderData: (previousData) => previousData,
  })
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const { data: cart } = useQuery({ queryKey: ['cart', sessionEmail], queryFn: getCart })

  function updateSearch(patch: Partial<typeof search>, replace = false) {
    void navigate({ search: (previous) => ({ ...previous, ...patch }), replace })
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      localStorage.setItem('kurio-favorites', JSON.stringify(next))
      return next
    })
  }

  function clearFilters() {
    setMinPriceDraft(0.02)
    setMaxPriceDraft(12.3)
    updateSearch({ ...initialSearch })
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 9)))
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const featuredNft = { id: 'ape-009', name: 'Sage Nomad #009', image: '/nfts/ape-hoodie.jpg' }

  return (
    <main className="marketplace-shell" id="inicio">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" href="#inicio" aria-label="Kurio, início">KURIO<span>.</span></a>
          <nav className={`desktop-nav ${mobileMenuOpen ? 'desktop-nav-open' : ''}`} aria-label="Navegação principal">
            <a className="active" href="#inicio">Início</a>
            <a href="#mercado">Mercado</a>
            <a href="#criadores">Criadores</a>
            <a href="#aprenda">Aprenda</a>
          </nav>
          <div className="header-actions">
            {searchOpen && (
              <label className="header-search">
                <span className="sr-only">Buscar NFTs</span>
                <input autoFocus aria-label="Buscar NFTs" placeholder="Buscar NFT..." value={search.q} onChange={(event) => updateSearch({ q: event.target.value, page: 1 }, true)} />
                <button type="button" aria-label="Fechar busca" onClick={() => { setSearchOpen(false); updateSearch({ q: '' }, true) }}><X size={13} /></button>
              </label>
            )}
            <button className="header-icon" type="button" aria-label="Abrir busca" onClick={() => setSearchOpen((open) => !open)}><Search size={17} /></button>
            <Link className="header-icon cart-shortcut" to="/cart" aria-label={`Carrinho com ${cartCount} itens`}><ShoppingBag size={17} /><span className="cart-count">{cartCount}</span></Link>
            <Link className="account-button" to="/login"><Wallet size={13} /> Entrar</Link>
            <button className="mobile-menu-button" type="button" aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-kicker">Bem-vindo à Kurio</p>
            <h1 id="hero-title">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</h1>
            <p className="hero-description">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</p>
            <a className="explore-button" href="#mercado">EXPLORAR</a>
            <div className="hero-dots" aria-label="Slide 1 de 3"><span className="active" /><span /><span /></div>
          </div>
          <div className="hero-art-wrap">
            <Link to="/nft/$nftId" params={{ nftId: 'ape-042' }} className="hero-art-link" aria-label="Ver Emerald Ape número 042">
              <img src="/nfts/featured-collector-wide.jpg" alt="Macaco colecionável usando óculos verdes e jaqueta verde" />
            </Link>
          </div>
        </div>
      </section>

      <section className="marketplace-layout" id="mercado" aria-label="Catálogo de NFTs">
        <aside className="marketplace-sidebar" aria-label="Filtros de catálogo">
          <div className="sidebar-panel">
            <h2>Coleções</h2>
            <div className="sidebar-categories">
              {categories.map((category) => (
                <button key={category} className={`sidebar-option ${search.category === category ? 'selected' : ''}`} type="button" onClick={() => updateSearch({ category: search.category === category ? 'Todas' : category, page: 1 })}>
                  <span>{category}</span><span className="option-count">({data?.facets?.categories[category] ?? 0})</span>
                </button>
              ))}
            </div>
            <section className="sidebar-filter-section" aria-labelledby="price-filter-title">
              <h3 id="price-filter-title">Faixa de preço</h3>
              <div className="dual-range" style={{ '--low': `${((minPriceDraft - 0.02) / (12.3 - 0.02)) * 100}%`, '--high': `${((maxPriceDraft - 0.02) / (12.3 - 0.02)) * 100}%` } as CSSProperties & { '--low': string; '--high': string }}>
                <span className="range-track" />
                <span className="range-highlight" />
                <input aria-label="Preço mínimo em ETH" type="range" min="0.02" max="12.3" step="0.01" value={minPriceDraft} onChange={(event) => setMinPriceDraft(Math.min(Number(event.target.value), maxPriceDraft - 0.01))} />
                <input aria-label="Preço máximo em ETH" type="range" min="0.02" max="12.3" step="0.01" value={maxPriceDraft} onChange={(event) => setMaxPriceDraft(Math.max(Number(event.target.value), minPriceDraft + 0.01))} />
              </div>
              <p className="price-current">Preço: {minPriceDraft.toFixed(2).replace('.', ',')} – {maxPriceDraft.toFixed(2).replace('.', ',')} ETH</p>
              <button type="button" className="apply-price" onClick={() => updateSearch({ minPrice: minPriceDraft.toFixed(2), maxPrice: maxPriceDraft.toFixed(2), page: 1 })}>Aplicar</button>
            </section>
            <section className="sidebar-filter-section network-filter" aria-labelledby="network-filter-title">
              <h3 id="network-filter-title">Rede</h3>
              {networks.map((network) => (
                <button key={network} type="button" className={`sidebar-option ${search.network === network ? 'selected' : ''}`} onClick={() => updateSearch({ network: search.network === network ? 'Todas' : network, page: 1 })}>
                  <span>{network}</span><span className="option-count">({data?.facets?.networks[network] ?? 0})</span>
                </button>
              ))}
            </section>
          </div>

          <Link to="/nft/$nftId" params={{ nftId: featuredNft.id }} className="featured-sidebar-card">
            <h2>NFT EM DESTAQUE</h2><p>OFERTA LIMITADA</p>
            <img src={featuredNft.image} alt="Sage Nomad, macaco com capuz roxo" loading="lazy" />
          </Link>
        </aside>

        <div className="catalog-main">
          <div className="catalog-toolbar">
            <div className="catalog-tabs" role="tablist" aria-label="Exibição do catálogo">
              <button type="button" role="tab" aria-selected={search.view === 'all'} className={search.view === 'all' ? 'active' : ''} onClick={() => updateSearch({ view: 'all', page: 1 })}>Todos os NFTs</button>
              <button type="button" role="tab" aria-selected={search.view === 'new'} className={search.view === 'new' ? 'active' : ''} onClick={() => updateSearch({ view: 'new', page: 1, sort: 'recent' })}>Novos lançamentos</button>
              <button type="button" role="tab" aria-selected={search.view === 'trending'} className={search.view === 'trending' ? 'active' : ''} onClick={() => updateSearch({ view: 'trending', page: 1 })}>Em alta</button>
            </div>
            <label className="sort-control"><span>Ordenar por:</span><select aria-label="Ordenar NFTs" value={search.sort} onChange={(event) => updateSearch({ sort: event.target.value as NftSort, page: 1 })}><option value="recent">Listados recentemente</option><option value="featured">Em destaque</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select><ChevronDown size={12} /></label>
          </div>
          <p className="catalog-feedback" aria-live="polite">{isFetching ? 'Atualizando catálogo…' : `${data?.total ?? 0} NFTs encontrados`}</p>

          {isPending ? (
            <div className="nft-grid" aria-label="Carregando catálogo">{Array.from({ length: 9 }, (_, index) => <div className="nft-skeleton" key={index}><div className="skeleton-art shimmer" /><div className="skeleton-line shimmer" /><div className="skeleton-line short shimmer" /></div>)}</div>
          ) : isError ? (
            <div className="catalog-state"><strong>Não foi possível carregar o catálogo.</strong><p>Confira sua conexão e tente novamente.</p><button className="apply-price" type="button" onClick={() => void refetch()}>Tentar novamente</button></div>
          ) : data?.items.length ? (
            <div className="nft-grid">
              {data.items.map((nft) => (
                <article className="nft-card" key={nft.id}>
                  <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-image-link" aria-label={`Ver detalhes de ${nft.name}`}>
                    <img src={nft.image} alt={`Arte digital ${nft.name}`} loading="lazy" />
                  </Link>
                  <button type="button" className={`favorite-button ${favorites.includes(nft.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(nft.id)} aria-label={favorites.includes(nft.id) ? `Remover ${nft.name} dos favoritos` : `Adicionar ${nft.name} aos favoritos`} aria-pressed={favorites.includes(nft.id)}><Heart size={13} fill={favorites.includes(nft.id) ? 'currentColor' : 'none'} /></button>
                  <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-card-info">
                    <span className="nft-card-name">{nft.name}</span>
                    <span className="nft-card-price">{formatEth(nft.priceEth)} {nft.oldPriceEth && <del>{formatEth(nft.oldPriceEth)}</del>}</span>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalog-state"><strong>Nenhum NFT encontrado.</strong><p>Tente mudar os filtros ou a busca.</p><button type="button" className="apply-price" onClick={clearFilters}>Limpar filtros</button></div>
          )}

          {data && data.total > data.pageSize && (
            <nav className="pagination" aria-label="Paginação do catálogo">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button key={page} type="button" className={search.page === page ? 'active' : ''} aria-current={search.page === page ? 'page' : undefined} onClick={() => updateSearch({ page })}>{page}</button>)}
              <button type="button" aria-label="Próxima página" disabled={search.page >= totalPages} onClick={() => updateSearch({ page: Math.min(totalPages, search.page + 1) })}><ChevronDown className="next-page-icon" size={13} /></button>
            </nav>
          )}
        </div>
      </section>

      <section className="promo-grid home-wide" id="criadores" aria-label="Destaques Kurio">
        <article className="promo-card">
          <img src="/nfts/featured-collector.jpg" alt="Arte de macaco usando jaqueta verde" loading="lazy" />
          <div><h2>Lançamentos gênesis<br />de edição limitada</h2><p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p><a href="#mercado">Explorar <ArrowRight size={13} /></a></div>
        </article>
        <article className="promo-card promo-card-reverse">
          <img src="/nfts/ape-shadow.jpg" alt="Arte de macaco com blazer claro" loading="lazy" />
          <div><h2>Arte digital selecionada<br />e muito mais</h2><p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p><a href="#mercado">Explorar <ArrowRight size={13} /></a></div>
        </article>
      </section>

      <section className="journal-section home-wide" id="aprenda">
        <div className="journal-heading"><h2>Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p></div>
        <div className="journal-grid">
          <article className="journal-card"><img src="/nfts/ape-shadow-wide.jpg" alt="Colecionável de arte digital" loading="lazy" /><div><p className="journal-meta">12 de setembro&nbsp; | &nbsp;Leitura de 6 min</p><h3>Como funciona a propriedade de NFTs</h3><p>Aprenda a colecionar, negociar e verificar ativos digitais.</p><a href="#footer">Ler mais →</a></div></article>
          <article className="journal-card"><img src="/nfts/featured-collector-wide.jpg" alt="Macaco de jaqueta verde" loading="lazy" /><div><p className="journal-meta">13 de setembro&nbsp; | &nbsp;Leitura de 2 min</p><h3>10 artistas digitais para acompanhar</h3><p>Conheça criadores que moldam a cultura digital.</p><a href="#footer">Ler mais →</a></div></article>
          <article className="journal-card"><img src="/nfts/ape-hoodie-wide.jpg" alt="Macaco com capuz roxo" loading="lazy" /><div><p className="journal-meta">15 de setembro&nbsp; | &nbsp;Leitura de 3 min</p><h3>Raridade, atributos e procedência</h3><p>Entenda raridade, procedência, direitos autorais e utilidade.</p><a href="#footer">Ler mais →</a></div></article>
          <article className="journal-card"><img src="/nfts/ape-gold-wide.jpg" alt="Macaco dourado com fones" loading="lazy" /><div><p className="journal-meta">15 de setembro&nbsp; | &nbsp;Leitura de 2 min</p><h3>Como proteger sua carteira</h3><p>Proteja sua carteira, seus ativos e sua identidade.</p><a href="#footer">Ler mais →</a></div></article>
        </div>
      </section>

      <section className="trust-newsletter home-wide" aria-label="Benefícios e novidades">
        <article className="trust-item"><span className="trust-initial">W</span><h3>Segurança da carteira</h3><p>Proteja sua carteira e colecione arte digital verificada com confiança.</p></article>
        <article className="trust-item"><span className="trust-initial">C</span><h3>Criadores em destaque</h3><p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p></article>
        <article className="trust-item"><span className="trust-initial">D</span><h3>Alertas de lançamentos</h3><p>Receba calendários de cunhagem, novidades e listas de acesso antecipado.</p></article>
        <div className="newsletter-box"><h3>Antecipe-se ao próximo lançamento</h3><form onSubmit={(event) => { event.preventDefault(); setNewsletterMessage('Inscrições não estão disponíveis nesta demonstração.') }}><label className="sr-only" htmlFor="newsletter-email">Seu e-mail</label><input id="newsletter-email" type="email" placeholder="digite seu e-mail..." required /><button type="submit">Enviar</button></form><p>{newsletterMessage || 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}</p></div>
      </section>

      <footer className="site-footer" id="footer">
        <div className="footer-brand-row"><a className="brand" href="#inicio">KURIO<span>.</span></a><p>Feito para colecionadores,<br />criadores e cultura</p><a href="mailto:contato@email.com">contato@email.com</a><span>+55 11 4002 8922</span></div>
        <div className="footer-columns">
          <div><h3>Meu perfil</h3><a href="#inicio">Meu perfil</a><a href="#inicio">Minha coleção</a><a href="#inicio">Atividade</a><a href="#criadores">Estúdio do criador</a><a href="#mercado">Lista de interesse</a></div>
          <div><h3>Central de ajuda</h3><a href="#aprenda">Central de ajuda</a><a href="#aprenda">Como comprar NFTs</a><a href="#aprenda">Carteira e segurança</a><a href="#aprenda">Política de mercado</a><a href="#aprenda">Denunciar item</a></div>
          <div><h3>Coleções</h3><a href="#mercado">Arte digital</a><a href="#mercado">Fotografia</a><a href="#mercado">Música</a><a href="#mercado">Arte 3D</a><a href="#mercado">Utilidade</a></div>
          <div><h3>Redes sociais</h3><div className="social-links"><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://instagram.com" aria-label="Instagram">◎</a><a href="https://twitter.com" aria-label="Twitter">♥</a><a href="https://linkedin.com" aria-label="LinkedIn">in</a><a href="https://youtube.com" aria-label="YouTube">▶</a></div><h3 className="wallet-title">Carteiras compatíveis</h3><div className="wallet-tags"><span>METAMASK</span><span>WALLETCONNECT</span><span>COINBASE</span></div></div>
        </div>
        <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
      </footer>
    </main>
  )
}
