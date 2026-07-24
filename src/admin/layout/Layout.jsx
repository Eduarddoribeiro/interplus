import Sidebar from './Sidebar'
import Topbar from './Topbar'

import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 min-h-screen bg-neutral-50">

        <Topbar />

        <main className="p-10">

          <Outlet />

        </main>

      </div>

    </div>
  )
}