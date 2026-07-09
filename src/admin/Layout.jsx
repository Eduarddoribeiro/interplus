import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-100">

      <div className="flex">

        {/* Sidebar */}
        <Sidebar />

        {/* Conteúdo */}
        <main className="flex-1 min-h-screen">

          <Topbar />

          <div className="p-8 lg:p-10">
            {children}
          </div>

        </main>

      </div>

    </div>
  )
}