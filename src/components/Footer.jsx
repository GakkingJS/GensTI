import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  function scrollToTop() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-glow" aria-hidden="true" />

      <div className="site-footer-inner">
        <div className="site-footer-main">
          {/* Identidad */}
          <div className="site-footer-identity">
            <Link
              to="/"
              className="site-footer-brand"
              aria-label="GensTI, ir al inicio"
            >
              <span
                className="site-footer-code"
                aria-hidden="true"
              >
                <span>{"<"}</span>
                <span>/</span>
                <span>{">"}</span>
              </span>

              <span className="site-footer-brand-text">
                <strong>GensTI</strong>
                <span>Ingeniería de Sistemas</span>
              </span>
            </Link>

            <p className="site-footer-description">
              Un espacio creado para conectar, informar y apoyar
              a los estudiantes de Ingeniería de Sistemas de la UCC.
            </p>

            <span className="site-footer-signature">
              <span aria-hidden="true" />
              Ideas que conectan. Tecnología que transforma.
            </span>
          </div>

          {/* Navegación */}
          <nav
            className="site-footer-column"
            aria-label="Explorar GensTI"
          >
            <h2>Explora</h2>

            <Link to="/">Inicio</Link>
            <Link to="/botg">The Best of GensTI</Link>
            <Link to="/parche">Parche GensTI</Link>
            <Link to="/eventos">Eventos</Link>
          </nav>

          {/* Comunidad */}
          <nav
            className="site-footer-column"
            aria-label="Recursos de la comunidad"
          >
            <h2>Comunidad</h2>

            <Link to="/directorio">
              Directorio universitario
            </Link>

            <Link to="/academico">Académico</Link>

            <Link to="/botg#ima-gensti">IMA-GensTI</Link>
          </nav>

          {/* Documentos legales */}
          <nav
            className="site-footer-column site-footer-legal"
            aria-label="Información legal"
          >
            <h2>Transparencia y legal</h2>

            <Link to="/legal/privacidad">
              Privacidad y tratamiento de datos
            </Link>

            <Link to="/legal/terminos">
              Términos de uso
            </Link>

            <Link to="/legal/derechos-de-autor">
              Derechos de autor e imágenes
            </Link>

            <Link to="/legal/contacto">
              Contacto y solicitudes
            </Link>
          </nav>
        </div>

        <div
          className="site-footer-divider"
          aria-hidden="true"
        >
          <span />
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-copyright">
            <p>
              © {currentYear} GensTI. Todos los derechos
              reservados sobre el contenido propio.
            </p>

            <span>
              Las marcas, imágenes y contenidos de terceros
              pertenecen a sus respectivos titulares.
            </span>
          </div>

          <button
            type="button"
            className="site-footer-back-top"
            onClick={scrollToTop}
          >
            Volver arriba
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;