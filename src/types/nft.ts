export type NftSort = 'recent' | 'featured' | 'price-asc' | 'price-desc'
export type CatalogView = 'all' | 'new' | 'trending'

export interface Nft {
  id: string
  name: string
  collection: string
  creator: string
  priceEth: string
  oldPriceEth?: string
  edition: string
  category: string
  image: string
  likes: number
  network?: string
  listedAt?: number
  featured?: boolean
}

export interface NftQuery {
  q: string
  category: string
  sort: NftSort
  page: number
  view: CatalogView
  network: string
  minPrice: string
  maxPrice: string
}

export interface NftCatalogResponse {
  items: Nft[]
  total: number
  page: number
  pageSize: number
  facets?: {
    categories: Record<string, number>
    networks: Record<string, number>
  }
}
