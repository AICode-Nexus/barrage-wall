import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SendPage } from './SendPage'

describe('SendPage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('validates text and sends a normalized message with cooldown', async () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn().mockResolvedValue({
      id: 'message-1',
      roomId: 'room-a1b2c3d4',
      body: '现场太棒了',
      nickname: 'Ada',
      createdAt: '2026-06-05T12:00:00.000Z',
    })

    render(
      <SendPage
        roomId="room-a1b2c3d4"
        wallUrl="http://203.0.113.10:8080/#/wall/room-a1b2c3d4"
        api={{ sendMessage }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '发送弹幕' }))
    expect(screen.getByText('弹幕内容不能为空')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('昵称'), { target: { value: '  Ada  ' } })
    fireEvent.change(screen.getByLabelText('弹幕内容'), {
      target: { value: '  现场太棒了  ' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '发送弹幕' }))
      await Promise.resolve()
    })

    expect(sendMessage).toHaveBeenCalledWith('room-a1b2c3d4', {
      body: '现场太棒了',
      nickname: 'Ada',
    })
    expect(screen.getByRole('button', { name: '2 秒后可再发' })).toBeDisabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(screen.getByRole('button', { name: '发送弹幕' })).not.toBeDisabled()
  })
})
