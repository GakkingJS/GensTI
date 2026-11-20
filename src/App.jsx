import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";


import "./App.css";


import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HomeBanners from "./components/HomeBanners";
import AboutGensti from "./components/AboutGensti";
import SystemsEngineering from "./components/SystemsEngineering";
import EnrollmentCTA from "./components/EnrollmentCTA";
import News from "./components/News";
import Events from "./components/Events";
import CommunityHighlights from "./components/CommunityHighlights";
import Resources from "./components/Resources";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";


import ProtectedRoute from "./components/ProtectedRoute";
import MotionProvider from "./components/MotionProvider";


import { AuthProvider } from "./context/AuthContext";


/* ==========================================
   PÁGINAS PÚBLICAS Y AUTENTICACIÓN
========================================== */


const EventsPage = lazy(
  () => import("./pages/EventsPage")
);


const NewsPage = lazy(
  () => import("./pages/NewsPage")
);


const NewsDetailPage = lazy(
  () => import("./pages/NewsDetailPage")
);


const AcademicPage = lazy(
  () => import("./pages/AcademicPage")
);


const AcademicDetailPage = lazy(
  () => import("./pages/AcademicDetailPage")
);


const ResourcesPage = lazy(
  () => import("./pages/ResourcesPage")
);


const ResourceDetailPage = lazy(
  () => import("./pages/ResourceDetailPage")
);


const VerifyEmailPage = lazy(
  () => import("./pages/VerifyEmailPage")
);


const Login = lazy(
  () => import("./pages/Login")
);


const RegisterPage = lazy(
  () => import("./pages/RegisterPage")
);


const ForgotPasswordPage = lazy(
  () => import("./pages/ForgotPasswordPage")
);


const ResetPasswordPage = lazy(
  () => import("./pages/ResetPasswordPage")
);


const BOTGPage = lazy(
  () => import("./pages/BOTGPage")
);


const DirectorioPage = lazy(
  () => import("./pages/DirectorioPage")
);


const ParchePage = lazy(
  () => import("./pages/ParchePage")
);


const PqrsPage = lazy(
  () => import("./pages/PqrsPage")
);


const CommunityPostsPage = lazy(
  () => import("./pages/CommunityPostsPage")
);


/* ==========================================
   PÁGINAS DE GESTIÓN
========================================== */


const AdminPage = lazy(
  () => import("./pages/AdminPage")
);


const AdminUsuariosPage = lazy(
  () => import("./pages/AdminUsuariosPage")
);


const NewsFormPage = lazy(
  () => import("./pages/NewsFormPage")
);


const EventsAdminPage = lazy(
  () => import("./pages/EventsAdminPage")
);


const CalendarAdminPage = lazy(
  () => import("./pages/CalendarAdminPage")
);


const PqrsAdminPage = lazy(
  () => import("./pages/PqrsAdminPage")
);


const AdminCommunityPostsPage = lazy(
  () => import("./pages/AdminCommunityPostsPage")
);


const TbogAdminPage = lazy(
  () => import("./pages/TbogAdminPage")
);


const CommunityHighlightsAdminPage = lazy(
  () => import("./pages/CommunityHighlightsAdminPage")
);


/* ==========================================
   PERMISOS DE ACCESO AL PANEL
========================================== */


const MANAGEMENT_PERMISSIONS = [
  "news.create",
  "events.create",
  "calendar.manage",
  "community_posts.create",
  "community_posts.moderate",
  "pqr.manage",
  "users.manage",
  "tbog.manage",
  "community_highlights.manage",
];


/* ==========================================
   ESTADO DE CARGA
========================================== */


function PageLoading() {
  return (
    <div
      className="page-loading"
      role="status"
      aria-live="polite"
    >
      <span>Cargando...</span>
    </div>
  );
}


/* ==========================================
   INICIO
========================================== */


function Home() {
  return (
    <>
      <Hero />
      <HomeBanners />
      <AboutGensti />
      <SystemsEngineering />
      <EnrollmentCTA />
      <News />
      <Events />
      <CommunityHighlights />
      <Resources />
    </>
  );
}


/* ==========================================
   LAYOUT PRINCIPAL
========================================== */


