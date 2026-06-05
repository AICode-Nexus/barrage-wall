import { useMemo, useState } from 'react'
import { MonitorUp, Send } from 'lucide-react'
import { normalizeDraft, validateDraft, type MessageDraft } from '../../shared/message'
import type { BarrageApi } from '../lib/api'

type SendPageProps = {
  roomId: string
  wallUrl: string
  api: Pick<BarrageApi, 'sendMessage'>
}

export function SendPage({ roomId, wallUrl, api }: SendPageProps) {
  const [body, setBody] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const draft = useMemo<MessageDraft>(() => ({ body, nickname }), [body, nickname])
  const sendLabel = cooldown > 0 ? `${cooldown} 秒后可再发` : sending ? '发送中' : '发送弹幕'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = validateDraft(draft)
    if (!validation.valid) {
      setError(validation.message)
      setSuccess(null)
      return
    }

    setSending(true)
    setError(null)

    try {
      await api.sendMessage(roomId, normalizeDraft(draft))
      setBody('')
      setSuccess('已上墙')
      startCooldown()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '发送失败，请稍后再试')
      setSuccess(null)
    } finally {
      setSending(false)
    }
  }

  function startCooldown() {
    setCooldown(2)
    window.setTimeout(() => setCooldown(1), 1000)
    window.setTimeout(() => setCooldown(0), 2000)
  }

  return (
    <main className="send-page">
      <section className="send-shell">
        <div className="room-chip">
          <MonitorUp aria-hidden="true" size={18} />
          <span>{roomId}</span>
        </div>
        <h1>发送弹幕</h1>
        <p className="send-subtitle">写下这一刻，发送后会直接出现在大屏幕。</p>

        <form className="send-form" onSubmit={handleSubmit}>
          <label>
            <span>昵称</span>
            <input
              aria-label="昵称"
              autoComplete="nickname"
              maxLength={16}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="可选"
              value={nickname}
            />
          </label>

          <label>
            <span>弹幕内容</span>
            <textarea
              aria-label="弹幕内容"
              maxLength={80}
              onChange={(event) => setBody(event.target.value)}
              placeholder="为现场打个 call"
              rows={5}
              value={body}
            />
          </label>

          <div className="send-meta">
            <span>{body.trim().length}/80</span>
            {error ? <strong className="error-text">{error}</strong> : null}
            {success ? <strong className="success-text">{success}</strong> : null}
          </div>

          <button className="primary-action" disabled={sending || cooldown > 0} type="submit">
            <Send aria-hidden="true" size={20} />
            {sendLabel}
          </button>
        </form>

        <a className="wall-link" href={wallUrl}>
          打开大屏页
        </a>
      </section>
    </main>
  )
}
