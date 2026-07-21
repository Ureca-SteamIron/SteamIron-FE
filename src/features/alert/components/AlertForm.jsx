import { useState } from 'react'
import Box from '../../../shared/components/Box'

// 알림 방식 선택 + 저장. 생성/수정 양쪽에서 재사용한다.
//  - RATE: "지정 할인율 N% 이상" → 할인율 입력. originalPrice가 있으면 목표가를 실시간 계산해 옆에 표시.
//  - ANY : "할인만 하면"        → 할인율 입력 없음.
// 저장 시 상위로 { alertType, discountRate } 를 넘긴다. (BE가 목표가로 변환해 저장)
export default function AlertForm({
  originalPrice,
  initialType = 'RATE',
  initialRate = 30,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [alertType, setAlertType] = useState(initialType)
  const [discountRate, setDiscountRate] = useState(initialRate)

  // RATE일 때 목표가 = 정가 × (100 - 할인율) / 100  (BE와 동일 공식, 화면 미리보기용)
  const computedTarget =
    alertType === 'RATE' && originalPrice
      ? Math.floor((originalPrice * (100 - Number(discountRate || 0))) / 100)
      : null

  const handleSubmit = () => {
    if (alertType === 'RATE') {
      const rate = Number(discountRate)
      if (!rate || rate < 1 || rate > 100) {
        alert('할인율은 1~100 사이로 입력해주세요.')
        return
      }
      onSubmit({ alertType: 'RATE', discountRate: rate })
    } else {
      onSubmit({ alertType: 'ANY', discountRate: null })
    }
  }

  return (
    <Box style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="radio"
            name="alertType"
            checked={alertType === 'RATE'}
            onChange={() => setAlertType('RATE')}
          />{' '}
          지정 할인율
        </label>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="radio"
            name="alertType"
            checked={alertType === 'ANY'}
            onChange={() => setAlertType('ANY')}
          />{' '}
          할인 시작하면
        </label>
      </div>

      {alertType === 'RATE' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            max="100"
            value={discountRate}
            onChange={(e) => setDiscountRate(e.target.value)}
            style={{ width: '70px' }}
          />
          <span>% 이상 할인 시</span>
          {computedTarget != null && (
            <span style={{ color: '#555' }}>→ 목표가 약 {computedTarget.toLocaleString()}원</span>
          )}
        </div>
      )}

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
