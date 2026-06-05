import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DanmakuStage } from './DanmakuStage'

describe('DanmakuStage', () => {
  it('limits active flying messages so the screen stays readable', () => {
    const messages = Array.from({ length: 25 }, (_, index) => ({
      id: `message-${index}`,
      roomId: 'room-a1b2c3d4',
      body: `第 ${index} 条弹幕`,
      nickname: index % 2 === 0 ? '观众' : null,
      createdAt: new Date(2026, 5, 5, 12, 0, index).toISOString(),
    }))

    render(<DanmakuStage messages={messages} />)

    expect(screen.getAllByTestId('danmaku-item')).toHaveLength(18)
    expect(screen.getByText('第 24 条弹幕')).toBeInTheDocument()
    expect(screen.queryByText('第 0 条弹幕')).not.toBeInTheDocument()
  })
})
