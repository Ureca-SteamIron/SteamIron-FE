// 와이어프레임용 공통 박스. 디자인 없음 — 검은 테두리와 배치만.
// noDefaultStyle을 넘기면 와이어프레임 기본 스타일(검은 테두리 등)을 끄고 className으로만 스타일링한다.
export default function Box({ children, onClick, style, className, noDefaultStyle, ...rest }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={
        noDefaultStyle
          ? style
          : {
              border: '2px solid black',
              padding: '10px',
              cursor: onClick ? 'pointer' : 'default',
              ...style,
            }
      }
      {...rest}
    >
      {children}
    </div>
  )
}