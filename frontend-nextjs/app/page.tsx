'use client'

import { useState, useEffect, useRef } from 'react'
import { Navbar } from './components/dashboard/Navbar'
import { Ticker } from './components/ui/Ticker'
import { StatCard } from './components/ui/StatCard'
import { InsightFeed } from './components/dashboard/InsightFeed'
import type { Insight } from './components/dashboard/InsightFeed'

/* ── mock data ──────────────────────────────────────────────────── */
const tickerItems = [
  { id: '1', text: 'Fed cut odds spiked 18% — no supporting news found' },
  { id: '2', text: 'BTC $100k — mismatch detected: low social volume' },
  { id: '3', text: 'Fed rate cut June — market 78% YES, news implies 43%' },
]

const insights: Insight[] = [
  { id: '1', time: '2 min ago',  signal: 'high',    text: 'Fed cut odds spiked 18% — no supporting news found' },
  { id: '2', time: '11 min ago', signal: 'monitor', text: 'BTC $100k market cooling despite bullish headlines' },
  { id: '3', time: '34 min ago', signal: 'normal',  text: 'Election market stable — sentiment aligns with pricing' },
]

const CAROUSEL_MARKETS = [
  { id:'c1', q:'Will the Fed cut rates in June 2026?',        cat:'Politics',  yes:78, change:+5.2, vol:'$2.4M', spark:[54,56,58,62,67,65,71,74,70,76,78] },
  { id:'c2', q:'Will BTC reach $100k before July 2026?',      cat:'Crypto',    yes:61, change:-2.1, vol:'$5.1M', spark:[65,63,61,60,62,61,59,58,61,62,61] },
  { id:'c3', q:'Will GPT-5 drop before August 2026?',         cat:'AI / Tech', yes:44, change:+1.8, vol:'$890K', spark:[40,41,43,42,44,45,44,43,44,44,44] },
  { id:'c4', q:'Will OpenAI go public before 2027?',          cat:'AI / Tech', yes:69, change:+12,  vol:'$1.8M', spark:[55,57,60,61,64,66,67,68,69,69,69] },
  { id:'c5', q:'Will ETH flip BTC by market cap in 2026?',    cat:'Crypto',    yes:18, change:-4.3, vol:'$1.2M', spark:[24,22,21,20,19,18,19,18,17,18,18] },
  { id:'c6', q:'Will Trump approve crypto legislation?',      cat:'Politics',  yes:52, change:+0.5, vol:'$3.7M', spark:[50,51,52,51,52,53,52,52,51,52,52] },
  { id:'c7', q:'Will Apple release AR glasses in 2026?',      cat:'AI / Tech', yes:34, change:-1.2, vol:'$670K', spark:[36,35,35,34,34,35,34,33,34,34,34] },
  { id:'c8', q:'Will S&P 500 hit 7000 by year end?',         cat:'Politics',  yes:57, change:+3.1, vol:'$4.3M', spark:[52,53,55,54,56,57,56,57,57,57,57] },
]

const LIVE_FEED = [
  { id:'f1', type:'whale',    text:'Whale bet $48K YES on Fed rate cut',         time:'12s ago',  cat:'Politics',  color:'#F1FF58' },
  { id:'f2', type:'spike',    text:'OpenAI IPO odds up +12% in 2 hours',         time:'1m ago',   cat:'AI / Tech', color:'#FF3A6E' },
  { id:'f3', type:'resolved', text:'Will it rain in London? — Resolved YES',     time:'3m ago',   cat:'Weather',   color:'#C084FC' },
  { id:'f4', type:'whale',    text:'Whale bet $22K NO on ETH flipping BTC',      time:'5m ago',   cat:'Crypto',    color:'#F1FF58' },
  { id:'f5', type:'spike',    text:'BTC $100k odds fell -4.3% in 30 mins',       time:'8m ago',   cat:'Crypto',    color:'#FF3A6E' },
  { id:'f6', type:'new',      text:'New market: Will Solana hit $500 in 2026?',  time:'12m ago',  cat:'Crypto',    color:'#F5A623' },
  { id:'f7', type:'resolved', text:'Will GPT-4o get a major update? — YES',      time:'18m ago',  cat:'AI / Tech', color:'#C084FC' },
  { id:'f8', type:'whale',    text:'Whale bet $91K YES on S&P 7000',             time:'22m ago',  cat:'Politics',  color:'#F1FF58' },
]

