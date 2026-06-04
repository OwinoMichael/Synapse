'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '../components/dashboard/Navbar'
import { Badge }  from '../components/ui/Badge'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { fetchSignals, type ApiSignal } from '../../lib/api'

type Confidence = 'HIGH' | 'MONITOR' | 'NORMAL'

const CFG: Record<Confidence, { badge: 'red'|'amber'|'purple'; label: string; accent: string; bg: string }> = {
  HIGH:    { badge:'red',    label:'HIGH CONFIDENCE', accent:'#FF3A6E', bg:'rgba(255,58,110,0.06)'  },
  MONITOR: { badge:'amber',  label:'MONITOR',         accent:'#F5A623', bg:'rgba(245,166,35,0.05)'  },
  NORMAL:  { badge:'purple', label:'ALIGNED',         accent:'#C084FC', bg:'rgba(192,132,252,0.04)' },
}

const SENTIMENT_COLOR: Record<string, string> = { bullish:'#F1FF58', bearish:'#FF3A6E', neutral:'#9ECECE' }

function GapGauge({ market, ai, accent }: { market: number; ai: number; accent: string }) {
  const gap = Math.abs(market - ai)
  return (
    <div className="gap-gauge">
      <div className="gap-gauge-track">
        <div className="gap-gauge-ai"   style={{ width:`${ai}%`,     background:'#C084FC' }} />
        <div className="gap-gauge-mkt"  style={{ width:`${market}%`, background: accent, opacity:0.85 }} />
        <div className="gap-gauge-diff" style={{ left:`${Math.min(market,ai)}%`, width:`${gap}%`, background: accent, opacity:0.25 }} />
      </div>
      <div className="gap-gauge-labels">
        <span style={{ color:'#C084FC' }}>AI {ai}%</span>
        <span style={{ color: accent }}>MKT {market}%</span>
      </div>
    </div>
  )
}

