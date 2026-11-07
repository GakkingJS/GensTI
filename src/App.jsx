import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";


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
import PqrsPage from "./pages/PqrsPage";
import Footer from "./components/Footer";


import ProtectedRoute from "./components/ProtectedRoute";
import PqrsAdminPage from "./pages/PqrsAdminPage";


import MotionProvider from "./components/MotionProvider";
import { AuthProvider } from "./context/AuthContext";


import CommunityPostsPage from "./pages/CommunityPostsPage";
import AdminCommunityPostsPage from "./pages/AdminCommunityPostsPage"
import ParchePage from "./pages/ParchePage";;


import Chatbot from "./components/Chatbot";




const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventsAdminPage = lazy(() => import("./pages/EventsAdminPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const AcademicPage = lazy(() => import("./pages/AcademicPage"));
const AcademicDetailPage = lazy(() => import("./pages/AcademicDetailPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const ResourceDetailPage = lazy(() => import("./pages/ResourceDetailPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const Login = lazy(() => import("./pages/Login"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const BOTGPage = lazy(() => import("./pages/BOTGPage"));


const AdminPage = lazy(() => import("./pages/AdminPage"));
const NewsFormPage = lazy(() => import("./pages/NewsFormPage"));


const DirectorioPage = lazy(() => import("./pages/DirectorioPage"));


const CalendarAdminPage = lazy(() => import("./pages/CalendarAdminPage"));


function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span>Cargando...</span>
    </div>
  );
}


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


function MainLayout() {
  return (
    <>
      <Navbar />


      <main>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute permission="users.manage">
                <AdminPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/noticias/crear"
            element={
              <ProtectedRoute permission="news.create">
                <NewsFormPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/calendario"
            element={
              <ProtectedRoute permission="calendar.manage">
                <CalendarAdminPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/eventos"
            element={
              <ProtectedRoute permission="events.manage">
                <EventsAdminPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/noticias/:newsId/editar"
            element={
              <ProtectedRoute permission="news.edit">
                <NewsFormPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/pqrs"
            element={
              <ProtectedRoute permission="pqr.manage">
                <PqrsAdminPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/comunidad/publicaciones"
            element={<CommunityPostsPage />}
          />


          <Route
            path="/admin/comunidad/publicaciones"
            element={<AdminCommunityPostsPage />}
          />


          <Route path="/" element={<Home />} />


          <Route
            path="/directorio"
            element={<DirectorioPage />}
          />


          <Route path="/eventos" element={<EventsPage />} />


          <Route path="/botg" element={<BOTGPage />} />


          <Route
            path="/noticias"
            element={
              <ProtectedRoute permission="news.view">
                <NewsPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/noticias/:id"
            element={
              <ProtectedRoute permission="news.view">
                <NewsDetailPage />
              </ProtectedRoute>
            }
          />


          <Route path="/academico" element={<AcademicPage />} />


          <Route
            path="/academico/:id"
            element={
              <ProtectedRoute role="student">
                <AcademicDetailPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/pqrs"
            element={
              <ProtectedRoute>
                <PqrsPage />
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

          <Route path="/parche" element={<ParchePage />} />
        </Routes>

        


        
      </main>


      <Footer />


      <Chatbot />
    </>
  );
}


function VerifyEmailRoute() {
  const location = useLocation();


  return (
    <VerifyEmailPage
      key={location.key}
      hash={location.hash}
    />
  );
}


function App() {
  return (
    <AuthProvider>
      <MotionProvider>
        <div className="app">
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/login" element={<Login />} />


              <Route path="/registro" element={<RegisterPage />} />


              <Route
                path="/verificar-correo"
                element={<VerifyEmailRoute />}
              />


              <Route path="/*" element={<MainLayout />} />
            </Routes>
          </Suspense>
        </div>
      </MotionProvider>
    </AuthProvider>
  );
}


export default App;