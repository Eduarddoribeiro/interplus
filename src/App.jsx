import { Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { lazyPage } from "./helpers/lazyPage";

// Na demonstração a raiz abre direto o painel (a landing é da escola real)
const isDemo = import.meta.env.VITE_DEMO === "1";

// Cada tela é baixada só quando é aberta, para o site público
// não carregar o código do painel. Depois de um deploy, se a tela
// não existir mais, a página recarrega (ver lazyPage).

const ProtectedRoute = lazyPage(() => import("./admin/components/ProtectedRoute"));

const Benefits = lazyPage(() => import("./pages/Benefits"));
const Landing = lazyPage(() => import("./pages/Landing"));
const PublicRegistration = lazyPage(() => import("./pages/PublicRegistration"));
const CoachSession = lazyPage(() => import("./pages/CoachSession"));
const EnrollmentForm = lazyPage(() => import("./pages/EnrollmentForm"));

const Layout = lazyPage(() => import("./admin/layout/Layout"));

const Login = lazyPage(() => import("./admin/pages/Login"));
const Dashboard = lazyPage(() => import("./admin/pages/Dashboard"));
const Contacts = lazyPage(() => import("./admin/pages/Contacts"));
const Experimentals = lazyPage(() => import("./admin/pages/Experimentals"));
const FollowUps = lazyPage(() => import("./admin/pages/FollowUps"));
const Reports = lazyPage(() => import("./admin/pages/Reports"));
const ContactDetails = lazyPage(() => import("./admin/pages/ContactDetails"));
const WaitingList = lazyPage(() => import("./admin/pages/WaitingList"));
const Students = lazyPage(() => import("./admin/pages/Students"));
const StudentDetails = lazyPage(() => import("./admin/pages/StudentDetails"));
const StudentImport = lazyPage(() => import("./admin/pages/StudentImport"));
const ShirtNumbers = lazyPage(() => import("./admin/pages/ShirtNumbers"));
const Events = lazyPage(() => import("./admin/pages/Events"));
const EventDetails = lazyPage(() => import("./admin/pages/EventDetails"));

const Administration = lazyPage(() => import("./admin/pages/Administration"));

const UnitsPage = lazyPage(() => import("./admin/pages/administration/units/UnitsPage"));
const LocationsPage = lazyPage(() => import("./admin/pages/administration/locations/LocationsPage"));
const ModalitiesPage = lazyPage(() => import("./admin/pages/administration/modalities/ModalitiesPage"));
const CategoriesPage = lazyPage(() => import("./admin/pages/administration/categories/CategoriesPage"));

const TrainingGroupsPage = lazyPage(() => import("./admin/pages/administration/training-groups/TrainingGroupsPage"));
const TrainingGroupForm = lazyPage(() => import("./admin/pages/administration/training-groups/TrainingGroupForm"));
const TrainingGroupDetails = lazyPage(() => import("./admin/pages/administration/training-groups/TrainingGroupDetails"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>

          {/* SITE PÚBLICO */}

          <Route path="/" element={isDemo ? <Navigate to="/admin" replace /> : <Landing />} />

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

          {/* Famílias: ficha de matrícula (link individual, sem login) */}
          <Route
            path="/matricula/:token"
            element={<EnrollmentForm />}
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
              path="students"
              element={<Students />}
            />

            <Route
              path="students/import"
              element={<StudentImport />}
            />

            <Route
              path="students/camisas"
              element={<ShirtNumbers />}
            />

            <Route
              path="students/:id"
              element={<StudentDetails />}
            />

            <Route
              path="events"
              element={<Events />}
            />

            <Route
              path="events/:id"
              element={<EventDetails />}
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
