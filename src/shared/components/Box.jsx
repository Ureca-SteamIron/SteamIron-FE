// 와이어프레임용 공통 박스. 디자인 없음 — 검은 테두리와 배치만.
export default function Box({ children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '2px solid black',
        padding: '10px',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
