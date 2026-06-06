import { useEffect, useMemo, useState } from 'react'
import { Maximize2, QrCode, RefreshCw, RotateCw, Wifi, WifiOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { ClientMessage } from '../../shared/message'
import { createRoomId } from '../../shared/message'
import { DanmakuStage } from '../components/DanmakuStage'
import type { BarrageApi } from '../lib/api'
import { mergeMessagesById } from '../lib/polling'
import { buildSendUrl, createWallHash, hasEdgeOnePreviewAccess, type LocationLike } from '../lib/routing'

const PREVIEW_LINK_STORAGE_KEY = 'barrage-preview-base-url'

type WallPageProps = {
  roomId: string
  api: Pick<BarrageApi, 'getMessages'>
  location?: LocationLike
}

function readPreviewBaseUrl() {
  return window.sessionStorage.getItem(PREVIEW_LINK_STORAGE_KEY) ?? ''
}

export function WallPage({ roomId, api, location = window.location }: WallPageProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [previewBaseUrl, setPreviewBaseUrl] = useState(readPreviewBaseUrl)
  const sendUrl = useMemo(() => buildSendUrl(location, roomId, previewBaseUrl), [location, previewBaseUrl, roomId])
  const qrReady = useMemo(() => hasEdgeOnePreviewAccess(location, previewBaseUrl), [location, previewBaseUrl])
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

  function updatePreviewBaseUrl(value: string) {
    setPreviewBaseUrl(value)
    window.sessionStorage.setItem(PREVIEW_LINK_STORAGE_KEY, value)
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
            {qrReady ? (
              <QRCodeSVG aria-label="投稿二维码" value={sendUrl} size={204} marginSize={2} role="img" />
            ) : (
              <div className="qr-waiting">
                <QrCode aria-hidden="true" size={40} />
                <strong>先粘贴 Preview 完整链接</strong>
              </div>
            )}
          </div>
          <div className="qr-copy">
            <QrCode aria-hidden="true" size={20} />
            <div>
              <strong>扫码发送弹幕</strong>
              <span>{roomId}</span>
            </div>
          </div>
          <label className="preview-link-field">
            <span>EdgeOne 预览访问链接</span>
            <input
              aria-label="EdgeOne 预览访问链接"
              onChange={(event) => updatePreviewBaseUrl(event.target.value)}
              placeholder="粘贴 Preview 完整链接"
              type="url"
              value={previewBaseUrl}
            />
          </label>
          <p>{qrReady ? sendUrl : '等待 EdgeOne 预览鉴权链接'}</p>
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
