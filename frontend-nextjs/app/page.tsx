import { Navbar }      from './components/dashboard/Navbar'
import { Ticker }      from './components/ui/Ticker'
import { StatCard }    from './components/ui/StatCard'
import { PriceChart }  from './components/dashboard/PriceChart'
import { InsightFeed } from './components/dashboard/InsightFeed'
import { MarketCard }  from './components/dashboard/MarketCard'
import type { Market } from './components/dashboard/MarketCard'
import type { Insight } from './components/dashboard/InsightFeed'

const tickerItems = [
  { id: '1', text: 'Trump wins 2026 midterms — odds jumped 12% vs news sentiment' },
  { id: '2', text: 'BTC hits $100k before July — mismatch detected: low social volume' },
  { id: '3', text: 'Fed rate cut in June — market 78% YES, news implies 43%' },
]

const insights: Insight[] = [
  { id: '1', time: '2 min ago',  signal: 'high',    text: 'Fed cut odds spiked 18% — no supporting news found' },
  { id: '2', time: '11 min ago', signal: 'monitor', text: 'BTC $100k market cooling despite bullish headlines' },
  { id: '3', time: '34 min ago', signal: 'normal',  text: 'Election market stable — sentiment aligns with pricing' },
]

const markets: Market[] = [
  { id: '1', question: 'Will the Fed cut rates in June 2026?',      category: 'POLITICS · ECONOMICS', yesProb: 78, signal: { type: 'high',    text: 'AI: news implies 43% — large gap detected' } },
  { id: '2', question: 'Will BTC reach $100k before July 2026?',    category: 'CRYPTO',               yesProb: 61, signal: { type: 'monitor', text: 'AI: social volume low for stated confidence' } },
  { id: '3', question: 'Will GPT-5 release before August 2026?',    category: 'AI / TECH',            yesProb: 44, signal: { type: 'normal',  text: 'AI: sentiment aligned with market pricing' } },
  { id: '4', question: 'Will it snow in NYC this December?',        category: 'WEATHER',              yesProb: 83, signal: { type: 'none',    text: 'AI: historical data supports 83% estimate' } },
]

const chartLabels    = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00']
const marketData     = [54, 56, 55, 58, 62, 67, 65, 71, 74, 70, 76]
const sentimentData  = [50, 51, 52, 50, 53, 55, 54, 57, 58, 56, 60]

export default function DashboardPage() {
  return (
    <main className="page-wrapper">
      <Navbar />
      <Ticker items={tickerItems} />
      <div className="grid-stats">
        <StatCard label="MARKETS TRACKED"  value="1,284" sub="across 7 categories" />
        <StatCard label="ACTIVE SIGNALS"   value="14"    sub="3 high confidence"   valueColor="purple" />
        <StatCard label="AVG MISMATCH"     value="+8.3%" sub="↑ vs yesterday"      valueColor="yellow" subColor="yellow" />
        <StatCard label="VOLATILITY INDEX" value="HIGH"  sub="6 spikes in 1h"      valueColor="red"    subColor="red" />
      </div>
      <div className="grid-main">
        <PriceChart
          title="PRICE CHART — Will Trump win 2026 midterms?"
          category="POLITICS"
          labels={chartLabels}
          marketData={marketData}
          sentimentData={sentimentData}
        />
        <InsightFeed insights={insights} />
      </div>
      <div className="grid-markets">
        {markets.map((m) => <MarketCard key={m.id} market={m} />)}
      </div>
    </main>
  )
}