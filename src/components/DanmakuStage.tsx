import type { ClientMessage } from '../../shared/message'

const ACTIVE_LIMIT = 18
const TRACKS = 6

type DanmakuStageProps = {
  messages: ClientMessage[]
}

export function DanmakuStage({ messages }: DanmakuStageProps) {
  const visibleMessages = messages.slice(-ACTIVE_LIMIT)

  return (
    <div className="danmaku-stage" aria-label="实时弹幕舞台">
      {visibleMessages.map((message, index) => (
        <div
          className="danmaku-item"
          data-testid="danmaku-item"
          key={message.id}
          style={
            {
              '--track': index % TRACKS,
              '--duration': `${16 + (index % 5) * 2}s`,
              '--delay': `${(index % 6) * -1.4}s`,
            } as React.CSSProperties
          }
        >
          {message.nickname ? <span className="danmaku-name">{message.nickname}</span> : null}
          <span>{message.body}</span>
        </div>
      ))}
    </div>
  )
}
