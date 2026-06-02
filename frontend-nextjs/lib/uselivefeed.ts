'use client'

import { useEffect, useRef, useState } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export interface LiveFeedMessage {
  type:          'whale' | 'trade' | 'signal' | 'resolved' | 'spike'
  marketId:      string
  marketQuestion:string
  category:      string
  text:          string
  usdcValue:     number
  price:         number
  side:          string | null
  isWhale:       boolean
  timestamp:     string
}

interface UseLiveFeedOptions {
  maxItems?: number
  onMessage?: (msg: LiveFeedMessage) => void
}

/**
 * Subscribes to the Spring STOMP /topic/trades endpoint and
 * maintains a rolling buffer of live feed messages.
 *
 * Usage:
 *   const { messages, connected } = useLiveFeed({ maxItems: 20 })
 */
export function useLiveFeed({ maxItems = 20, onMessage }: UseLiveFeedOptions = {}) {
  const [messages,  setMessages]  = useState<LiveFeedMessage[]>([])
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const client = new Client({
      // SockJS factory — Spring serves /ws with SockJS fallback
      webSocketFactory: () =>
        new SockJS(process.env.NEXT_PUBLIC_SPRING_WS_URL ?? 'http://localhost:8080/ws'),

      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true)

        // Subscribe to live trade / whale activity feed
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

    return () => {
      client.deactivate()
    }
  }, [maxItems])

  return { messages, connected }
}