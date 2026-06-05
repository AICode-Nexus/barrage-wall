import { useEffect, useMemo, useState } from 'react'
import { createRoomId } from '../shared/message'
import './App.css'
import { api } from './lib/api'
import { createWallHash, parseHashRoute } from './lib/routing'
import { SendPage } from './pages/SendPage'
import { WallPage } from './pages/WallPage'

function App() {
  const [hash, setHash] = useState(window.location.hash)
  const route = useMemo(() => parseHashRoute(hash), [hash])

  useEffect(() => {
    function handleHashChange() {
      setHash(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (route.view === 'home') {
      window.location.hash = createWallHash(createRoomId())
    }
  }, [route.view])

  if (route.view === 'wall') {
    return <WallPage api={api} roomId={route.roomId} />
  }

  if (route.view === 'send') {
    return (
      <SendPage
        api={api}
        roomId={route.roomId}
        wallUrl={`${window.location.origin}${window.location.pathname}${window.location.search}${createWallHash(route.roomId)}`}
      />
    )
  }

  if (route.view === 'not-found') {
    return (
      <main className="not-found">
        <h1>房间链接不可用</h1>
        <a href={createWallHash(createRoomId())}>新建房间</a>
      </main>
    )
  }

  return (
    <main className="boot-screen">
      <p>正在创建房间...</p>
    </main>
  )
}

export default App
