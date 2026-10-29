import type { Nft } from '@/types/nft'

const featuredItems: Nft[] = [
  { id: 'ape-042', name: 'Emerald Ape #042', collection: 'Clube dos Macacos', creator: '@kurio.studio', priceEth: '1.19', edition: '042/250', category: 'Arte digital', image: '/nfts/featured-collector.jpg', likes: 128, network: 'Ethereum', listedAt: 36, featured: true },
  { id: 'ape-009', name: 'Sage Nomad #009', collection: 'Golden Apes', creator: '@golden.lab', priceEth: '1.69', edition: '009/100', category: 'Colecionáveis', image: '/nfts/ape-hoodie.jpg', likes: 173, network: 'Ethereum', listedAt: 35 },
  { id: 'ape-552', name: 'Neon Vessel #552', collection: 'Urban Primates', creator: '@nina.3d', priceEth: '1.99', oldPriceEth: '2.29', edition: '552/800', category: 'Arte 3D', image: '/nfts/ape-shadow.jpg', likes: 239, network: 'Polygon', listedAt: 34 },
  { id: 'ape-118', name: 'Cosmic Bloom #118', collection: 'Urban Primates', creator: '@nina.3d', priceEth: '1.29', edition: '118/180', category: 'Generativa', image: '/nfts/ape-explorer.jpg', likes: 64, network: 'Solana', listedAt: 33 },
  { id: 'ape-314', name: 'Violet Nomad #314', collection: 'Urban Primates', creator: '@nina.3d', priceEth: '1.39', edition: '314/400', category: 'Fotografia', image: '/nfts/ape-hoodie.jpg', likes: 102, network: 'Ethereum', listedAt: 32 },
  { id: 'ape-088', name: 'Ivory Baron #088', collection: 'Clube dos Macacos', creator: '@kurio.studio', priceEth: '1.79', edition: '088/250', category: 'Arte digital', image: '/nfts/ape-shadow.jpg', likes: 306, network: 'Polygon', listedAt: 31 },
  { id: 'ape-207', name: 'Golden Beat #207', collection: 'Golden Apes', creator: '@golden.lab', priceEth: '0.99', edition: '207/320', category: 'Música', image: '/nfts/ape-gold.jpg', likes: 145, network: 'Solana', listedAt: 30 },
  { id: 'ape-160', name: 'Golden Signal #160', collection: 'Golden Apes', creator: '@golden.lab', priceEth: '0.39', edition: '160/320', category: 'Colecionáveis', image: '/nfts/ape-gold.jpg', likes: 52, network: 'Ethereum', listedAt: 29 },
  { id: 'ape-071', name: 'Golden Hour #071', collection: 'Golden Apes', creator: '@golden.lab', priceEth: '0.59', edition: '071/320', category: 'Jogos', image: '/nfts/ape-gold.jpg', likes: 91, network: 'Polygon', listedAt: 28 },
]

const categories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis', 'Generativa', 'Jogos', 'Assinaturas', 'Utilidade']
const networks = ['Ethereum', 'Polygon', 'Solana']
const seeds = [
  { name: 'Velvet Legend', collection: 'Urban Primates', image: '/nfts/ape-hoodie.jpg' },
  { name: 'Golden Circuit', collection: 'Golden Apes', image: '/nfts/ape-gold.jpg' },
  { name: 'Quiet Dynasty', collection: 'Clube dos Macacos', image: '/nfts/ape-shadow.jpg' },
  { name: 'Jungle Icon', collection: 'Clube dos Macacos', image: '/nfts/featured-collector.jpg' },
  { name: 'Soft Signal', collection: 'Urban Primates', image: '/nfts/ape-explorer.jpg' },
  { name: 'Sundown Club', collection: 'Golden Apes', image: '/nfts/ape-gold.jpg' },
]
const prices = ['0.29', '0.49', '0.79', '0.89', '1.09', '1.49', '1.89', '2.09', '0.69']

// Fixtures extras are deterministic so filters and pagination can be tested reproducibly.
const additionalItems: Nft[] = Array.from({ length: 27 }, (_, index) => {
  const seed = seeds[index % seeds.length]
  const serial = 221 + index
  return {
    id: `kurio-${serial}`,
    name: `${seed.name} #${String(serial).padStart(3, '0')}`,
    collection: seed.collection,
    creator: ['@kurio.studio', '@golden.lab', '@nina.3d', '@arte.rara'][index % 4],
    priceEth: prices[index % prices.length],
    edition: `${String(serial).padStart(3, '0')}/${index % 2 === 0 ? '320' : '500'}`,
    category: categories[(index + 3) % categories.length],
    image: seed.image,
    likes: 45 + ((index * 29) % 260),
    network: networks[index % networks.length],
    listedAt: 27 - index,
    featured: index % 8 === 0,
  }
})

export const nfts: Nft[] = [...featuredItems, ...additionalItems]
