'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { fetchRecentTrades } from '../../lib/api'

export interface LiveFeedMessage {
  type:           'whale' | 'trade' | 'signal' | 'resolved' | 'spike'
  marketId:       string
  marketQuestion: string
  category:       string
  text:           string
  usdcValue:      number
  price:          number
  side:           string | null
  isWhale:        boolean
  timestamp:      string
}

interface UseLiveFeedOptions {
  maxItems?: number
  onMessage?: (msg: LiveFeedMessage) => void
}

export function useLiveFeed({ maxItems = 20, onMessage }: UseLiveFeedOptions = {}) {
  const [messages,  setMessages]  = useState<LiveFeedMessage[]>([])
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  // Load initial trades from REST on mount
  useEffect(() => {
    fetchRecentTrades(maxItems).then(trades => {
      const initial: LiveFeedMessage[] = trades.map(t => ({
        type:           t.isWhale ? 'whale' : 'trade',
        marketId:       t.marketId,
        marketQuestion: t.marketQuestion,
        category:       t.category,
        text:           t.isWhale
          ? `🐋 Whale bet $${t.usdcValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${t.side} on ${shorten(t.marketQuestion)}`
          : `Trade $${t.usdcValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${t.side} on ${shorten(t.marketQuestion)}`,
        usdcValue:  t.usdcValue,
        price:      t.price,
        side:       t.side,
        isWhale:    t.isWhale,
        timestamp:  t.timestamp,
      }))
      setMessages(initial)
    }).catch(() => {})
  }, [])

  // Then connect STOMP for live updates
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_SPRING_WS_URL ?? 'http://localhost:8080/ws'
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay:   5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe('/topic/trades', (frame: IMessage) => {
          try {
            const msg: LiveFeedMessage = JSON.parse(frame.body)
            setMessages(prev => [msg, ...prev].slice(0, maxItems))
            onMessage?.(msg)
          } catch (e) {
            console.error('Failed to parse feed message', e)
          }
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error('STOMP error', frame),
    })
    client.activate()
    clientRef.current = client
    return () => { client.deactivate() }
  }, [maxItems])

  return { messages, connected }
}

function shorten(q: string) {
  return q && q.length > 40 ? q.slice(0, 37) + '…' : q ?? 'unknown market'
}