import { useEffect, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  ArrowRight, ChevronDown, Heart, Search, SlidersHorizontal, House, ScanLine, ShoppingCart, UserRound,
} from 'lucide-react'
import { getNfts } from '@/api/nfts'
import { getStoredSessionEmail } from '@/api/session'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
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
  const sessionEmail = getStoredSessionEmail() ?? 'guest'
  const favoritesKey = 'kurio-favorites:' + sessionEmail
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(favoritesKey)
      return stored ? JSON.parse(stored) as string[] : []
    } catch {
      return []
    }
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
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

  function updateSearch(patch: Partial<typeof search>, replace = false) {
    void navigate({ search: (previous) => ({ ...previous, ...patch }), replace })
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      localStorage.setItem(favoritesKey, JSON.stringify(next))
      return next
    })
  }

  function clearFilters() {
    setMinPriceDraft(0.02)
    setMaxPriceDraft(12.3)
    updateSearch({ ...initialSearch })
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 9)))
  const featuredNft = { id: 'ape-009', name: 'Sage Nomad #009', image: '/nfts/ape-hoodie.jpg' }

  return (
    <main className="marketplace-shell" id="inicio">
      <SiteHeader active="home" onSearchClick={() => setSearchOpen((open) => !open)} searchContent={searchOpen ? <label className="kurio-header-search"><span className="sr-only">Buscar NFTs</span><input autoFocus aria-label="Buscar NFTs" placeholder="Buscar NFT..." value={search.q} onChange={(event) => updateSearch({ q: event.target.value, page: 1 }, true)}/><button type="button" aria-label="Fechar busca" onClick={() => { setSearchOpen(false); updateSearch({ q: '' }, true) }}>×</button></label> : null}/>

      <section className="mobile-explore" aria-label="Explorar coleções">
        <label className="mobile-explore-input"><Search size={19}/><input aria-label="Explorar coleções" placeholder="Explorar coleções" value={search.q} onChange={(event) => updateSearch({ q: event.target.value, page: 1 }, true)}/></label>
        <button type="button" className={mobileFiltersOpen ? "mobile-filter-button active" : "mobile-filter-button"} aria-label="Abrir filtros" aria-expanded={mobileFiltersOpen} onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={21}/></button>
      </section>
      {mobileFiltersOpen && <section className="mobile-filter-drawer" aria-label="Filtros rápidos"><strong>Explorar por coleção</strong><div>{["Todas", ...categories].map((category) => <button key={category} type="button" className={search.category === category ? "selected" : ""} onClick={() => { updateSearch({ category, page: 1 }); setMobileFiltersOpen(false) }}>{category}</button>)}</div></section>}
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
              <img className="hero-art-main" src="/nfts/featured-collector-wide.jpg" alt="Macaco colecionável usando óculos verdes e jaqueta verde" /><img className="hero-art-secondary" src="/nfts/ape-hoodie.jpg" alt="" aria-hidden="true" />
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
              <button type="button" role="tab" aria-selected={search.view === 'all'} className={search.view === 'all' ? 'active' : ''} onClick={() => { setShowFavoritesOnly(false); updateSearch({ view: 'all', page: 1 }) }}>Todos os NFTs</button>
              <button type="button" role="tab" aria-selected={search.view === 'new'} className={search.view === 'new' ? 'active' : ''} onClick={() => { setShowFavoritesOnly(false); updateSearch({ view: 'new', page: 1, sort: 'recent' }) }}>Novos lançamentos</button>
              <button type="button" role="tab" aria-selected={search.view === 'trending'} className={search.view === 'trending' ? 'active' : ''} onClick={() => { setShowFavoritesOnly(false); updateSearch({ view: 'trending', page: 1 }) }}>Em alta</button>
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
              {(showFavoritesOnly ? data.items.filter((nft) => favorites.includes(nft.id)) : data.items).map((nft) => (
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
            <div className="catalog-state"><strong>{showFavoritesOnly ? "Você ainda não favoritou NFTs desta página." : "Nenhum NFT encontrado."}</strong><p>{showFavoritesOnly ? "Explore o catálogo e toque no coração para salvar seus favoritos." : "Tente mudar os filtros ou a busca."}</p><button type="button" className="apply-price" onClick={clearFilters}>Limpar filtros</button></div>
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

      <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
        <Link to="/" search={initialSearch} hash="inicio" aria-label="Início" className="active"><House size={21} fill="currentColor"/></Link>
        <button type="button" aria-label="Favoritos" aria-pressed={showFavoritesOnly} className={showFavoritesOnly ? "active" : ""} onClick={() => { setShowFavoritesOnly((value) => !value); document.getElementById("mercado")?.scrollIntoView({ behavior: "smooth" }) }}><Heart size={22} fill="currentColor"/></button>
        <button type="button" className="mobile-scan-button" aria-label="Leitor de QR Code"><ScanLine size={25}/></button>
        <Link to="/cart" aria-label="Carrinho"><ShoppingCart size={21}/></Link>
        <Link to={sessionEmail !== "guest" ? "/profile" : "/login"} aria-label="Minha conta"><UserRound size={21} fill="currentColor"/></Link>
      </nav>
      <SiteFooter newsletterMessage={newsletterMessage} onNewsletterSubmit={(event) => { event.preventDefault(); setNewsletterMessage('Inscrições não estão disponíveis nesta demonstração.') }} />
    </main>
  )
}
