import { useEffect, useMemo, useState } from 'react'
import { Maximize2, QrCode, RefreshCw, RotateCw, Wifi, WifiOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { ClientMessage } from '../../shared/message'
import { createRoomId } from '../../shared/message'
import { DanmakuStage } from '../components/DanmakuStage'
import type { BarrageApi } from '../lib/api'
import { mergeMessagesById } from '../lib/polling'
import { buildSendUrl, createWallHash } from '../lib/routing'

type WallPageProps = {
  roomId: string
  api: Pick<BarrageApi, 'getMessages'>
}

export function WallPage({ roomId, api }: WallPageProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [loadError, setLoadError] = useState<string | null>(null)
  const sendUrl = useMemo(() => buildSendUrl(window.location, roomId), [roomId])
  const latestMessages = messages.slice(-6).reverse()

  useEffect(() => {
    let mounted = true

    async function pollMessages() {
      try {
        const nextMessages = await api.getMessages(roomId)
        if (mounted) {
          setMessages((current) => mergeMessagesById(current, nextMessages, 140))
          setLoadError(null)
          setStatus('connected')
        }
      } catch {
        if (mounted) {
          setLoadError('弹幕同步失败，正在重试')
          setStatus('disconnected')
        }
      }
    }

    void pollMessages()
    const intervalId = window.setInterval(pollMessages, 1000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [api, roomId])

  function createNextRoom() {
    window.location.hash = createWallHash(createRoomId())
  }

  return (
    <main className="wall-page">
      <section className="wall-stage">
        <div className="wall-background" aria-hidden="true" />
        <header className="wall-topbar">
          <div>
            <span className="eyebrow">Barrage Wall</span>
            <h1>实时弹幕上墙</h1>
          </div>
          <div className={`connection-pill ${status}`}>
            {status === 'connected' ? <Wifi aria-hidden="true" size={18} /> : <WifiOff aria-hidden="true" size={18} />}
            {status === 'connected' ? '每秒同步中' : status === 'connecting' ? '正在同步' : '同步重试中'}
          </div>
        </header>

        <DanmakuStage messages={messages} />

        <aside className="qr-panel" aria-label="扫码发送弹幕">
          <div className="qr-box">
            <QRCodeSVG value={sendUrl} size={204} marginSize={2} />
          </div>
          <div className="qr-copy">
            <QrCode aria-hidden="true" size={20} />
            <div>
              <strong>扫码发送弹幕</strong>
              <span>{roomId}</span>
            </div>
          </div>
          <p>{sendUrl}</p>
        </aside>

        <footer className="wall-footer">
          <button type="button" className="ghost-action" onClick={createNextRoom}>
            <RefreshCw aria-hidden="true" size={18} />
            新建房间
          </button>
          <div className="message-count">
            {status === 'connected' ? <Maximize2 aria-hidden="true" size={18} /> : <RotateCw aria-hidden="true" size={18} />}
            <span>{messages.length} 条弹幕</span>
          </div>
        </footer>
      </section>

      <section className="latest-panel" aria-label="最近弹幕">
        <h2>最近弹幕</h2>
        {loadError ? <p className="error-text">{loadError}</p> : null}
        <ul>
          {latestMessages.map((message) => (
            <li key={message.id}>
              <span>{message.nickname ?? '匿名'}</span>
              <strong>{message.body}</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
