import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getPriceHistory } from '../api/gameApi'

// recordedAt(ISO) → 그래프용 숫자 x값(ms)과 라벨을 함께 만든다.
// x축을 시간(숫자)으로 두면 포인트 간격이 실제 날짜 간격을 반영한다(듬성듬성한 이벤트 데이터라 중요).
function toChartData(history) {
  return (history ?? []).map((point) => {
    const ts = new Date(point.recordedAt).getTime()
    return {
      ts,
      discountPercent: point.discountPercent ?? 0,
      price: point.price ?? 0,
    }
  })
}

const formatDate = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatFullDate = (ts) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const { ts, discountPercent, price } = payload[0].payload
  return (
    <div
      style={{
        background: '#1b1b2f',
        border: '1px solid #444',
        borderRadius: '6px',
        padding: '8px 10px',
        color: '#fff',
        fontSize: '13px',
        lineHeight: 1.5,
      }}
    >
      <div style={{ color: '#aaa' }}>{formatFullDate(ts)}</div>
      <div>
        할인율 <b style={{ color: '#d3ee3b' }}>{discountPercent}%</b>
      </div>
      <div>결제가 {price.toLocaleString()}원</div>
    </div>
  )
}

// 가격 히스토리(할인율 %) 차트. 할인율을 직선으로 연결하고, 툴팁에서 정확한 날짜·할인율·가격을 보여준다.
export default function PriceHistoryChart({ gameId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getPriceHistory(gameId)
      .then((history) => {
        if (!cancelled) setData(toChartData(history))
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [gameId])

  if (loading) return <div style={{ color: '#aaa' }}>가격 변동 불러오는 중...</div>
  if (error) return <div style={{ color: '#e66' }}>가격 변동을 불러오지 못했습니다: {error}</div>
  if (!data || data.length === 0)
    return <div style={{ color: '#aaa' }}>아직 가격 변동 기록이 없습니다.</div>

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '160px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="discountFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d3ee3b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#d3ee3b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDate}
            tick={{ fill: '#888', fontSize: 12 }}
            stroke="#444"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#888', fontSize: 12 }}
            stroke="#444"
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="linear"
            dataKey="discountPercent"
            stroke="#d3ee3b"
            strokeWidth={2}
            fill="url(#discountFill)"
            dot={{ r: 3, fill: '#1b1b2f', stroke: '#d3ee3b', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
