import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Benefits from './pages/Benefits'

import Layout from './admin/layout/Layout'

import Dashboard from './admin/pages/Dashboard'
import Leads from './admin/pages/Leads'
import Experimentals from './admin/pages/Experimentals'
import FollowUps from './admin/pages/FollowUps'
import Reports from './admin/pages/Reports'
import Settings from './admin/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Site */}

        <Route
          path="/"
          element={<Benefits />}
        />

        {/* CRM */}

        <Route
          path="/admin"
          element={<Layout />}
        >

          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="leads"
            element={<Leads />}
          />

          <Route
            path="experimentals"
            element={<Experimentals />}
          />

          <Route
            path="follow-ups"
            element={<FollowUps />}
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  )
}