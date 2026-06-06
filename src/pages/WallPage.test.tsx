import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WallPage } from './WallPage'

describe('WallPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/#/wall/room-a1b2c3d4')
    window.sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('uses a pasted EdgeOne preview link when building the QR target', async () => {
    const getMessages = vi.fn().mockResolvedValue([])

    render(<WallPage roomId="room-a1b2c3d4" api={{ getMessages }} />)

    await waitFor(() => {
      expect(getMessages).toHaveBeenCalledWith('room-a1b2c3d4')
    })

    fireEvent.change(screen.getByLabelText('EdgeOne 预览访问链接'), {
      target: {
        value: 'https://barrage-wall.edgeone.cool?eo_token=abc&eo_time=4102444800',
      },
    })

    expect(
      screen.getByText('https://barrage-wall.edgeone.cool/?eo_token=abc&eo_time=4102444800#/send/room-a1b2c3d4'),
    ).toBeInTheDocument()
  })

  it('does not render a scannable QR code on EdgeOne until preview credentials are available', async () => {
    const getMessages = vi.fn().mockResolvedValue([])

    render(
      <WallPage
        roomId="room-a1b2c3d4"
        api={{ getMessages }}
        location={{
          origin: 'https://barrage-wall.edgeone.cool',
          pathname: '/',
          search: '',
        }}
      />,
    )

    await waitFor(() => {
      expect(getMessages).toHaveBeenCalledWith('room-a1b2c3d4')
    })

    expect(screen.getByText('先粘贴 Preview 完整链接')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '投稿二维码' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('EdgeOne 预览访问链接'), {
      target: {
        value: 'https://barrage-wall.edgeone.cool?eo_token=abc&eo_time=4102444800',
      },
    })

    expect(screen.getByRole('img', { name: '投稿二维码' })).toBeInTheDocument()
  })
})
