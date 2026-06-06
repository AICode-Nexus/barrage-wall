import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WallPage } from './WallPage'

describe('WallPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/#/wall/room-a1b2c3d4')
    window.sessionStorage.clear()
  })

  it('uses a pasted EdgeOne preview link when building the QR target', async () => {
    const getMessages = vi.fn().mockResolvedValue([])

    render(<WallPage roomId="room-a1b2c3d4" api={{ getMessages }} />)

    await waitFor(() => {
      expect(getMessages).toHaveBeenCalledWith('room-a1b2c3d4')
    })

    fireEvent.change(screen.getByLabelText('EdgeOne 预览访问链接'), {
      target: {
        value: 'https://barrage-wall.edgeone.cool?eo_token=abc&eo_time=1780655333',
      },
    })

    expect(
      screen.getByText('https://barrage-wall.edgeone.cool/?eo_token=abc&eo_time=1780655333#/send/room-a1b2c3d4'),
    ).toBeInTheDocument()
  })
})
