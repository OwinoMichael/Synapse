/**
 * Synapse API client with SWR for client-side caching.
 * Data is cached in memory — switching pages and back is instant.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api'

// ── Types ──────────────────────────────────────────────────────────

export interface ApiMarket {
  id:            string
  conditionId:   string
  question:      string
  category:      string
  tags:          string[]
  yesPrice:      number
  noPrice:       number
  volume:        number
  volume24h:     number
  liquidity:     number
  endDate:       string | null
  active:        boolean
  closed:        boolean
}

export interface ApiStats {
  totalMarkets:    number
  activeSignals:   number
  avgMismatch:     number
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  volatilitySpikes: number
}

export interface ApiSignal {
  id:             number
  marketId:       string
  marketQuestion: string
  category:       string
  marketOdds:     number
  aiEstimate:     number
  gap:            number
  confidence:     'HIGH' | 'MONITOR' | 'NORMAL'
  summary:        string
  keywords:       string[]
  createdAt:      string
}

export interface ApiTrade {
  id:             string
  marketId:       string
  marketQuestion: string
  category:       string
  side:           string
  price:          number
  usdcValue:      number
  isWhale:        boolean
  timestamp:      string
}

export interface ApiOrderBook {
  marketId: string
  bids: { price: number; size: number; total: number }[]
  asks: { price: number; size: number; total: number }[]
}

export interface ApiHeatmap {
  category: string
  volume:   number
  change:   number
  markets:  number
}

export interface ApiPriceHistory {
  marketId: string
  labels:   string[]
  prices:   number[]
}

// ── Fetch helper ───────────────────────────────────────────────────

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    // No Next.js ISR cache — SWR handles client-side caching
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`)
  return res.json()
}

// ── SWR fetcher — use this as the fetcher argument ─────────────────
export const swrFetcher = (url: string) =>
  fetch(url).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })

// ── URL builders — used as SWR keys ───────────────────────────────
export const urls = {
  stats:      () => `${BASE}/stats`,
  heatmap:    () => `${BASE}/stats/heatmap`,
  trending:   () => `${BASE}/markets/trending`,
  markets:    (category?: string, sort = 'volume', limit = 100) => {
    const q = new URLSearchParams({ sort, limit: String(limit), active: 'true' })
    if (category && category !== 'All') q.set('category', category)
    return `${BASE}/markets?${q}`
  },
  market:     (id: string) => `${BASE}/markets/${id}`,
  orderBook:  (id: string) => `${BASE}/markets/${id}/orderbook`,
  history:    (id: string, range: string) => `${BASE}/markets/${id}/history?range=${range}`,
  signals:    () => `${BASE}/signals?active=true`,
  trades:     (limit = 20) => `${BASE}/trades/recent?limit=${limit}`,
  whales:     (limit = 10) => `${BASE}/trades/whales?limit=${limit}`,
}

// ── Direct fetch functions (used server-side or without SWR) ───────
export const fetchStats           = () => get<ApiStats>(urls.stats().replace(BASE, ''))
export const fetchTrendingMarkets = () => get<ApiMarket[]>('/markets/trending')
export const fetchMarkets         = (params?: { category?: string; limit?: number; sort?: string }) => {
  const q = new URLSearchParams()
  if (params?.category && params.category !== 'All') q.set('category', params.category)
  if (params?.limit)  q.set('limit',  String(params.limit))
  if (params?.sort)   q.set('sort',   params.sort)
  q.set('active', 'true')
  return get<ApiMarket[]>(`/markets?${q}`)
}
export const fetchMarket          = (id: string)               => get<ApiMarket>(`/markets/${id}`)
export const fetchOrderBook       = (id: string)               => get<ApiOrderBook>(`/markets/${id}/orderbook`)
export const fetchPriceHistory    = (id: string, range: string)=> get<ApiPriceHistory>(`/markets/${id}/history?range=${range}`)
export const fetchSignals         = ()                         => get<ApiSignal[]>('/signals?active=true')
export const fetchRecentTrades    = (limit = 20)               => get<ApiTrade[]>(`/trades/recent?limit=${limit}`)
export const fetchHeatmap         = ()                         => get<ApiHeatmap[]>('/stats/heatmap')