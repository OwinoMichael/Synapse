'use client'

import { useEffect, useRef } from 'react'
import { GlassCard } from '../ui/GlassCard'
import { colors, chartGridStyle, chartTickStyle, font } from '@/lib/tokens'

interface PriceChartProps {
  title: string
  category: string
  labels: string[]
  marketData: number[]
  sentimentData: number[]
}

export function PriceChart({
  title,
  category,
  labels,
  marketData,
  sentimentData,
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  useEffect(() => {
    let Chart: typeof import('chart.js').Chart
    import('chart.js/auto').then((mod) => {
      Chart = mod.default

      if (!canvasRef.current) return
      if (chartRef.current) (chartRef.current as InstanceType<typeof Chart>).destroy()

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Market odds',
              data: marketData,
              borderColor: colors.yellow,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4,
              fill: false,
            },
            {
              label: 'AI sentiment',
              data: sentimentData,
              borderColor: colors.purple,
              borderWidth: 1.5,
              borderDash: [4, 3],
              pointRadius: 0,
              tension: 0.4,
              fill: false,
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
              titleFont: { family: font.mono, size: 10 },
              bodyFont: { family: font.mono, size: 11 },
            },
          },
          scales: {
            x: {
              grid: chartGridStyle,
              ticks: { ...chartTickStyle, maxRotation: 0 },
              border: { display: false },
            },
            y: {
              grid: chartGridStyle,
              ticks: {
                ...chartTickStyle,
                callback: (v) => `${v}%`,
              },
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
    <GlassCard className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p
          className="font-mono text-[10px] tracking-widest"
          style={{ color: 'var(--text-dim)' }}
        >
          {title}
        </p>
        <span className="badge badge-yellow">{category}</span>
      </div>

      <div style={{ height: 180 }}>
        <canvas ref={canvasRef} />
      </div>

      <div className="flex gap-5">
        <div className="flex items-center gap-2">
          <div style={{ width: 20, height: 2, background: colors.yellow }} />
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
            Market odds
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 20,
              height: 0,
              border: `1px dashed ${colors.purple}`,
            }}
          />
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
            AI sentiment
          </span>
        </div>
      </div>
    </GlassCard>
  )
}