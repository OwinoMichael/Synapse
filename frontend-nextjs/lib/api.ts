/**
 * Synapse API client
 * Centralises all calls to the Spring backend REST API.
 * Base URL comes from env so it works in both local and prod.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api'

// ── Types ──────────────────────────────────────────────────────────

export interface ApiMarket {
  id:            string
  conditionId:   string
  question:      string
  category:      string
  tags:          string[]
  yesPrice:      number        // 0.00 – 1.00
  noPrice:       number
  volume:        number
  volume24h:     number
  liquidity:     number
  endDate:       string | null
  active:        boolean
  closed:        boolean
}

export interface ApiMarketDetail extends ApiMarket {
  description:   string
  eventTitle:    string
  clobTokenIds:  string[]      // [yesToken, noToken]
}

export interface ApiStats {
  totalMarkets:   number
  activeSignals:  number
  avgMismatch:    number
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  volatilitySpikes: number
}

export interface ApiSignal {
  id:            number
  marketId:      string
  marketQuestion:string
  category:      string
  marketOdds:    number
  aiEstimate:    number
  gap:           number
  confidence:    'HIGH' | 'MONITOR' | 'NORMAL'
  summary:       string
  keywords:      string[]
  createdAt:     string
}

export interface ApiTrade {
  id:            string
  marketId:      string
  marketQuestion:string
  category:      string
  side:          string
  price:         number
  usdcValue:     number
  isWhale:       boolean
  timestamp:     string
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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 30 },   // ISR — revalidate every 30s
  })
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`)
  return res.json()
}

// ── API calls ──────────────────────────────────────────────────────

/** Dashboard stats bar */
export const fetchStats = () =>
  get<ApiStats>('/stats')

/** Trending markets for carousel (top 8 by volume) */
export const fetchTrendingMarkets = () =>
  get<ApiMarket[]>('/markets?sort=volume&limit=8&active=true')

/** All markets with optional filters */
export const fetchMarkets = (params?: {
  category?: string
  active?: boolean
  limit?: number
  sort?: string
}) => {
  const q = new URLSearchParams()
  if (params?.category && params.category !== 'All') q.set('category', params.category)
  if (params?.active !== undefined) q.set('active', String(params.active))
  if (params?.limit)  q.set('limit',  String(params.limit))
  if (params?.sort)   q.set('sort',   params.sort)
  return get<ApiMarket[]>(`/markets${q.size ? '?' + q : ''}`)
}

/** Single market detail */
export const fetchMarket = (conditionId: string) =>
  get<ApiMarketDetail>(`/markets/${conditionId}`)

/** Order book for a specific market */
export const fetchOrderBook = (conditionId: string) =>
  get<ApiOrderBook>(`/markets/${conditionId}/orderbook`)

/** Price history for chart (1H, 6H, 1D, 1W) */
export const fetchPriceHistory = (conditionId: string, range: '1H'|'6H'|'1D'|'1W') =>
  get<ApiPriceHistory>(`/markets/${conditionId}/history?range=${range}`)

/** Active AI signals */
export const fetchSignals = () =>
  get<ApiSignal[]>('/signals?active=true')

/** Recent trades — activity feed */
export const fetchRecentTrades = (limit = 20) =>
  get<ApiTrade[]>(`/trades/recent?limit=${limit}`)

/** Whale trades only */
export const fetchWhaleTrades = (limit = 10) =>
  get<ApiTrade[]>(`/trades/whales?limit=${limit}`)

/** Heatmap data by category */
export const fetchHeatmap = () =>
  get<ApiHeatmap[]>('/stats/heatmap')
