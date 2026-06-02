'use client'

import { useState, useEffect, useRef } from 'react'
import { Navbar } from '../components/dashboard/Navbar'
import { Badge } from '../components/ui/Badge'

/* ── Types ─────────────────────────────────────────────────────── */
type Confidence = 'high' | 'monitor' | 'normal'

interface Signal {
  id: string
  time: string
  age: number
  market: string
  category: string
  marketOdds: number
  aiEstimate: number
  gapVal: number
  confidence: Confidence
  summary: string
  keywords: string[]
  sources: { name: string; sentiment: 'bullish' | 'bearish' | 'neutral' }[]
  history: number[]
}

/* ── Data ──────────────────────────────────────────────────────── */
const SIGNALS: Signal[] = [
  {
    id: '1', time: '14:32:01', age: 2,
    market: 'Will the Fed cut rates in June 2026?',
    category: 'Politics', marketOdds: 78, aiEstimate: 43, gapVal: 35,
    confidence: 'high',
    summary: 'Market pricing a cut at 78% but scraped news and Fed minutes show only 43% implied probability. Possible overreaction to last week\'s CPI print. FOMC commentary signals caution.',
    keywords: ['FOMC', 'CPI', 'Rate cut', 'Inflation'],
    sources: [
      { name: 'Reuters',    sentiment: 'bearish'  },
      { name: 'Bloomberg',  sentiment: 'bearish'  },
      { name: 'WSJ',        sentiment: 'neutral'  },
      { name: 'X / Social', sentiment: 'bullish'  },
    ],
    history: [52,55,58,60,62,65,68,71,74,76,78],
  },
  {
    id: '2', time: '14:18:44', age: 16,
    market: 'Will OpenAI go public before 2027?',
    category: 'AI / Tech', marketOdds: 69, aiEstimate: 48, gapVal: 21,
    confidence: 'high',
    summary: 'Odds jumped 12% in 2hrs with no corroborating news. Social sentiment neutral. Pattern matches prior coordinated buying events. No IPO filings found in SEC EDGAR.',
    keywords: ['IPO', 'SEC', 'OpenAI', 'Valuation'],
    sources: [
      { name: 'TechCrunch', sentiment: 'neutral'  },
      { name: 'SEC EDGAR',  sentiment: 'bearish'  },
      { name: 'X / Social', sentiment: 'neutral'  },
      { name: 'FT',         sentiment: 'bearish'  },
    ],
    history: [48,50,52,54,56,57,59,62,65,67,69],
  },
  {
    id: '3', time: '13:55:17', age: 39,
    market: 'Will BTC reach $100k before July 2026?',
    category: 'Crypto', marketOdds: 61, aiEstimate: 50, gapVal: 11,
    confidence: 'monitor',
    summary: 'Moderate gap detected. On-chain volume declining while market odds remain elevated. Whale wallet activity suggests distribution phase. Mean reversion likely within 48h.',
    keywords: ['On-chain', 'Whale', 'Volume', 'Resistance'],
    sources: [
      { name: 'Glassnode',  sentiment: 'bearish'  },
      { name: 'CoinDesk',   sentiment: 'neutral'  },
      { name: 'X / Social', sentiment: 'bullish'  },
      { name: 'Bloomberg',  sentiment: 'neutral'  },
    ],
    history: [58,59,60,61,60,62,61,60,61,61,61],
  },
  {
    id: '4', time: '13:40:09', age: 54,
    market: 'Will Trump approve new crypto legislation?',
    category: 'Politics', marketOdds: 52, aiEstimate: 49, gapVal: 3,
    confidence: 'monitor',
    summary: 'Minor gap within noise threshold but high trade volume warrants monitoring. Senate committee scheduled for next Tuesday — potential catalyst for a move.',
    keywords: ['Legislation', 'Senate', 'Regulation', 'White House'],
    sources: [
      { name: 'Politico',   sentiment: 'neutral'  },
      { name: 'Reuters',    sentiment: 'neutral'  },
      { name: 'X / Social', sentiment: 'bullish'  },
    ],
    history: [50,51,51,52,51,52,53,52,52,51,52],
  },
  {
    id: '5', time: '12:59:33', age: 95,
    market: 'Will S&P 500 hit 7000 by year end?',
    category: 'Politics', marketOdds: 57, aiEstimate: 55, gapVal: 2,
    confidence: 'normal',
    summary: 'Market and AI estimate closely aligned. Macro sentiment and financial news both support current pricing. No divergence detected across monitored sources.',
    keywords: ['S&P 500', 'Macro', 'Equities', 'Bull market'],
    sources: [
      { name: 'Bloomberg',  sentiment: 'bullish'  },
      { name: 'Goldman',    sentiment: 'bullish'  },
      { name: 'X / Social', sentiment: 'bullish'  },
    ],
    history: [54,55,55,56,56,57,56,57,57,57,57],
  },
  {
    id: '6', time: '12:11:22', age: 141,
    market: 'Will GPT-5 release before August 2026?',
    category: 'AI / Tech', marketOdds: 44, aiEstimate: 46, gapVal: -2,
    confidence: 'normal',
    summary: 'AI estimate slightly above market. Insider commentary on X suggests August is realistic. Compute cluster availability is the main bottleneck per scraped forums.',
    keywords: ['GPT-5', 'OpenAI', 'Release', 'Compute'],
    sources: [
      { name: 'X / Social', sentiment: 'bullish'  },
      { name: 'The Verge',  sentiment: 'neutral'  },
      { name: 'Ars Technica',sentiment:'neutral'  },
    ],
    history: [42,43,43,44,44,45,44,44,43,44,44],
  },
]

