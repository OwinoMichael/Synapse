'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import './landing.css'

/* ── Synapse Network — signature hero animation ─────────────────── */
function SynapseNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let w = 0, h = 0, dpr = 1

    interface Node { x: number; y: number; vx: number; vy: number; r: number; pulse: number; pulsing: boolean }
    let nodes: Node[] = []
    const NODE_COUNT = 22

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.scale(dpr, dpr)
    }

    function initNodes() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.8 + 1.4,
        pulse: 0,
        pulsing: false,
      }))
    }

    resize()
    initNodes()

    const handleResize = () => { resize(); initNodes() }
    window.addEventListener('resize', handleResize)

    // Randomly trigger a "signal fire" on a node
    const fireInterval = setInterval(() => {
      if (nodes.length === 0) return
      const n = nodes[Math.floor(Math.random() * nodes.length)]
      n.pulsing = true
      n.pulse = 0
    }, 1400)

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      // Update positions
      nodes.forEach(n => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
        if (n.pulsing) {
          n.pulse += 0.025
          if (n.pulse >= 1) { n.pulsing = false; n.pulse = 0 }
        }
      })

      // Draw connections
      const maxDist = Math.min(w, h) * 0.28
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.22
            const firing = a.pulsing || b.pulsing
            ctx!.strokeStyle = firing
              ? `rgba(241, 255, 88, ${opacity + 0.25})`
              : `rgba(192, 132, 252, ${opacity})`
            ctx!.lineWidth = firing ? 1.1 : 0.6
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx!.fillStyle = 'rgba(192, 132, 252, 0.55)'
        ctx!.fill()

        if (n.pulsing) {
          const ringR = n.r + n.pulse * 26
          const ringOpacity = (1 - n.pulse) * 0.7
          ctx!.beginPath()
          ctx!.arc(n.x, n.y, ringR, 0, Math.PI * 2)
          ctx!.strokeStyle = `rgba(241, 255, 88, ${ringOpacity})`
          ctx!.lineWidth = 1.5
          ctx!.stroke()

          ctx!.beginPath()
          ctx!.arc(n.x, n.y, n.r + 1.5, 0, Math.PI * 2)
          ctx!.fillStyle = 'rgba(241, 255, 88, 0.9)'
          ctx!.fill()
        }
      })

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(fireInterval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="synapse-network-canvas" />
}

