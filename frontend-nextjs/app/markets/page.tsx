'use client'

import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Navbar } from '../components/dashboard/Navbar'

const CATEGORIES = ['All', 'Politics', 'Crypto', 'AI / Tech', 'Sports', 'Weather', 'Science', 'Other']
const FILTERS    = ['Hot', 'Rising', 'New', 'Closing Soon', 'High Volume']

const ALL_MARKETS = [
  { id:'1',  q:'Will the Fed cut rates in June 2026?',          cat:'Politics',  yes:78,  no:22,  vol:'$2.4M',  volNum:2400, trades:1842, change:+5.2,  signal:'high',    closing:'2d',  tags:['Hot','High Volume'] },
  { id:'2',  q:'Will BTC reach $100k before July 2026?',        cat:'Crypto',    yes:61,  no:39,  vol:'$5.1M',  volNum:5100, trades:3291, change:-2.1,  signal:'monitor', closing:'14d', tags:['Hot','High Volume'] },
  { id:'3',  q:'Will GPT-5 release before August 2026?',        cat:'AI / Tech', yes:44,  no:56,  vol:'$890K',  volNum:890,  trades:612,  change:+1.8,  signal:'normal',  closing:'52d', tags:['Rising'] },
  { id:'4',  q:'Will it snow in NYC this December?',            cat:'Weather',   yes:83,  no:17,  vol:'$210K',  volNum:210,  trades:189,  change:+0.3,  signal:'none',    closing:'7mo', tags:[] },
  { id:'5',  q:'Will Trump approve new crypto legislation?',    cat:'Politics',  yes:52,  no:48,  vol:'$3.7M',  volNum:3700, trades:2103, change:+0.5,  signal:'monitor', closing:'30d', tags:['Hot'] },
  { id:'6',  q:'Will ETH flip BTC by market cap in 2026?',     cat:'Crypto',    yes:18,  no:82,  vol:'$1.2M',  volNum:1200, trades:944,  change:-4.3,  signal:'high',    closing:'5mo', tags:['Rising'] },
  { id:'7',  q:'Will Apple release AR glasses in 2026?',        cat:'AI / Tech', yes:34,  no:66,  vol:'$670K',  volNum:670,  trades:501,  change:-1.2,  signal:'normal',  closing:'6mo', tags:['New'] },
  { id:'8',  q:'Will the S&P 500 hit 7000 by year end?',       cat:'Politics',  yes:57,  no:43,  vol:'$4.3M',  volNum:4300, trades:2891, change:+3.1,  signal:'monitor', closing:'7mo', tags:['High Volume'] },
  { id:'9',  q:'Will there be a hurricane Cat 5 in 2026?',     cat:'Weather',   yes:41,  no:59,  vol:'$330K',  volNum:330,  trades:201,  change:-0.9,  signal:'none',    closing:'4mo', tags:[] },
  { id:'10', q:'Will OpenAI go public before 2027?',           cat:'AI / Tech', yes:69,  no:31,  vol:'$1.8M',  volNum:1800, trades:1120, change:+12,   signal:'high',    closing:'7mo', tags:['Hot','Rising'] },
  { id:'11', q:'Will Solana surpass Ethereum in daily txns?',  cat:'Crypto',    yes:29,  no:71,  vol:'$920K',  volNum:920,  trades:734,  change:-1.4,  signal:'normal',  closing:'5mo', tags:['New'] },
  { id:'12', q:'Will a major country ban social media?',       cat:'Politics',  yes:23,  no:77,  vol:'$560K',  volNum:560,  trades:389,  change:-2.3,  signal:'none',    closing:'11mo',tags:['Closing Soon'] },
  { id:'13', q:'Will Nvidia stock hit $200 before Q3?',        cat:'AI / Tech', yes:47,  no:53,  vol:'$1.1M',  volNum:1100, trades:820,  change:+2.6,  signal:'monitor', closing:'3mo', tags:['Rising','New'] },
  { id:'14', q:'Will there be a US recession in 2026?',        cat:'Politics',  yes:36,  no:64,  vol:'$2.9M',  volNum:2900, trades:1930, change:+1.2,  signal:'high',    closing:'7mo', tags:['High Volume'] },
  { id:'15', q:'Will Dogecoin reach $1 before 2027?',         cat:'Crypto',    yes:31,  no:69,  vol:'$780K',  volNum:780,  trades:601,  change:-3.1,  signal:'monitor', closing:'7mo', tags:['New'] },
  { id:'16', q:'Will there be a major earthquake in Japan?',   cat:'Science',   yes:62,  no:38,  vol:'$140K',  volNum:140,  trades:98,   change:+0.4,  signal:'none',    closing:'11mo',tags:[] },
  { id:'17', q:'Will Taylor Swift announce a new album?',      cat:'Other',     yes:55,  no:45,  vol:'$420K',  volNum:420,  trades:388,  change:+6.1,  signal:'monitor', closing:'11mo',tags:['Rising','Hot'] },
  { id:'18', q:'Will SpaceX land on Mars before 2030?',        cat:'Science',   yes:28,  no:72,  vol:'$310K',  volNum:310,  trades:224,  change:+0.8,  signal:'normal',  closing:'4y',  tags:['Closing Soon'] },
]