function MainLayout() {
  return (
    <>
      <Navbar />


      <main>
        <Routes>
          {/* PÁGINAS PÚBLICAS */}


          <Route
            path="/"
            element={<Home />}
          />


          <Route
            path="/directorio"
            element={<DirectorioPage />}
          />


          <Route
            path="/eventos"
            element={<EventsPage />}
          />


          <Route
            path="/botg"
            element={<BOTGPage />}
          />


          <Route
            path="/academico"
            element={<AcademicPage />}
          />


          <Route
            path="/parche"
            element={<ParchePage />}
          />


          {/* NOTICIAS */}


          <Route
            path="/noticias"
            element={
              <ProtectedRoute
                permission="news.view"
              >
                <NewsPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/noticias/:id"
            element={
              <ProtectedRoute
                permission="news.view"
              >
                <NewsDetailPage />
              </ProtectedRoute>
            }
          />


          {/* CONTENIDO PARA ESTUDIANTES */}


          <Route
            path="/academico/:id"
            element={
              <ProtectedRoute role="student">
                <AcademicDetailPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/recursos"
            element={
              <ProtectedRoute role="student">
                <ResourcesPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/recursos/:id"
            element={
              <ProtectedRoute role="student">
                <ResourceDetailPage />
              </ProtectedRoute>
            }
          />


          {/* PQRS */}


          <Route
            path="/pqrs"
            element={
              <ProtectedRoute
                permission="pqr.create"
              >
                <PqrsPage />
              </ProtectedRoute>
            }
          />


          {/* COMUNIDAD */}


          <Route
            path="/comunidad/publicaciones"
            element={
              <ProtectedRoute
                permission="community_posts.create"
              >
                <CommunityPostsPage />
              </ProtectedRoute>
            }
          />


          {/* PANEL DE GESTIÓN */}


          <Route
            path="/admin"
            element={
              <ProtectedRoute
                anyPermissions={
                  MANAGEMENT_PERMISSIONS
                }
              >
                <AdminPage />
              </ProtectedRoute>
            }
          />


          {/* GESTIÓN DE NOTICIAS */}


          <Route
            path="/admin/noticias/crear"
            element={
              <ProtectedRoute
                permission="news.create"
              >
                <NewsFormPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/noticias/:newsId/editar"
            element={
              <ProtectedRoute
                permission="news.edit"
              >
                <NewsFormPage />
              </ProtectedRoute>
            }
          />


          {/* GESTIÓN DE EVENTOS */}


          <Route
            path="/admin/eventos"
            element={
              <ProtectedRoute
                anyPermissions={[
                  "events.manage",
                  "events.create",
                  "events.edit",
                ]}
              >
                <EventsAdminPage />
              </ProtectedRoute>
            }
          />


          {/* CALENDARIO ACADÉMICO */}


          <Route
            path="/admin/calendario"
            element={
              <ProtectedRoute
                permission="calendar.manage"
              >
                <CalendarAdminPage />
              </ProtectedRoute>
            }
          />


          {/* MODERACIÓN DE PUBLICACIONES */}


          <Route
            path="/admin/comunidad/publicaciones"
            element={
              <ProtectedRoute
                permission="community_posts.moderate"
              >
                <AdminCommunityPostsPage />
              </ProtectedRoute>
            }
          />


          {/* GESTIÓN DE PQRS */}


          <Route
            path="/admin/pqrs"
            element={
              <ProtectedRoute
                permission="pqr.manage"
              >
                <PqrsAdminPage />
              </ProtectedRoute>
            }
          />


          {/* USUARIOS Y ROLES */}


          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute
                permission="users.manage"
              >
                <AdminUsuariosPage />
              </ProtectedRoute>
            }
          />


          {/* GESTIÓN DE TBOG */}


          <Route
            path="/admin/tbog"
            element={
              <ProtectedRoute
                permission="tbog.manage"
              >
                <TbogAdminPage />
              </ProtectedRoute>
            }
          />


          {/* FOTOS DE LA COMUNIDAD */}


          <Route
            path="/admin/fotos-comunidad"
            element={
              <ProtectedRoute
                permission="community_highlights.manage"
              >
                <CommunityHighlightsAdminPage />
              </ProtectedRoute>
            }
          />


          {/* RUTA NO ENCONTRADA */}


          <Route
            path="*"
            element={
              <section className="page-loading">
                <div>
                  <h1>Página no encontrada</h1>


                  <p>
                    La dirección solicitada no existe
                    en GENSTI.
                  </p>
                </div>
              </section>
            }
          />
        </Routes>
      </main>


      <Footer />


      <Chatbot />
    </>
  );
}


/* ==========================================
   APLICACIÓN
========================================== */


function App() {
  return (
    <AuthProvider>
      <MotionProvider>
        <div className="app">
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route
                path="/login"
                element={<Login />}
              />


              <Route
                path="/registro"
                element={<RegisterPage />}
              />


              <Route
                path="/verificar-correo"
                element={<VerifyEmailPage />}
              />


              <Route
                path="/olvide-contrasena"
                element={<ForgotPasswordPage />}
              />


              <Route
                path="/restablecer-contrasena"
                element={<ResetPasswordPage />}
              />


              <Route
                path="/*"
                element={<MainLayout />}
              />
            </Routes>
          </Suspense>
        </div>
      </MotionProvider>
    </AuthProvider>
  );
}


export default App;