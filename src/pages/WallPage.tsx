import { useEffect, useMemo, useState } from 'react'
import { Maximize2, QrCode, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { ClientMessage } from '../../shared/message'
import { createRoomId } from '../../shared/message'
import { DanmakuStage } from '../components/DanmakuStage'
import type { BarrageApi } from '../lib/api'
import { buildSendUrl, createWallHash } from '../lib/routing'
import { connectRoom } from '../lib/realtime'

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

    api
      .getMessages(roomId)
      .then((nextMessages) => {
        if (mounted) {
          setMessages(nextMessages)
          setLoadError(null)
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadError('历史弹幕加载失败，新的弹幕仍会继续显示')
        }
      })

    const disconnect = connectRoom(roomId, {
      onStatus: setStatus,
      onMessage: (message) => {
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) {
            return current
          }

          return [...current, message].slice(-140)
        })
      },
    })

    return () => {
      mounted = false
      disconnect()
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
            {status === 'connected' ? '实时连接中' : status === 'connecting' ? '正在连接' : '连接已断开'}
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
            <Maximize2 aria-hidden="true" size={18} />
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
