'use client'

import { useEffect, useRef, useState } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export interface MarketTickMessage {
  marketId:  string
  assetId:   string
  yesPrice:  number
  size:      number
  side:      string
  eventType: string
  timestamp: string
}

export function useMarketTick(marketId: string | null) {
  const [tick,      setTick]      = useState<MarketTickMessage | null>(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!marketId) return
    const wsUrl = process.env.NEXT_PUBLIC_SPRING_WS_URL ?? 'http://localhost:8080/ws'

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay:   5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/market-ticks/${marketId}`, (frame: IMessage) => {
          try { setTick(JSON.parse(frame.body)) }
          catch (e) { console.error('Failed to parse tick', e) }
        })
      },
      onDisconnect: () => setConnected(false),
    })
    client.activate()
    clientRef.current = client
    return () => { client.deactivate() }
  }, [marketId])

  return { tick, connected }
}