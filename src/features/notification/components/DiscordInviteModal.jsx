import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import discordQr from '../../../assets/discordQr'

const DISCORD_BOT_INVITE_URL = import.meta.env.VITE_DISCORD_BOT_INVITE_URL
  ?? 'https://discord.com/oauth2/authorize?client_id=1527166724489871420&permissions=0&integration_type=0&scope=bot'

export default function DiscordInviteModal({ onClose }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="discord-modal-backdrop" onMouseDown={onClose}>
      <section
        className="discord-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discord-modal-title"
        aria-describedby="discord-modal-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="discord-modal-close"
          aria-label="Discord 알림 안내 닫기"
          onClick={onClose}
        >
          ×
        </button>

        <div className="discord-modal-copy">
          <p className="discord-modal-kicker">DISCORD NOTIFICATION</p>
          <h2 id="discord-modal-title">Discord로 알림을 받아보세요</h2>
          <p id="discord-modal-description">
            가격 알림을 놓치지 않도록 <strong>다리미봇</strong>을 추가해 주세요.
            QR 코드를 스캔하거나 초대 링크를 열면 바로 참여할 수 있어요.
          </p>

          <a
            className="discord-modal-link"
            href={DISCORD_BOT_INVITE_URL}
            target="_blank"
            rel="noreferrer"
          >
            초대 링크 열기
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <a
          className="discord-modal-qr"
          href={DISCORD_BOT_INVITE_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Discord 다리미봇 초대 링크 열기"
        >
          <img src={discordQr} alt="Discord 다리미봇 초대 QR 코드" />
        </a>
      </section>
    </div>,
    document.body,
  )
}
