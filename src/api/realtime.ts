import { io, type Socket } from 'socket.io-client'

type NftUpdatedEvent = {
  eventId: string
  version: number
  nftId: string
  priceEth: string
  available: boolean
  emittedAt: string
}

type OrderUpdatedEvent = {
  eventId: string
  version: number
  orderId: string
  status: 'pending' | 'confirmed' | 'rejected'
  emittedAt: string
}

type RealtimeHandlers = {
  onNftUpdated: (event: NftUpdatedEvent) => void
  onOrderUpdated: (event: OrderUpdatedEvent) => void
}

export function connectRealtime(handlers: RealtimeHandlers) {
  const socket: Socket = io('ws://localhost:3001', {
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 500,
    timeout: 5000,
  })
  const seenEvents = new Set<string>()
  const versions = new Map<string, number>()

  const accept = (resourceId: string, eventId: string, version: number) => {
    if (!eventId || seenEvents.has(eventId) || version <= (versions.get(resourceId) ?? 0)) return false
    seenEvents.add(eventId)
    versions.set(resourceId, version)
    if (seenEvents.size > 500) seenEvents.clear()
    return true
  }

  const handleNftUpdated = (event: NftUpdatedEvent) => {
    if (accept(event.nftId, event.eventId, event.version)) handlers.onNftUpdated(event)
  }
  const handleOrderUpdated = (event: OrderUpdatedEvent) => {
    if (accept(event.orderId, event.eventId, event.version)) handlers.onOrderUpdated(event)
  }

  socket.on('nft.updated', handleNftUpdated)
  socket.on('order.updated', handleOrderUpdated)

  return () => {
    socket.off('nft.updated', handleNftUpdated)
    socket.off('order.updated', handleOrderUpdated)
    socket.disconnect()
  }
}
