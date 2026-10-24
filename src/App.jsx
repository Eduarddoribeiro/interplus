import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Cada tela é baixada só quando é aberta, para o site público
// não carregar o código do painel.

const ProtectedRoute = lazy(() => import("./admin/components/ProtectedRoute"));

const Benefits = lazy(() => import("./pages/Benefits"));
const Landing = lazy(() => import("./pages/Landing"));
const PublicRegistration = lazy(() => import("./pages/PublicRegistration"));
const CoachSession = lazy(() => import("./pages/CoachSession"));

const Layout = lazy(() => import("./admin/layout/Layout"));

const Login = lazy(() => import("./admin/pages/Login"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const Contacts = lazy(() => import("./admin/pages/Contacts"));
const Experimentals = lazy(() => import("./admin/pages/Experimentals"));
const FollowUps = lazy(() => import("./admin/pages/FollowUps"));
const Reports = lazy(() => import("./admin/pages/Reports"));
const ContactDetails = lazy(() => import("./admin/pages/ContactDetails"));
const WaitingList = lazy(() => import("./admin/pages/WaitingList"));

const Administration = lazy(() => import("./admin/pages/Administration"));

const UnitsPage = lazy(() => import("./admin/pages/administration/units/UnitsPage"));
const LocationsPage = lazy(() => import("./admin/pages/administration/locations/LocationsPage"));
const ModalitiesPage = lazy(() => import("./admin/pages/administration/modalities/ModalitiesPage"));
const CategoriesPage = lazy(() => import("./admin/pages/administration/categories/CategoriesPage"));

const TrainingGroupsPage = lazy(() => import("./admin/pages/administration/training-groups/TrainingGroupsPage"));
const TrainingGroupForm = lazy(() => import("./admin/pages/administration/training-groups/TrainingGroupForm"));
const TrainingGroupDetails = lazy(() => import("./admin/pages/administration/training-groups/TrainingGroupDetails"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>

          {/* SITE PÚBLICO */}

          <Route path="/" element={<Landing />} />

          {/* Clube de benefícios (ainda não lançado) */}
          <Route path="/beneficios" element={<Benefits />} />

          <Route
            path="/experimental"
            element={<PublicRegistration />}
          />

          {/* Professores: presença das experimentais (link sem login) */}
          <Route
            path="/aula/:token"
            element={<CoachSession />}
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

            <Route
              path="administration/training-groups/:id/edit"
              element={<TrainingGroupForm />}
            />
          </Route>

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
