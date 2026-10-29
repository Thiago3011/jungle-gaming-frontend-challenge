import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Check, Heart, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/api/client'
import { addToCart } from '@/api/cart'
import type { Nft } from '@/types/nft'
import './shop-pages.css'

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
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kurio-favorites') ?? '[]') as string[]
    } catch {
      return [] as string[]
    }
  })
  const { data: nft, isPending, isError } = useQuery({
    queryKey: ['nft', nftId],
    queryFn: () => getNft(nftId),
  })
  const addMutation = useMutation({
    mutationFn: () => addToCart(nftId, quantity),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  function toggleFavorite() {
    const next = isFavorite.includes(nftId)
      ? isFavorite.filter((id) => id !== nftId)
      : [...isFavorite, nftId]
    setIsFavorite(next)
    localStorage.setItem('kurio-favorites', JSON.stringify(next))
  }

  if (isPending) return <main className="shop-page"><div className="page-message"><span className="skeleton-line" /><span className="skeleton-block" /><span className="skeleton-line short" /></div></main>
  if (isError || !nft) return <main className="shop-page"><div className="page-message"><p className="eyebrow">PEÇA NÃO ENCONTRADA</p><h1>Não encontramos esse NFT.</h1><p>Ele pode ter sido removido ou o endereço está incorreto.</p><Link className="shop-text-link" to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }}>Voltar ao catálogo</Link></div></main>

  const isSaved = isFavorite.includes(nftId)

  return (
    <main className="shop-page">
      <header className="shop-page-header">
        <Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }} className="brand">KURIO</Link>
        <nav aria-label="Navegação da loja"><Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }}>Explorar</Link><Link to="/cart" className="shop-header-cart"><ShoppingBag size={17} /> Carrinho</Link></nav>
      </header>
      <div className="shop-breadcrumb"><Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }}>Catálogo</Link><span>/</span><span>{nft.name}</span></div>
      <section className="nft-detail-layout">
        <div className="nft-detail-art"><img src={nft.image} alt={`Arte digital ${nft.name}`} /><span className="nft-detail-edition">EDIÇÃO {nft.edition}</span></div>
        <div className="nft-detail-info">
          <p className="eyebrow">{nft.collection.toUpperCase()}</p>
          <h1>{nft.name}</h1>
          <p className="nft-detail-creator">Criado por <strong>{nft.creator}</strong></p>
          <p className="nft-detail-description">Uma peça digital da coleção {nft.collection}, parte de uma edição limitada selecionada pela curadoria Kurio.</p>
          <div className="nft-detail-facts"><div><span>Coleção</span><strong>{nft.collection}</strong></div><div><span>Edição</span><strong>{nft.edition}</strong></div><div><span>Favoritos</span><strong>{nft.likes}</strong></div></div>
          <div className="detail-purchase-box"><span className="detail-label">PREÇO ATUAL</span><strong className="detail-price">{formatEth(nft.priceEth)}</strong><span className="detail-hint">Valor ilustrativo para demonstração</span>
            <div className="detail-purchase-row"><div className="quantity-control" aria-label="Quantidade"><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Aumentar quantidade" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))}><Plus size={14} /></button></div>
              <Button className="primary-cta" disabled={addMutation.isPending} onClick={() => addMutation.mutate()}><ShoppingBag size={16} /> {addMutation.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}</Button>
            </div>
            {addMutation.isSuccess && <p className="inline-success" role="status"><Check size={15} /> NFT adicionado ao carrinho.</p>}
            {addMutation.isError && <p className="inline-error" role="alert">Não foi possível adicionar. Tente novamente.</p>}
            <button className={`detail-favorite ${isSaved ? 'saved' : ''}`} type="button" onClick={toggleFavorite} aria-pressed={isSaved}><Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</button>
          </div>
          <Link to="/cart" className="shop-text-link">Ir para o carrinho <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <footer className="shop-footer"><Link to="/" search={{ q: '', category: 'Todas', sort: 'recent', page: 1, view: 'all', network: 'Todas', minPrice: '0.02', maxPrice: '12.30' }} className="brand">KURIO</Link><span>Marketplace demonstrativo · Nenhuma transação real será realizada.</span></footer>
    </main>
  )
}