function MiniSpark({ data, accent }: { data: number[]; accent: string }) {
  const w=120, h=36
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)+2}`).join(' ')
  const lx=w, ly=h-((data[data.length-1]-min)/range)*(h-4)+2
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={`0,${h} ${pts} ${w},${h}`}
        fill={accent} opacity="0.15"/>
      <polyline points={pts} fill="none" stroke={accent} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r="3" fill={accent} opacity="0.9"/>
    </svg>
  )
}

function SignalCard({ s, expanded, onToggle }: { s: ApiSignal; expanded: boolean; onToggle: () => void }) {
  const cfg    = CFG[s.confidence]
  const posGap = s.gap >= 0
  const ageMs  = Date.now() - new Date(s.createdAt).getTime()
  const ageStr = ageMs < 3600000
    ? `${Math.floor(ageMs/60000)}m ago`
    : `${Math.floor(ageMs/3600000)}h ago`

  // Build synthetic spark from gap magnitude
  const spark = Array.from({ length: 11 }, (_, i) =>
    Math.max(0, Math.min(100, s.marketOdds - s.gap + (i / 10) * s.gap + Math.sin(i) * 1.5))
  )

  return (
    <div
      className={`sig-card${expanded ? ' expanded' : ''}`}
      style={{ '--accent': cfg.accent, '--bg': cfg.bg } as React.CSSProperties}
      onClick={onToggle}
    >
      <div className="sig-card-border" />
      <div className="sig-top">
        <div className="sig-top-left">
          <div className="sig-meta">
            <span className="sig-time">⏱ {ageStr}</span>
            <span className="sig-cat">{s.category}</span>
            {s.confidence === 'HIGH' && <span className="sig-urgent">● URGENT</span>}
          </div>
          <p className="sig-market">{s.marketQuestion}</p>
        </div>
        <div className="sig-top-right">
          <Badge variant={cfg.badge}>{cfg.label}</Badge>
          <div className="sig-gap-badge" style={{
            color:       posGap ? '#FF3A6E' : '#F1FF58',
            borderColor: posGap ? 'rgba(255,58,110,0.3)' : 'rgba(241,255,88,0.3)',
            background:  posGap ? 'rgba(255,58,110,0.08)' : 'rgba(241,255,88,0.08)',
          }}>
            {posGap ? '▲' : '▼'} {Math.abs(s.gap).toFixed(1)}% gap
          </div>
        </div>
      </div>

      <div className="sig-mid">
        <GapGauge market={s.marketOdds} ai={s.aiEstimate} accent={cfg.accent} />
        <MiniSpark data={spark} accent={cfg.accent} />
      </div>

      <p className="sig-summary">{s.summary}</p>

      {expanded && (
        <div className="sig-detail" onClick={e => e.stopPropagation()}>
          <div className="sig-detail-grid">
            <div className="sig-section">
              <span className="sig-section-label">DETECTED KEYWORDS</span>
              <div className="sig-keywords">
                {s.keywords.map(k => <span key={k} className="sig-keyword">{k}</span>)}
              </div>
            </div>
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
                  <span className="sig-odds-num" style={{ color: posGap?'#FF3A6E':'#F1FF58' }}>
                    {posGap?'+':''}{s.gap.toFixed(1)}%
                  </span>
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

function LiveCounter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="sig-counter">
      <span className="sig-counter-val" style={{ color }}>{value}</span>
      <span className="sig-counter-lbl">{label}</span>
    </div>
  )
}

export default function SignalsPage() {
  const [signals,  setSignals]  = useState<ApiSignal[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter,   setFilter]   = useState<'all'|Confidence>('all')
  const [connected,setConnected]= useState(false)
  const clientRef = useRef<Client | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchSignals()
      setSignals(data)
      if (data.length > 0) setExpanded(String(data[0].id))
    } catch (e) {
      console.error('Failed to fetch signals:', e)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // STOMP subscription for new signals
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_SPRING_WS_URL ?? 'http://localhost:8080/ws'
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe('/topic/signals', (frame: IMessage) => {
          try {
            const msg = JSON.parse(frame.body)
            // Reload signals when a new one arrives
            load()
          } catch (e) {}
        })
      },
      onDisconnect: () => setConnected(false),
    })
    client.activate()
    clientRef.current = client
    return () => { client.deactivate() }
  }, [load])

  const filtered = signals
    .filter(s => filter === 'all' || s.confidence === filter)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))

  const high    = signals.filter(s => s.confidence === 'HIGH').length
  const monitor = signals.filter(s => s.confidence === 'MONITOR').length
  const normal  = signals.filter(s => s.confidence === 'NORMAL').length

  return (
    <main className="page-wrapper">
      <Navbar />

      <div className="sig-page-header">
        <div className="sig-page-title-row">
          <h1 className="page-title">Signal Feed</h1>
          <div className="sig-live-pill">
            <span className="sig-live-dot" style={{ background: connected ? '#F1FF58' : '#416858' }}/>
            {connected ? 'LIVE' : 'CONNECTING'}
          </div>
        </div>
        <p className="page-subtitle">AI-detected mismatches — sorted by divergence magnitude</p>
      </div>

      <div className="sig-top-row">
        <div className="radar-wrap glass">
          <span className="section-label">📡 SIGNAL RADAR</span>
          <div className="radar-stats">
            <LiveCounter label="High Confidence" value={high}             color="#FF3A6E" />
            <LiveCounter label="Monitoring"      value={monitor}          color="#F5A623" />
            <LiveCounter label="Aligned"         value={normal}           color="#C084FC" />
            <LiveCounter label="Total Active"    value={signals.length}   color="#F1FF58" />
          </div>
          {signals.length === 0 && (
            <p style={{ fontSize:12, color:'#7FA8A8', marginTop:8, textAlign:'center' }}>
              AI signals will appear here once the signals feature is active
            </p>
          )}
        </div>

        <div className="sig-filter-col">
          <span className="section-label">FILTER BY CONFIDENCE</span>
          <div className="sig-filter-btns">
            {(['all','HIGH','MONITOR','NORMAL'] as const).map(f => (
              <button
                key={f}
                className={`sig-filter-btn${filter === f ? ' active' : ''}`}
                style={filter === f && f !== 'all' ? {
                  borderColor: CFG[f as Confidence].accent,
                  color:       CFG[f as Confidence].accent,
                  background:  CFG[f as Confidence].bg,
                } : {}}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All Signals' : CFG[f as Confidence].label}
                <span className="sig-filter-count">
                  {f === 'all' ? signals.length : signals.filter(s => s.confidence === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sig-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#7FA8A8', fontSize:13 }}>
            {signals.length === 0
              ? 'No signals yet — the AI engine will detect mismatches as markets move'
              : 'No signals match this filter'}
          </div>
        ) : (
          filtered.map(s => (
            <SignalCard
              key={s.id}
              s={s}
              expanded={expanded === String(s.id)}
              onToggle={() => setExpanded(expanded === String(s.id) ? null : String(s.id))}
            />
          ))
        )}
      </div>
    </main>
  )
}