const ORDERBOOK = {
  bids: [
    { price: 0.77, size: 4200, total: 4200 },
    { price: 0.76, size: 3100, total: 7300 },
    { price: 0.75, size: 6800, total: 14100 },
    { price: 0.74, size: 2200, total: 16300 },
    { price: 0.73, size: 1900, total: 18200 },
  ],
  asks: [
    { price: 0.78, size: 3800, total: 3800 },
    { price: 0.79, size: 2900, total: 6700 },
    { price: 0.80, size: 5100, total: 11800 },
    { price: 0.81, size: 1700, total: 13500 },
    { price: 0.82, size: 2300, total: 15800 },
  ],
}

const HEATMAP = [
  { cat:'Politics',  vol:4.3, change:+3.2,  markets:312 },
  { cat:'Crypto',    vol:6.1, change:-1.8,  markets:198 },
  { cat:'AI / Tech', vol:2.8, change:+8.4,  markets:143 },
  { cat:'Sports',    vol:1.2, change:+0.3,  markets:287 },
  { cat:'Weather',   vol:0.4, change:-0.9,  markets:88  },
  { cat:'Science',   vol:0.7, change:+1.1,  markets:104 },
  { cat:'Other',     vol:0.9, change:-2.3,  markets:152 },
]

/* ── Sparkline ─────────────────────────────────────────────────── */
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 80, h = 32
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  const color = positive ? '#F1FF58' : '#FF3A6E'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── Carousel ──────────────────────────────────────────────────── */
function MarketCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => setActive(a => (a + 1) % CAROUSEL_MARKETS.length), 3200)
    return () => clearInterval(timerRef.current!)
  }, [paused])

  const visible = [
    CAROUSEL_MARKETS[(active) % CAROUSEL_MARKETS.length],
    CAROUSEL_MARKETS[(active + 1) % CAROUSEL_MARKETS.length],
    CAROUSEL_MARKETS[(active + 2) % CAROUSEL_MARKETS.length],
    CAROUSEL_MARKETS[(active + 3) % CAROUSEL_MARKETS.length],
  ]

  return (
    <div className="carousel-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="carousel-header">
        <span className="section-label">🔥 TRENDING MARKETS</span>
        <div className="carousel-dots">
          {CAROUSEL_MARKETS.map((_, i) => (
            <button key={i} className={`carousel-dot${i === active ? ' active' : ''}`} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
      <div className="carousel-track">
        {visible.map((m, i) => {
          const pos = m.change >= 0
          return (
            <div key={m.id + i} className="carousel-card glass">
              <div className="carousel-card-top">
                <span className="carousel-cat">{m.cat}</span>
                <span className="carousel-vol">{m.vol}</span>
              </div>
              <p className="carousel-question">{m.q}</p>
              <div className="carousel-bottom">
                <div className="carousel-prob">
                  <span className="carousel-yes">{m.yes}%</span>
                  <span className="carousel-change" style={{ color: pos ? '#F1FF58' : '#FF3A6E' }}>
                    {pos ? '▲' : '▼'} {Math.abs(m.change)}%
                  </span>
                </div>
                <Sparkline data={m.spark} positive={pos} />
              </div>
              <div className="carousel-bar">
                <div className="carousel-bar-fill" style={{ width: `${m.yes}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Live Feed ─────────────────────────────────────────────────── */
const FEED_ICONS: Record<string, string> = { whale: '🐋', spike: '⚡', resolved: '✅', new: '🆕' }

function LiveFeed() {
  const [feed, setFeed] = useState(LIVE_FEED)
  useEffect(() => {
    const t = setInterval(() => {
      setFeed(f => {
        const newItem = {
          id: `f${Date.now()}`,
          type: ['whale','spike','resolved','new'][Math.floor(Math.random()*4)],
          text: [
            'Whale bet $31K YES on S&P 7000',
            'New market: Will Nvidia hit $200?',
            'BTC odds up +3.1% in last hour',
            'Market resolved: UK election — YES',
          ][Math.floor(Math.random()*4)],
          time: 'just now',
          cat: ['Crypto','Politics','AI / Tech','Sports'][Math.floor(Math.random()*4)],
          color: ['#F1FF58','#FF3A6E','#C084FC','#F5A623'][Math.floor(Math.random()*4)],
        }
        return [newItem, ...f.slice(0, 7)]
      })
    }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="glass livefeed-wrap">
      <span className="section-label">⚡ LIVE ACTIVITY</span>
      <div className="livefeed-list">
        {feed.map((item, i) => (
          <div key={item.id} className={`livefeed-item${i === 0 ? ' fresh' : ''}`}>
            <span className="livefeed-icon">{FEED_ICONS[item.type]}</span>
            <div className="livefeed-body">
              <p className="livefeed-text">{item.text}</p>
              <div className="livefeed-meta">
                <span className="livefeed-cat" style={{ color: item.color }}>{item.cat}</span>
                <span className="livefeed-time">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Order Book ────────────────────────────────────────────────── */
function OrderBook() {
  const maxTotal = Math.max(...ORDERBOOK.asks.map(a => a.total), ...ORDERBOOK.bids.map(b => b.total))
  return (
    <div className="glass orderbook-wrap">
      <span className="section-label">📖 ORDER BOOK — Fed Rate Cut</span>
      <div className="orderbook-header">
        <span>PRICE</span><span>SIZE</span><span>TOTAL</span>
      </div>
      <div className="orderbook-asks">
        {[...ORDERBOOK.asks].reverse().map((a, i) => (
          <div key={i} className="orderbook-row ask">
            <div className="orderbook-depth ask-depth" style={{ width: `${(a.total/maxTotal)*100}%` }} />
            <span className="orderbook-price ask-price">{a.price.toFixed(2)}</span>
            <span className="orderbook-size">{a.size.toLocaleString()}</span>
            <span className="orderbook-total">{a.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="orderbook-spread">
        <span>SPREAD</span><span style={{ color:'#F1FF58' }}>0.01</span>
      </div>
      <div className="orderbook-bids">
        {ORDERBOOK.bids.map((b, i) => (
          <div key={i} className="orderbook-row bid">
            <div className="orderbook-depth bid-depth" style={{ width: `${(b.total/maxTotal)*100}%` }} />
            <span className="orderbook-price bid-price">{b.price.toFixed(2)}</span>
            <span className="orderbook-size">{b.size.toLocaleString()}</span>
            <span className="orderbook-total">{b.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Volatility Heatmap ────────────────────────────────────────── */
function Heatmap() {
  const maxVol = Math.max(...HEATMAP.map(h => h.vol))
  return (
    <div className="glass heatmap-wrap">
      <span className="section-label">🌡 VOLATILITY BY CATEGORY</span>
      <div className="heatmap-grid">
        {HEATMAP.map(h => {
          const intensity = h.vol / maxVol
          const pos = h.change >= 0
          return (
            <div
              key={h.cat}
              className="heatmap-cell"
              style={{
                background: pos
                  ? `rgba(241,255,88,${0.04 + intensity * 0.18})`
                  : `rgba(255,58,110,${0.04 + intensity * 0.18})`,
                borderColor: pos
                  ? `rgba(241,255,88,${0.1 + intensity * 0.3})`
                  : `rgba(255,58,110,${0.1 + intensity * 0.3})`,
              }}
            >
              <span className="heatmap-cat">{h.cat}</span>
              <span className="heatmap-vol">${h.vol}M</span>
              <span className="heatmap-change" style={{ color: pos ? '#F1FF58' : '#FF3A6E' }}>
                {pos ? '+' : ''}{h.change}%
              </span>
              <span className="heatmap-markets">{h.markets} mkts</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main Chart ────────────────────────────────────────────────── */
function MainChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<unknown>(null)
  const [range, setRange] = useState<'1H'|'6H'|'1D'|'1W'>('1D')

  const chartData: Record<string, { labels: string[]; market: number[]; ai: number[] }> = {
    '1H': { labels:['12:00','12:10','12:20','12:30','12:40','12:50','13:00'], market:[72,73,74,75,76,77,78], ai:[65,66,66,67,68,68,69] },
    '6H': { labels:['08:00','09:00','10:00','11:00','12:00','13:00','14:00'], market:[68,70,71,73,75,76,78], ai:[62,63,64,65,66,67,69] },
    '1D': { labels:['09:00','10:00','11:00','12:00','13:00','14:00','15:00'], market:[54,58,62,67,71,74,78], ai:[50,52,54,56,58,61,63] },
    '1W': { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],               market:[40,48,55,60,65,70,78], ai:[38,42,47,51,55,59,63] },
  }

  useEffect(() => {
    import('chart.js/auto').then(mod => {
      const Chart = mod.default
      if (!canvasRef.current) return
      if (chartRef.current) (chartRef.current as {destroy:()=>void}).destroy()
      const d = chartData[range]
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: d.labels,
          datasets: [
            { label:'Market', data:d.market, borderColor:'#F1FF58', borderWidth:2.5, pointRadius:0, tension:0.4, fill:true,
              backgroundColor:'rgba(241,255,88,0.08)',
            },
            { label:'AI', data:d.ai, borderColor:'#C084FC', borderWidth:1.5, pointRadius:0, tension:0.4, fill:false, borderDash:[5,4] },
          ],
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#0A3D3E', titleColor:'#9ECECE', bodyColor:'#F1FF58', borderColor:'#416858', borderWidth:0.5, padding:10 } },
          scales:{
            x:{ grid:{color:'rgba(65,104,88,0.15)'}, ticks:{color:'#7FA8A8', font:{size:10}}, border:{display:false} },
            y:{ grid:{color:'rgba(65,104,88,0.15)'}, ticks:{color:'#7FA8A8', font:{size:10}, callback:(v)=>`${v}%`}, border:{display:false} },
          },
        },
      })
    })
    return () => { if (chartRef.current) (chartRef.current as {destroy:()=>void}).destroy() }
  }, [range])

  return (
    <div className="glass main-chart-wrap">
      <div className="main-chart-header">
        <div>
          <span className="section-label">PRICE CHART — Fed Rate Cut June 2026</span>
          <div style={{display:'flex',gap:16,marginTop:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:16,height:2,background:'#F1FF58'}}/>
              <span style={{fontSize:11,color:'#9ECECE'}}>Market odds</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:16,height:0,borderTop:'1.5px dashed #C084FC'}}/>
              <span style={{fontSize:11,color:'#9ECECE'}}>AI estimate</span>
            </div>
          </div>
        </div>
        <div className="chart-range-tabs">
          {(['1H','6H','1D','1W'] as const).map(r => (
            <button key={r} className={`range-tab${range===r?' active':''}`} onClick={()=>setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{position:'relative',height:180,width:'100%',minWidth:0}}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <main className="page-wrapper">
      <Navbar />
      <Ticker items={tickerItems} />

      {/* Stat row */}
      <div className="grid-stats">
        <StatCard label="MARKETS TRACKED"  value="1,284" sub="across 7 categories" />
        <StatCard label="ACTIVE SIGNALS"   value="14"    sub="3 high confidence"   valueColor="purple" />
        <StatCard label="AVG MISMATCH"     value="+8.3%" sub="↑ vs yesterday"      valueColor="yellow" subColor="yellow" />
        <StatCard label="VOLATILITY INDEX" value="HIGH"  sub="6 spikes in 1h"      valueColor="red"    subColor="red" />
      </div>

      {/* Trending carousel — full width */}
      <MarketCarousel />

      {/* Chart + Insights */}
      <div className="grid-main">
        <MainChart />
        <div className="insight-card-wrap">
          <InsightFeed insights={insights} />
        </div>
      </div>

      {/* Live feed + Order book + Heatmap */}
      <div className="grid-bottom">
        <LiveFeed />
        <OrderBook />
        <Heatmap />
      </div>
    </main>
  )
}