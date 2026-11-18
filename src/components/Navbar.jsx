import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import gensstiLogo from "../assets/genssti-logo.jpg";


function Dropdown({ label, items, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isActive = items.some((i) => location.pathname.startsWith(i.to));


  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function esc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);


  useEffect(() => setOpen(false), [location.pathname]);


  if (items.length === 0) return null;


  return (
    <div className={`navbar-dropdown ${open ? "is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className={`navbar-link ${isActive ? "is-active" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label} <span className="caret" aria-hidden="true">▾</span>
      </button>


      <div className="navbar-dropdown-panel" role="menu">
        {items.map((i, idx) => (
          <NavLink
            key={i.to}
            to={i.to}
            role="menuitem"
            style={{ "--i": idx }}
            className={({ isActive }) =>
              `navbar-dropdown-item ${isActive ? "is-active" : ""}`
            }
            onClick={onNavigate}
          >
            {i.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}


function Navbar() {
  const { user, loading, logout, hasRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef(null);


  const isStudent = hasRole("student");
  const canViewNews = hasPermission("news.view");
  const canManageUsers = hasPermission("users.manage");


  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  useEffect(() => {
    function close(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);


  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }


  function goToHome() {
    setMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  const userInitial =
    user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const firstName = (user?.name ?? user?.email ?? "Usuario").split(/[\s@]/)[0];


  const communityItems = [
    { to: "/eventos", label: "Eventos" },
    { to: "/directorio", label: "Directorio" },
  ];


  const learnItems = [
    { to: "/academico", label: "Académico" },
    ...(isStudent ? [{ to: "/recursos", label: "Recursos" }] : []),
  ];


  const closeMenu = () => setMenuOpen(false);
  const linkClass = ({ isActive }) =>
    `navbar-link ${isActive ? "is-active" : ""}`;


  return (
    <header className={`navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img
            src={gensstiLogo}
            alt="Logo de GensTI"
            className="logo-image"
          />


          <div className="logo-text">
            <strong>GensTI</strong>
            <small>Ingeniería de Sistemas</small>
          </div>
        </Link>


        <nav
          id="navbar-mobile-menu"
          className={`navbar-menu ${menuOpen ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          <button
            type="button"
            className={`navbar-link ${location.pathname === "/" ? "is-active" : ""}`}
            onClick={goToHome}
          >
            Inicio
          </button>


          <Link
            to="/botg"
            title="The Best of GensTI"
            className={`navbar-best ${location.pathname === "/botg" ? "is-active" : ""}`}
            onClick={closeMenu}
          >
            <span aria-hidden="true">✦</span>
            TBOG
          </Link>


          {canViewNews && (
            <NavLink to="/noticias" className={linkClass} onClick={closeMenu}>
              Noticias
            </NavLink>
          )}


          <Dropdown label="Comunidad" items={communityItems} onNavigate={closeMenu} />
          <Dropdown label="Aprender" items={learnItems} onNavigate={closeMenu} />


          {canManageUsers && (
            <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
              Admin
            </NavLink>
          )}


          <Link
            to="/parche"
            className="navbar-parche navbar-parche-mobile"
            onClick={closeMenu}
          >
            <span aria-hidden="true">✦</span>
            Parche GensTI
          </Link>


          <div className="navbar-mobile-auth">
            {loading ? (
              <span className="navbar-loading">Cargando...</span>
            ) : user ? (
              <>
                <div className="navbar-user-chip" title={user.email}>
                  <span className="navbar-user-avatar" aria-hidden="true">
                    {userInitial}
                  </span>
                  <span className="navbar-user-name">{user.email}</span>
                </div>
                <button type="button" className="logout-btn" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="login-btn" onClick={closeMenu}>
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>


        <div className="navbar-auth">
          <Link to="/parche" className="navbar-parche">
            <span aria-hidden="true">✦</span>
            Parche GensTI
          </Link>


          {loading ? (
            <span className="navbar-loading">Cargando...</span>
          ) : user ? (
            <div className={`navbar-user ${userOpen ? "is-open" : ""}`} ref={userRef}>
              <button
                type="button"
                className="navbar-user-chip"
                aria-expanded={userOpen}
                title={user.email}
                onClick={() => setUserOpen((o) => !o)}
              >
                <span className="navbar-user-avatar" aria-hidden="true">
                  {userInitial}
                </span>
                <span className="navbar-user-name">{firstName}</span>
                <span className="caret" aria-hidden="true">▾</span>
              </button>


              <div className="navbar-dropdown-panel navbar-user-panel">
                <small className="navbar-user-email">{user.email}</small>
                <button
                  type="button"
                  className="navbar-dropdown-item is-danger"
                  style={{ "--i": 0 }}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-btn">Iniciar sesión</Link>
          )}
        </div>


        <button
          type="button"
          className={`navbar-toggle ${menuOpen ? "is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="navbar-mobile-menu"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>


      {menuOpen && <div className="navbar-overlay" onClick={closeMenu} />}
    </header>
  );
}

export default Navbar;
