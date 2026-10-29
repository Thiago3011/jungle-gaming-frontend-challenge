import { api } from '@/api/client'
import type { NftCatalogResponse, NftQuery } from '@/types/nft'

export async function getNfts(params: NftQuery): Promise<NftCatalogResponse> {
  const response = await api.get<NftCatalogResponse>('/nfts', { params })
  return response.data
}
