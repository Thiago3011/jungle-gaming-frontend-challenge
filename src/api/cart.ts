import { api } from '@/api/client'
import type { Nft } from '@/types/nft'

export interface CartItem {
  nftId: string
  quantity: number
  nft: Nft
  lineTotalEth: string
}

export interface CartResponse {
  items: CartItem[]
  subtotalEth: string
  networkFeeEth: string
  totalEth: string
}

export async function getCart(): Promise<CartResponse> {
  const response = await api.get<CartResponse>('/cart')
  return response.data
}

export async function addToCart(nftId: string, quantity = 1): Promise<CartResponse> {
  const response = await api.post<CartResponse>('/cart', { nftId, quantity })
  return response.data
}

export async function updateCartQuantity(nftId: string, quantity: number): Promise<CartResponse> {
  const response = await api.patch<CartResponse>(`/cart/${nftId}`, { quantity })
  return response.data
}

export async function removeFromCart(nftId: string): Promise<CartResponse> {
  const response = await api.delete<CartResponse>(`/cart/${nftId}`)
  return response.data
}