const signalDot:   Record<string,string>                           = { high:'#FF3A6E', monitor:'#F5A623', normal:'#C084FC', none:'#F1FF58' }
const signalBadge: Record<string,'red'|'amber'|'purple'|'yellow'> = { high:'red', monitor:'amber', normal:'purple', none:'yellow' }
const signalLabel: Record<string,string>                           = { high:'Mismatch', monitor:'Monitor', normal:'Aligned', none:'Stable' }

function Sparkline({ yes, change }: { yes: number; change: number }) {
  const pos = change >= 0
  const pts = Array.from({length:8},(_,i) => {
    const noise = (Math.sin(i * 1.3 + yes) * 3)
    const trend = pos ? i * 0.4 : -i * 0.4
    return Math.max(10, Math.min(90, yes + noise + trend - (pos ? 2 : -2)))
  })
  const w=60, h=24
  const min=Math.min(...pts), max=Math.max(...pts), range=max-min||1
  const svgPts = pts.map((v,i)=>`${(i/(pts.length-1))*w},${h-((v-min)/range)*h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={svgPts} fill="none" stroke={pos?'#F1FF58':'#FF3A6E'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

export default function MarketsPage() {
  const [category, setCategory]   = useState('All')
  const [filter, setFilter]       = useState('')
  const [search, setSearch]       = useState('')
  const [sort, setSort]           = useState<'vol'|'yes'|'change'|'trades'>('vol')
  const [view, setView]           = useState<'cards'|'table'>('cards')

  const filtered = ALL_MARKETS
    .filter(m => category === 'All' || m.cat === category)
    .filter(m => !filter || m.tags.includes(filter))
    .filter(m => m.q.toLowerCase().includes(search.toLowerCase()) || m.cat.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sort==='vol')    return b.volNum - a.volNum
      if (sort==='yes')    return b.yes - a.yes
      if (sort==='change') return b.change - a.change
      if (sort==='trades') return b.trades - a.trades
      return 0
    })

  const maxVol = Math.max(...filtered.map(m => m.volNum))

  return (
    <main className="page-wrapper">
      <Navbar />

      {/* Header */}
      <div className="markets-page-header">
        <div>
          <h1 className="page-title">Markets</h1>
          <p className="page-subtitle">{filtered.length} markets found</p>
        </div>
        <div className="markets-controls">
          <input className="markets-search" type="text" placeholder="Search markets…" value={search} onChange={e=>setSearch(e.target.value)} />
          <div className="markets-view-toggle">
            <button className={`view-btn${view==='cards'?' active':''}`} onClick={()=>setView('cards')}>⊞</button>
            <button className={`view-btn${view==='table'?' active':''}`} onClick={()=>setView('table')}>☰</button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`category-tab${category===cat?' active':''}`} onClick={()=>setCategory(cat)}>{cat}</button>
        ))}
      </div>

      {/* Filter chips + sort */}
      <div className="markets-toolbar">
        <div className="filter-chips">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip${filter===f?' active':''}`} onClick={()=>setFilter(filter===f?'':f)}>{f}</button>
          ))}
        </div>
        <div className="sort-wrap">
          <span className="sort-label">Sort:</span>
          {(['vol','yes','change','trades'] as const).map(s => (
            <button key={s} className={`sort-btn${sort===s?' active':''}`} onClick={()=>setSort(s)}>
              {s==='vol'?'Volume':s==='yes'?'YES %':s==='change'?'24h Δ':'Trades'}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {view === 'cards' && (
        <div className="markets-card-grid">
          {filtered.map(m => {
            const pos = m.change >= 0
            return (
              <div key={m.id} className="mkt-card glass">
                {/* Tags */}
                {m.tags.length > 0 && (
                  <div className="mkt-tags">
                    {m.tags.slice(0,2).map(t => <span key={t} className="mkt-tag">{t}</span>)}
                  </div>
                )}
                {/* Question */}
                <p className="mkt-question">{m.q}</p>
                {/* Cat + closing */}
                <div className="mkt-meta">
                  <span className="mkt-cat">{m.cat}</span>
                  <span className="mkt-closing">⏱ {m.closing}</span>
                </div>
                {/* Prob bar */}
                <div className="mkt-prob-row">
                  <span className="mkt-yes">{m.yes}%</span>
                  <div className="mkt-prob-track">
                    <div className="mkt-prob-yes" style={{width:`${m.yes}%`}}/>
                    <div className="mkt-prob-no"  style={{width:`${m.no}%`}}/>
                  </div>
                  <span className="mkt-no">{m.no}%</span>
                </div>
                {/* Bottom row */}
                <div className="mkt-bottom">
                  <div className="mkt-stats">
                    <span className="mkt-vol">{m.vol}</span>
                    <span className="mkt-trades">{m.trades.toLocaleString()} trades</span>
                    <span className="mkt-change" style={{color:pos?'#F1FF58':'#FF3A6E'}}>
                      {pos?'▲':'▼'} {Math.abs(m.change)}%
                    </span>
                  </div>
                  <Sparkline yes={m.yes} change={m.change} />
                </div>
                {/* Volume bar */}
                <div className="mkt-vol-bar">
                  <div className="mkt-vol-fill" style={{width:`${(m.volNum/maxVol)*100}%`}}/>
                </div>
                {/* Signal */}
                <div className="mkt-signal-row">
                  <span className="signal-dot" style={{background:signalDot[m.signal]}}/>
                  <Badge variant={signalBadge[m.signal]}>{signalLabel[m.signal]}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="glass markets-table-wrap">
          {filtered.length === 0
            ? <div className="markets-empty">No markets match your filters.</div>
            : (
              <table className="markets-table">
                <thead>
                  <tr>
                    <th>MARKET</th><th>CAT</th><th>YES</th><th>NO</th>
                    <th>VOLUME</th><th>TRADES</th><th>24H Δ</th><th>SIGNAL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const pos = m.change >= 0
                    return (
                      <tr key={m.id} className="market-row">
                        <td className="market-row-question">{m.q}</td>
                        <td><span className="market-row-cat">{m.cat}</span></td>
                        <td><span className="market-row-yes">{m.yes}%</span></td>
                        <td><span className="market-row-no">{m.no}%</span></td>
                        <td><span className="market-row-vol">{m.vol}</span></td>
                        <td><span className="market-row-vol">{m.trades.toLocaleString()}</span></td>
                        <td><span style={{fontSize:12,fontWeight:700,color:pos?'#F1FF58':'#FF3A6E'}}>{pos?'▲':'▼'}{Math.abs(m.change)}%</span></td>
                        <td>
                          <div className="market-row-signal">
                            <span className="signal-dot" style={{background:signalDot[m.signal]}}/>
                            <Badge variant={signalBadge[m.signal]}>{signalLabel[m.signal]}</Badge>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </main>
  )
}