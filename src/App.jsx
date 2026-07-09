import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Benefits from './pages/Benefits'
import CommercialCenter from './pages/CommercialCenter'

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Benefits />}
        />

        <Route
          path="/commercial-center"
          element={<CommercialCenter />}
        />

      </Routes>

    </BrowserRouter>
  )
}