/* ── Config ─────────────────────────────────────────────────────── */
const CFG: Record<Confidence, { badge: 'red'|'amber'|'purple'; label: string; accent: string; glow: string; bg: string }> = {
  high:    { badge:'red',    label:'HIGH CONFIDENCE', accent:'#FF3A6E', glow:'rgba(255,58,110,0.15)',  bg:'rgba(255,58,110,0.06)'  },
  monitor: { badge:'amber',  label:'MONITOR',         accent:'#F5A623', glow:'rgba(245,166,35,0.12)', bg:'rgba(245,166,35,0.05)'  },
  normal:  { badge:'purple', label:'ALIGNED',         accent:'#C084FC', glow:'rgba(192,132,252,0.1)', bg:'rgba(192,132,252,0.04)' },
}

const SENTIMENT_COLOR = { bullish:'#F1FF58', bearish:'#FF3A6E', neutral:'#9ECECE' }
const SENTIMENT_ICON  = { bullish:'▲', bearish:'▼', neutral:'◆' }

/* ── Mini Sparkline ─────────────────────────────────────────────── */
function MiniSpark({ data, accent }: { data: number[]; accent: string }) {
  const w=120, h=36
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)+2}`).join(' ')
  const last = data[data.length-1]
  const lx = w, ly = h-((last-min)/range)*(h-4)+2
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`spark-${accent.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#spark-${accent.replace('#','')})`}
      />
      <polyline points={pts} fill="none" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r="3" fill={accent} opacity="0.9"/>
    </svg>
  )
}

/* ── Gap Gauge ──────────────────────────────────────────────────── */
function GapGauge({ market, ai, accent }: { market: number; ai: number; accent: string }) {
  const gap = Math.abs(market - ai)
  return (
    <div className="gap-gauge">
      <div className="gap-gauge-track">
        {/* AI bar */}
        <div className="gap-gauge-ai"   style={{ width:`${ai}%`,     background:'#C084FC' }} />
        {/* Market bar */}
        <div className="gap-gauge-mkt"  style={{ width:`${market}%`, background: accent,  opacity:0.85 }} />
        {/* Gap highlight */}
        <div className="gap-gauge-diff" style={{
          left: `${Math.min(market,ai)}%`,
          width:`${gap}%`,
          background: accent,
          opacity: 0.25,
        }}/>
      </div>
      <div className="gap-gauge-labels">
        <span style={{ color:'#C084FC' }}>AI {ai}%</span>
        <span style={{ color: accent }}>MKT {market}%</span>
      </div>
    </div>
  )
}