/* ── Count-up number ──────────────────────────────────────────────── */
function CountUp({ end, decimals = 0, suffix = '', duration = 1800 }: { end: number; decimals?: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true)
        const startTime = performance.now()
        function tick(now: number) {
          const progress = Math.min((now - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setVal(end * eased)
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration, started])

  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>
}

/* ── Scroll reveal wrapper ────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true)
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ── Marquee data ─────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { q: 'Will the Fed cut rates in June 2026?', tag: 'MISMATCH', pct: '+35%' },
  { q: 'Will BTC reach $100k before July?',    tag: 'MONITOR',  pct: '+11%' },
  { q: 'Will OpenAI go public before 2027?',   tag: 'MISMATCH', pct: '+21%' },
  { q: 'Will GPT-5 ship before August 2026?',  tag: 'ALIGNED',  pct: '-2%'  },
  { q: 'Will the S&P 500 hit 7000 this year?', tag: 'ALIGNED',  pct: '+2%'  },
  { q: 'Will ETH flip BTC by market cap?',     tag: 'MISMATCH', pct: '+18%' },
]

/* ── Magnifier text reveal ────────────────────────────────────────── */
function MagnifierLine({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: -200, y: 0 })

  return (
    <div
      ref={ref}
      className="magnifier-line"
      onMouseMove={e => {
        const rect = ref.current!.getBoundingClientRect()
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      onMouseLeave={() => setPos({ x: -200, y: 0 })}
    >
      <span className="magnifier-base">{text}</span>
      <span
        className="magnifier-lens"
        style={{
          maskImage: `radial-gradient(circle 70px at ${pos.x}px ${pos.y}px, black 60%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 70px at ${pos.x}px ${pos.y}px, black 60%, transparent 100%)`,
        }}
      >
        {text}
      </span>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <main className="landing-root">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-glow hero-bg-glow-1" />
        <div className="hero-bg-glow hero-bg-glow-2" />
        <SynapseNetwork />

        <nav className="landing-nav">
          <span className="landing-logo">SYNAPSE</span>
          <Link href="/dashboard" className="landing-nav-cta">
            Launch dashboard <span className="arrow">→</span>
          </Link>
        </nav>

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            AI-POWERED PREDICTION MARKET INTELLIGENCE
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">Markets lie.</span>
            <span className="hero-title-line hero-title-accent">Synapse listens.</span>
          </h1>

          <p className="hero-sub">
            Real-time AI that detects when prediction market odds diverge from
            what's actually happening in the world — before the crowd catches up.
          </p>

          <div className="hero-actions">
            <Link href="/dashboard" className="btn-primary">
              <span>Launch dashboard</span>
              <span className="btn-shine" />
            </Link>
            <a href="#how" className="btn-secondary">See how it works</a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num"><CountUp end={1284} /></span>
              <span className="hero-stat-label">Markets tracked</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num accent-yellow"><CountUp end={8.3} decimals={1} suffix="%" /></span>
              <span className="hero-stat-label">Avg mismatch found</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num accent-purple"><CountUp end={24} suffix="/7" /></span>
              <span className="hero-stat-label">Live monitoring</span>
            </div>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="hero-scroll-line"><div className="hero-scroll-dot" /></div>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────── */}
      <section className="marquee-section">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className={`marquee-card marquee-${item.tag.toLowerCase()}`}>
              <span className="marquee-tag">{item.tag}</span>
              <span className="marquee-q">{item.q}</span>
              <span className="marquee-pct">{item.pct}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="how-section" id="how">
        <Reveal>
          <div className="section-header">
            <span className="section-eyebrow">THE DETECTION LOOP</span>
            <h2 className="section-title">
              <MagnifierLine text="Three signals, one verdict." />
            </h2>
          </div>
        </Reveal>

        <div className="how-grid">
          <Reveal delay={0}>
            <div className="how-card glass-card">
              <div className="how-card-glare" />
              <div className="how-icon how-icon-1">
                <svg viewBox="0 0 24 24" fill="none"><path d="M3 12h4l3 8 4-16 3 8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="how-num">01</span>
              <h3>Stream live odds</h3>
              <p>Every trade, every order book shift on Polymarket flows in over WebSocket, milliseconds after it happens.</p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="how-card glass-card">
              <div className="how-card-glare" />
              <div className="how-icon how-icon-2">
                <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <span className="how-num">02</span>
              <h3>Cross-reference reality</h3>
              <p>An AI agent scrapes breaking news and sentiment, then compares it against what the market is pricing in.</p>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="how-card glass-card">
              <div className="how-card-glare" />
              <div className="how-icon how-icon-3">
                <svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="how-num">03</span>
              <h3>Surface the gap</h3>
              <p>When odds and reality diverge, Synapse fires a signal — ranked by confidence, before the crowd corrects it.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── LIVE PREVIEW STRIP ────────────────────────────────────── */}
      <section className="preview-section">
        <Reveal>
          <div className="preview-card glass-card">
            <div className="preview-glow" />
            <div className="preview-header">
              <span className="preview-label">FED RATE CUT — JUNE 2026</span>
              <span className="preview-badge">HIGH CONFIDENCE</span>
            </div>
            <div className="preview-gauge">
              <div className="preview-gauge-row">
                <span>Market odds</span>
                <span className="preview-gauge-val accent-yellow">78%</span>
              </div>
              <div className="preview-gauge-track">
                <div className="preview-gauge-fill preview-fill-market" style={{ width: '78%' }} />
              </div>
              <div className="preview-gauge-row">
                <span>AI estimate</span>
                <span className="preview-gauge-val accent-purple">43%</span>
              </div>
              <div className="preview-gauge-track">
                <div className="preview-gauge-fill preview-fill-ai" style={{ width: '43%' }} />
              </div>
            </div>
            <p className="preview-summary">
              Market pricing a cut at 78% — but scraped Fed minutes imply only 43%.
              Possible overreaction to last week's CPI print.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-bg-glow" />
        <Reveal>
          <h2 className="cta-title">Stop trusting the crowd.<br/>Start watching the gap.</h2>
          <Link href="/dashboard" className="btn-primary btn-large">
            <span>Launch dashboard</span>
            <span className="btn-shine" />
          </Link>
        </Reveal>
      </section>

      <footer className="landing-footer">
        <span>SYNAPSE — Prediction market intelligence</span>
        <span className="footer-dot">·</span>
        <span>Built with Spring Boot, Kafka, Next.js</span>
      </footer>
    </main>
  )
}