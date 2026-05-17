import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { Navbar } from '../components/dashboard/Navbar'

const categories = ['All', 'Politics', 'Crypto', 'AI / Tech', 'Sports', 'Weather', 'Science', 'Other']

const markets = [
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

const signalDot:   Record<string, string>                       = { high: '#FF3A6E', monitor: '#F5A623', normal: '#C084FC', none: '#F1FF58' }
const signalLabel: Record<string, string>                       = { high: 'Mismatch', monitor: 'Monitor', normal: 'Aligned', none: 'Stable' }
const signalBadge: Record<string, 'red'|'amber'|'purple'|'yellow'> = { high: 'red', monitor: 'amber', normal: 'purple', none: 'yellow' }

export default function MarketsPage() {
  return (
    <main className="page-wrapper">
      <Navbar />

      <div className="markets-header">
        <div>
          <h1 className="page-title">Markets Browser</h1>
          <p className="page-subtitle">1,284 active markets across 7 categories</p>
        </div>
        <input className="markets-search" type="text" placeholder="Search markets..." />
      </div>

      <div className="category-tabs">
        {categories.map((cat, i) => (
          <button key={cat} className={`category-tab${i === 0 ? ' active' : ''}`}>{cat}</button>
        ))}
      </div>

      <GlassCard>
        <div className="markets-table-wrap">
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
              {markets.map((m) => (
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
        </div>
      </GlassCard>
    </main>
  )
}