/* ── Signal Card ────────────────────────────────────────────────── */
function SignalCard({ s, expanded, onToggle }: { s: Signal; expanded: boolean; onToggle: () => void }) {
  const cfg    = CFG[s.confidence]
  const posGap = s.gapVal >= 0
  const ageStr = s.age < 60 ? `${s.age}m ago` : `${Math.floor(s.age/60)}h ${s.age%60}m ago`

  return (
    <div
      className={`sig-card${expanded ? ' expanded' : ''}`}
      style={{ '--accent': cfg.accent, '--glow': cfg.glow, '--bg': cfg.bg } as React.CSSProperties}
      onClick={onToggle}
    >
      {/* Animated accent border */}
      <div className="sig-card-border" />

      {/* Top row */}
      <div className="sig-top">
        <div className="sig-top-left">
          <div className="sig-meta">
            <span className="sig-time">⏱ {ageStr}</span>
            <span className="sig-cat">{s.category}</span>
            {s.confidence === 'high' && <span className="sig-urgent">● URGENT</span>}
          </div>
          <p className="sig-market">{s.market}</p>
        </div>
        <div className="sig-top-right">
          <Badge variant={cfg.badge}>{cfg.label}</Badge>
          <div className="sig-gap-badge" style={{ color: posGap ? '#FF3A6E' : '#F1FF58', borderColor: posGap ? 'rgba(255,58,110,0.3)' : 'rgba(241,255,88,0.3)', background: posGap ? 'rgba(255,58,110,0.08)' : 'rgba(241,255,88,0.08)' }}>
            {posGap ? '▲' : '▼'} {Math.abs(s.gapVal)}% gap
          </div>
        </div>
      </div>

      {/* Gauge + spark */}
      <div className="sig-mid">
        <GapGauge market={s.marketOdds} ai={s.aiEstimate} accent={cfg.accent} />
        <MiniSpark data={s.history} accent={cfg.accent} />
      </div>

      {/* Summary */}
      <p className="sig-summary">{s.summary}</p>

      {/* Expanded detail */}
      {expanded && (
        <div className="sig-detail" onClick={e => e.stopPropagation()}>
          <div className="sig-detail-grid">
            {/* Keywords */}
            <div className="sig-section">
              <span className="sig-section-label">DETECTED KEYWORDS</span>
              <div className="sig-keywords">
                {s.keywords.map(k => <span key={k} className="sig-keyword">{k}</span>)}
              </div>
            </div>
            {/* Sources */}
            <div className="sig-section">
              <span className="sig-section-label">SOURCE SENTIMENT</span>
              <div className="sig-sources">
                {s.sources.map(src => (
                  <div key={src.name} className="sig-source-row">
                    <span className="sig-source-name">{src.name}</span>
                    <div className="sig-source-bar-wrap">
                      <div className="sig-source-bar" style={{ background: SENTIMENT_COLOR[src.sentiment], width: src.sentiment==='bullish'?'70%':src.sentiment==='bearish'?'70%':'40%' }} />
                    </div>
                    <span className="sig-source-val" style={{ color: SENTIMENT_COLOR[src.sentiment] }}>
                      {SENTIMENT_ICON[src.sentiment]} {src.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Odds comparison */}
            <div className="sig-section">
              <span className="sig-section-label">ODDS BREAKDOWN</span>
              <div className="sig-odds-big">
                <div className="sig-odds-col">
                  <span className="sig-odds-num" style={{ color:'#F1FF58' }}>{s.marketOdds}%</span>
                  <span className="sig-odds-lbl">Market</span>
                </div>
                <div className="sig-odds-vs">VS</div>
                <div className="sig-odds-col">
                  <span className="sig-odds-num" style={{ color:'#C084FC' }}>{s.aiEstimate}%</span>
                  <span className="sig-odds-lbl">AI Estimate</span>
                </div>
                <div className="sig-odds-col">
                  <span className="sig-odds-num" style={{ color: posGap?'#FF3A6E':'#F1FF58' }}>{posGap?'+':''}{s.gapVal}%</span>
                  <span className="sig-odds-lbl">Gap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sig-expand-hint">{expanded ? '▲ collapse' : '▼ expand analysis'}</div>
    </div>
  )
}

/* ── Live counter ───────────────────────────────────────────────── */
function LiveCounter({ label, value, color }: { label: string; value: number; color: string }) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    const t = setInterval(() => {
      setDisplay(v => Math.random() > 0.85 ? v + (Math.random() > 0.5 ? 1 : -1) : v)
    }, 3000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="sig-counter">
      <span className="sig-counter-val" style={{ color }}>{display}</span>
      <span className="sig-counter-lbl">{label}</span>
    </div>
  )
}

/* ── Radar ──────────────────────────────────────────────────────── */
function RadarStats() {
  const total = SIGNALS.length
  const high  = SIGNALS.filter(s=>s.confidence==='high').length
  const mon   = SIGNALS.filter(s=>s.confidence==='monitor').length
  const norm  = SIGNALS.filter(s=>s.confidence==='normal').length
  const maxGap = Math.max(...SIGNALS.map(s=>Math.abs(s.gapVal)))

  return (
    <div className="radar-wrap glass">
      <span className="section-label">📡 SIGNAL RADAR</span>
      <div className="radar-stats">
        <LiveCounter label="High Confidence" value={high}  color="#FF3A6E" />
        <LiveCounter label="Monitoring"      value={mon}   color="#F5A623" />
        <LiveCounter label="Aligned"         value={norm}  color="#C084FC" />
        <LiveCounter label="Total Active"    value={total} color="#F1FF58" />
      </div>
      <div className="radar-bar-wrap">
        <div className="radar-bar-label">
          <span>Avg mismatch</span>
          <span style={{color:'#F1FF58'}}>+{(SIGNALS.reduce((a,s)=>a+s.gapVal,0)/total).toFixed(1)}%</span>
        </div>
        <div className="radar-bar-track">
          <div className="radar-bar-fill" style={{ width:`${(SIGNALS.reduce((a,s)=>a+s.gapVal,0)/total)/maxGap*100}%` }} />
        </div>
        <div className="radar-bar-label" style={{marginTop:8}}>
          <span>Max gap detected</span>
          <span style={{color:'#FF3A6E'}}>+{maxGap}%</span>
        </div>
        <div className="radar-bar-track">
          <div className="radar-bar-fill" style={{width:'100%', background:'#FF3A6E'}} />
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function SignalsPage() {
  const [expanded, setExpanded] = useState<string | null>('1')
  const [filter,   setFilter]   = useState<Confidence | 'all'>('all')
  const [ticker,   setTicker]   = useState(0)
  const tickerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // Pulse the urgent counter
  useEffect(() => {
    tickerRef.current = setInterval(() => setTicker(t => t+1), 1800)
    return () => clearInterval(tickerRef.current!)
  }, [])

  const filtered = SIGNALS.filter(s => filter==='all' || s.confidence===filter)
    .sort((a,b) => Math.abs(b.gapVal) - Math.abs(a.gapVal))

  return (
    <main className="page-wrapper">
      <Navbar />

      {/* Header */}
      <div className="sig-page-header">
        <div>
          <div className="sig-page-title-row">
            <h1 className="page-title">Signal Feed</h1>
            <div className="sig-live-pill">
              <span className="sig-live-dot" style={{animationDelay:`${(ticker%3)*0.3}s`}}/>
              LIVE
            </div>
          </div>
          <p className="page-subtitle">AI-detected mismatches — sorted by divergence magnitude</p>
        </div>
      </div>

      {/* Radar + filter row */}
      <div className="sig-top-row">
        <RadarStats />
        <div className="sig-filter-col">
          <span className="section-label">FILTER BY CONFIDENCE</span>
          <div className="sig-filter-btns">
            {(['all','high','monitor','normal'] as const).map(f => (
              <button
                key={f}
                className={`sig-filter-btn${filter===f?' active':''}`}
                style={filter===f && f!=='all' ? { borderColor: CFG[f as Confidence]?.accent, color: CFG[f as Confidence]?.accent, background: CFG[f as Confidence]?.bg } : {}}
                onClick={()=>setFilter(f)}
              >
                {f==='all'?'All Signals':CFG[f as Confidence].label}
                <span className="sig-filter-count">
                  {f==='all' ? SIGNALS.length : SIGNALS.filter(s=>s.confidence===f).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Signal cards */}
      <div className="sig-list">
        {filtered.map(s => (
          <SignalCard
            key={s.id}
            s={s}
            expanded={expanded === s.id}
            onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
          />
        ))}
      </div>
    </main>
  )
}