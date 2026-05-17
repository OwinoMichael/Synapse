'use client'

import { useEffect, useRef } from 'react'
import { GlassCard } from '../ui/GlassCard'
import { colors, font } from '@/lib/tokens'

interface PriceChartProps {
  title: string
  category: string
  labels: string[]
  marketData: number[]
  sentimentData: number[]
}

export function PriceChart({ title, category, labels, marketData, sentimentData }: PriceChartProps) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<unknown>(null)

  useEffect(() => {
    import('chart.js/auto').then((mod) => {
      const Chart = mod.default
      if (!canvasRef.current || !wrapRef.current) return
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Market',
              data: marketData,
              borderColor: colors.yellow,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4,
              fill: false,
            },
            {
              label: 'AI',
              data: sentimentData,
              borderColor: colors.purple,
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.4,
              fill: false,
              borderDash: [4, 3],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.bgSurface,
              titleColor: colors.textSecondary,
              bodyColor: colors.yellow,
              borderColor: colors.borderSubtle,
              borderWidth: 0.5,
              padding: 10,
              titleFont: { family: font.mono, size: 11 },
              bodyFont:  { family: font.mono, size: 12 },
            },
          },
          scales: {
            x: {
              grid:   { color: 'rgba(65,104,88,0.25)' },
              ticks:  { color: colors.textDim, font: { family: font.mono, size: 10 }, maxRotation: 0 },
              border: { display: false },
            },
            y: {
              grid:   { color: 'rgba(65,104,88,0.25)' },
              ticks:  { color: colors.textDim, font: { family: font.mono, size: 10 }, callback: (v) => `${v}%` },
              border: { display: false },
            },
          },
        },
      })
    })

    return () => {
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
    }
  }, [labels, marketData, sentimentData])

  return (
    <GlassCard>
      <div className="chart-card">
        <div className="chart-header">
          <p className="chart-title">{title}</p>
          <span className="badge badge-yellow">{category}</span>
        </div>

        {/* 
          The wrapper must be a block with an explicit height.
          width:100% + min-width:0 makes it shrink with the grid column. 
        */}
        <div
          ref={wrapRef}
          className="chart-canvas-wrap"
          style={{ position: 'relative', height: 180, width: '100%', minWidth: 0 }}
        >
          <canvas ref={canvasRef} />
        </div>

        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="legend-line" style={{ background: colors.yellow }} />
            Market odds
          </div>
          <div className="chart-legend-item">
            <div className="legend-line-dashed" />
            AI sentiment
          </div>
        </div>
      </div>
    </GlassCard>
  )
}