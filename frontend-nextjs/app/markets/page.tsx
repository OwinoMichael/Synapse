'use client'

import { useState, useRef } from 'react'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { Navbar } from '../components/dashboard/Navbar'

const CATEGORIES = ['All', 'Politics', 'Crypto', 'AI / Tech', 'Sports', 'Weather', 'Science', 'Other']
const SPINNABLE  = CATEGORIES.filter(c => c !== 'All')

const ALL_MARKETS = [
  { id: '1',  question: 'Will the Fed cut rates in June 2026?',           category: 'Politics',  yesProb: 78, volume: '$2.4M', signal: 'high'    },
  { id: '2',  question: 'Will BTC reach $100k before July 2026?',         category: 'Crypto',    yesProb: 61, volume: '$5.1M', signal: 'monitor' },
  { id: '3',  question: 'Will GPT-5 release before August 2026?',         category: 'AI / Tech', yesProb: 44, volume: '$890K', signal: 'normal'  },
  { id: '4',  question: 'Will it snow in NYC this December?',             category: 'Weather',   yesProb: 83, volume: '$210K', signal: 'none'    },
  { id: '5',  question: 'Will Trump approve new crypto legislation?',     category: 'Politics',  yesProb: 52, volume: '$3.7M', signal: 'monitor' },
  { id: '6',  question: 'Will ETH flip BTC by market cap in 2026?',      category: 'Crypto',    yesProb: 18, volume: '$1.2M', signal: 'high'    },
  { id: '7',  question: 'Will Apple release AR glasses in 2026?',         category: 'AI / Tech', yesProb: 34, volume: '$670K', signal: 'normal'  },
  { id: '8',  question: 'Will the S&P 500 hit 7000 by year end?',        category: 'Politics',  yesProb: 57, volume: '$4.3M', signal: 'monitor' },
  { id: '9',  question: 'Will there be a hurricane Cat 5 in 2026?',      category: 'Weather',   yesProb: 41, volume: '$330K', signal: 'none'    },
  { id: '10', question: 'Will OpenAI go public before 2027?',            category: 'AI / Tech', yesProb: 69, volume: '$1.8M', signal: 'high'    },
  { id: '11', question: 'Will Solana surpass Ethereum in daily txns?',   category: 'Crypto',    yesProb: 29, volume: '$920K', signal: 'normal'  },
  { id: '12', question: 'Will a major country ban social media in 2026?', category: 'Politics',  yesProb: 23, volume: '$560K', signal: 'none'    },
]

const signalDot:   Record<string, string>                           = { high: '#FF3A6E', monitor: '#F5A623', normal: '#C084FC', none: '#F1FF58' }
const signalLabel: Record<string, string>                           = { high: 'Mismatch', monitor: 'Monitor', normal: 'Aligned', none: 'Stable' }
const signalBadge: Record<string, 'red'|'amber'|'purple'|'yellow'> = { high: 'red', monitor: 'amber', normal: 'purple', none: 'yellow' }

function SlotHero({ onLand }: { onLand: (cat: string) => void }) {
  const [spinning, setSpinning] = useState(false)
  const [display,  setDisplay]  = useState('ALL MARKETS')
  const [landed,   setLanded]   = useState('')
  const t1 = useRef<ReturnType<typeof setInterval> | null>(null)
  const t2 = useRef<ReturnType<typeof setInterval> | null>(null)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setLanded('')

    let ticks = 0

    // Phase 1 — fast spin
    t1.current = setInterval(() => {
      setDisplay(SPINNABLE[Math.floor(Math.random() * SPINNABLE.length)])
      ticks++
      if (ticks >= 20) {
        clearInterval(t1.current!)
        ticks = 0

        // Phase 2 — slow down
        t2.current = setInterval(() => {
          setDisplay(SPINNABLE[Math.floor(Math.random() * SPINNABLE.length)])
          ticks++
          if (ticks >= 8) {
            clearInterval(t2.current!)
            const final = SPINNABLE[Math.floor(Math.random() * SPINNABLE.length)]
            setDisplay(final)
            setLanded(final)
            setSpinning(false)
            onLand(final)
          }
        }, 130)
      }
    }, 55)
  }

  const reset = () => {
    setDisplay('ALL MARKETS')
    setLanded('')
    onLand('All')
  }

  return (
    <div className="slot-hero">
      <p className="slot-hero-label">Discover a category</p>

      {/* Reel window */}
      <div className="slot-window">
        <div className={`slot-display${spinning ? ' spinning' : ''}`}>
          {display}
        </div>
        <div className="slot-mask-top" />
        <div className="slot-mask-bottom" />
      </div>

      {/* Spin button */}
      <button
        className={`slot-btn${spinning ? ' disabled' : ''}`}
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? 'Spinning…' : '🎰  Spin to Explore'}
      </button>

      {/* Status line */}
      <div className="slot-landed">
        {spinning && <span>Finding markets…</span>}
        {!spinning && landed && (
          <>
            <span>Showing <span className="slot-landed-cat">{landed}</span></span>
            <button className="slot-reset" onClick={reset}>Clear</button>
          </>
        )}
        {!spinning && !landed && <span style={{ color: '#7FA8A8' }}>Spin to filter by category</span>}
      </div>
    </div>
  )
}

export default function MarketsPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch]                 = useState('')

  const filtered = ALL_MARKETS.filter(m => {
    const matchCat    = activeCategory === 'All' || m.category === activeCategory
    const matchSearch = m.question.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <main className="page-wrapper">
      <Navbar />

      {/* Slot hero — full width, centered */}
      <SlotHero onLand={setActiveCategory} />

      {/* Search + subtitle row */}
      <div className="markets-header">
        <div>
          <h1 className="page-title">Markets Browser</h1>
          <p className="page-subtitle">
            {filtered.length} market{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' ? ` in ${activeCategory}` : ' across all categories'}
          </p>
        </div>
        <input
          className="markets-search"
          type="text"
          placeholder="Search markets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs — stay in sync with slot */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard>
        <div className="markets-table-wrap">
          {filtered.length === 0 ? (
            <div className="markets-empty">No markets match your filters.</div>
          ) : (
            <table className="markets-table">
              <thead>
                <tr>
                  <th>MARKET</th>
                  <th>CATEGORY</th>
                  <th>YES</th>
                  <th>NO</th>
                  <th>VOLUME</th>
                  <th>AI SIGNAL</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="market-row">
                    <td className="market-row-question">{m.question}</td>
                    <td><span className="market-row-cat">{m.category}</span></td>
                    <td><span className="market-row-yes">{m.yesProb}%</span></td>
                    <td><span className="market-row-no">{100 - m.yesProb}%</span></td>
                    <td><span className="market-row-vol">{m.volume}</span></td>
                    <td>
                      <div className="market-row-signal">
                        <span className="signal-dot" style={{ background: signalDot[m.signal] }} />
                        <Badge variant={signalBadge[m.signal]}>{signalLabel[m.signal]}</Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </main>
  )
}