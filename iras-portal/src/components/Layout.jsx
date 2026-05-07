import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-iras-gray">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6">
        <Outlet />
      </main>
      <footer className="bg-navy text-gray-300 text-xs text-center py-4 mt-auto">
        © 2025 Inland Revenue Authority of Singapore. All rights reserved.
      </footer>
    </div>
  )
}
