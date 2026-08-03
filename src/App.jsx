import { BrowserRouter, Routes, Route } from "react-router-dom";

import Benefits from "./pages/Benefits";
import PublicRegistration from "./pages/PublicRegistration";

import Layout from "./admin/layout/Layout";
import ProtectedRoute from "./admin/components/ProtectedRoute";

import Login from "./admin/pages/Login";
import Dashboard from "./admin/pages/Dashboard";
import Contacts from "./admin/pages/Contacts";
import Experimentals from "./admin/pages/Experimentals";
import FollowUps from "./admin/pages/FollowUps";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";
import ContactDetails from "./admin/pages/ContactDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* SITE PÚBLICO */}

        <Route path="/" element={<Benefits />} />

        <Route path="/experimental" element={<PublicRegistration />} />

        {/* LOGIN ADMIN */}

        <Route path="/admin/login" element={<Login />} />

        {/* ADMIN PROTEGIDO */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="contacts" element={<Contacts />} />

          <Route path="contacts/:id" element={<ContactDetails />} />

          <Route path="experimentals" element={<Experimentals />} />

          <Route path="follow-ups" element={<FollowUps />} />

          <Route path="reports" element={<Reports />} />

          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
