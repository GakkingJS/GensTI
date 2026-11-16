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
            <a
              href="/"
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
            </a>

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

            <a href="/">Inicio</a>

            <a href="/botg">
              The Best of GensTI
            </a>

            <a href="/parche">
              Parche GensTI
            </a>

            <a href="/eventos">
              Eventos
            </a>
          </nav>

          {/* Comunidad */}
          <nav
            className="site-footer-column"
            aria-label="Recursos de la comunidad"
          >
            <h2>Comunidad</h2>

            <a href="/directorio">
              Directorio universitario
            </a>

            <a href="/academico">
              Académico
            </a>

            <a href="/botg#ima-gensti">
              IMA-GensTI
            </a>
          </nav>

          {/* Documentos legales */}
          <nav
            className="site-footer-column site-footer-legal"
            aria-label="Información legal"
          >
            <h2>Transparencia y legal</h2>

            <a
              href="https://www.ucc.edu.co/Paginas/tratamiento-de-datos-personales-ucc.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacidad y tratamiento de datos
            </a>

            <a
              href="https://www.ucc.edu.co/Paginas/atencion-al-ciudadano.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacto y solicitudes
            </a>
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