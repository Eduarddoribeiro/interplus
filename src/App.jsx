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
import ContactDetails from "./admin/pages/ContactDetails";
import WaitingList from "./admin/pages/WaitingList";

import Administration from "./admin/pages/Administration";

import UnitsPage from "./admin/pages/administration/units/UnitsPage";
import LocationsPage from "./admin/pages/administration/locations/LocationsPage";
import ModalitiesPage from "./admin/pages/administration/modalities/ModalitiesPage";
import CategoriesPage from "./admin/pages/administration/categories/CategoriesPage";

import TrainingGroupsPage from "./admin/pages/administration/training-groups/TrainingGroupsPage";
import TrainingGroupForm from "./admin/pages/administration/training-groups/TrainingGroupForm";
import TrainingGroupDetails from "./admin/pages/administration/training-groups/TrainingGroupDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* SITE PÚBLICO */}

        <Route path="/" element={<Benefits />} />

        <Route
          path="/experimental"
          element={<PublicRegistration />}
        />

        {/* LOGIN */}

        <Route
          path="/admin/login"
          element={<Login />}
        />

        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="contacts"
            element={<Contacts />}
          />

          <Route
            path="contacts/:id"
            element={<ContactDetails />}
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
            path="waiting-list"
            element={<WaitingList />}
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="administration"
            element={<Administration />}
          />

          <Route
            path="administration/units"
            element={<UnitsPage />}
          />

          <Route
            path="administration/locations"
            element={<LocationsPage />}
          />

          <Route
            path="administration/modalities"
            element={<ModalitiesPage />}
          />

          <Route
            path="administration/categories"
            element={<CategoriesPage />}
          />

          <Route
            path="administration/training-groups"
            element={<TrainingGroupsPage />}
          />
          <Route
  path="administration/training-groups/new"
  element={<TrainingGroupForm />}
/>

<Route
  path="administration/training-groups/:id"
  element={<TrainingGroupDetails />}
/>
          
        </Route>

      </Routes>
    </BrowserRouter>
  );
}