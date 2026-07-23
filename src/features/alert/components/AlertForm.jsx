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

  const targetActive = targetDiscountEnabled && targetPriceAvailable

  return (
    <Box
      noDefaultStyle
      className="mt-2.5 flex flex-col gap-3.5 p-4 rounded-xl border border-[#2c2c33] bg-[#1b1b1f]"
    >
      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#e8e8ea]">
        <input
          type="checkbox"
          checked={discountStartEnabled}
          onChange={(event) => setDiscountStartEnabled(event.target.checked)}
          className="accent-green-400 w-4 h-4 cursor-pointer"
        />
        할인 시작하면 알림
      </label>

      <div className="border-t border-[#2c2c33]" />

      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#e8e8ea]">
        <input
          type="checkbox"
          checked={targetDiscountEnabled}
          disabled={!targetPriceAvailable}
          onChange={(event) => setTargetDiscountEnabled(event.target.checked)}
          className="accent-green-400 w-4 h-4 cursor-pointer disabled:cursor-default disabled:opacity-40"
        />
        지정 할인율 알림
      </label>

      {!targetPriceAvailable && (
        <div className="text-[#7a7a82] text-sm">
          무료 게임은 기준 가격이 없어 지정 할인율 목표가를 계산할 수 없습니다.
        </div>
      )}

      <div className={targetActive ? 'opacity-100' : 'opacity-45'}>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <input
            type="number"
            min="0"
            max="100"
            value={discountRate}
            disabled={!targetActive}
            onChange={(event) => handleRateChange(event.target.value)}
            className="w-[70px] bg-[#26262c] text-[#e8e8ea] text-sm rounded-lg border border-[#2c2c33] px-2.5 py-1.5 outline-none focus:border-[#4a4a52] disabled:cursor-default"
          />
          <span className="text-[#e8e8ea]">% 이상 할인 시</span>
          {computedTarget != null && (
            <span className="text-[#9a9aa2]">→ 목표가 약 {computedTarget.toLocaleString()}원</span>
          )}
        </div>

        <div className="mt-3 px-1">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Number(discountRate || 0)}
            disabled={!targetActive}
            onChange={(event) => handleRateChange(event.target.value)}
            aria-label="지정 할인율"
            className={`w-full accent-green-400 ${targetActive ? 'cursor-pointer' : 'cursor-default'}`}
          />
          <div className="flex justify-between text-[#7a7a82] text-xs mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div
          onClick={submitting ? undefined : handleSubmit}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
            submitting
              ? 'cursor-default opacity-50 text-[#0e0e10] bg-green-400'
              : 'cursor-pointer text-[#0e0e10] bg-green-400 hover:bg-green-300'
          }`}
        >
          {submitting ? '저장 중...' : '저장'}
        </div>
        {onCancel && (
          <div
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-[#e8e8ea] border border-[#2c2c33] bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#22222a] hover:border-[#3a3a42]"
          >
            취소
          </div>
        )}
      </div>
    </Box>
  )
}