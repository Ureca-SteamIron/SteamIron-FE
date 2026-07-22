import { useState } from 'react'
import Box from '../../../shared/components/Box'

// 서로 독립적인 할인 시작/지정 할인율 알림 설정. 두 기능을 동시에 선택할 수 있다.
// 지정 할인율은 숫자 입력과 슬라이더가 같은 상태를 공유하고 목표가를 실시간 계산한다.
export default function AlertForm({
  originalPrice,
  initialDiscountStartEnabled = false,
  initialTargetDiscountEnabled = true,
  initialRate = 30,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const targetPriceAvailable = originalPrice != null && Number(originalPrice) > 0
  const [discountStartEnabled, setDiscountStartEnabled] = useState(initialDiscountStartEnabled)
  const [targetDiscountEnabled, setTargetDiscountEnabled] = useState(
    initialTargetDiscountEnabled && targetPriceAvailable,
  )
  const [discountRate, setDiscountRate] = useState(initialRate)

  // 목표가 = 정가 × (100 - 할인율) / 100 (BE와 동일 공식, 화면 미리보기용)
  const computedTarget =
    targetDiscountEnabled && targetPriceAvailable
      ? Math.floor((originalPrice * (100 - Number(discountRate || 0))) / 100)
      : null

  const handleRateChange = (value) => {
    const numericRate = Number(value)
    setDiscountRate(Math.min(100, Math.max(0, numericRate)))
  }

  const handleSubmit = () => {
    if (!discountStartEnabled && !targetDiscountEnabled) {
      alert('할인 시작 알림 또는 지정 할인율 알림 중 하나 이상을 선택해주세요.')
      return
    }

    if (targetDiscountEnabled) {
      const rate = Number(discountRate)
      if (!rate || rate < 1 || rate > 100) {
        alert('할인율은 1~100 사이로 입력해주세요.')
        return
      }
    }

    onSubmit({
      discountStartEnabled,
      targetDiscountEnabled,
      discountRate: targetDiscountEnabled ? Number(discountRate) : null,
    })
  }

  return (
    <Box style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={discountStartEnabled}
          onChange={(event) => setDiscountStartEnabled(event.target.checked)}
        />
        할인 시작하면 알림
      </label>

      <div style={{ borderTop: '1px solid #555' }} />

      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={targetDiscountEnabled}
          disabled={!targetPriceAvailable}
          onChange={(event) => setTargetDiscountEnabled(event.target.checked)}
        />
        지정 할인율 알림
      </label>

      {!targetPriceAvailable && (
        <div style={{ color: '#777', fontSize: '14px' }}>
          무료 게임은 기준 가격이 없어 지정 할인율 목표가를 계산할 수 없습니다.
        </div>
      )}

      <div style={{ opacity: targetDiscountEnabled && targetPriceAvailable ? 1 : 0.45 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="number"
            min="0"
            max="100"
            value={discountRate}
            disabled={!targetDiscountEnabled || !targetPriceAvailable}
            onChange={(event) => handleRateChange(event.target.value)}
            style={{ width: '70px' }}
          />
          <span>% 이상 할인 시</span>
          {computedTarget != null && (
            <span style={{ color: '#777' }}>→ 목표가 약 {computedTarget.toLocaleString()}원</span>
          )}
        </div>

        <div style={{ marginTop: '12px', padding: '0 4px' }}>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Number(discountRate || 0)}
            disabled={!targetDiscountEnabled || !targetPriceAvailable}
            onChange={(event) => handleRateChange(event.target.value)}
            aria-label="지정 할인율"
            style={{
              width: '100%',
              accentColor: '#aaa',
              cursor: targetDiscountEnabled && targetPriceAvailable ? 'pointer' : 'default',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#777', fontSize: '13px' }}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Box onClick={submitting ? undefined : handleSubmit} style={{ cursor: 'pointer' }}>
          {submitting ? '저장 중...' : '저장'}
        </Box>
        {onCancel && (
          <Box onClick={onCancel} style={{ cursor: 'pointer' }}>
            취소
          </Box>
        )}
      </div>
    </Box>
  )
}
