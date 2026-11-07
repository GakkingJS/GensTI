import { Link } from "react-router-dom";

import ScrollReveal from "./ScrollReveal";
import Hummingbird from "./Hummingbird/Hummingbird";
import { useAuth } from "../context/AuthContext";

function Hero() {
  const { user, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return (
      <section className="hero hero--loading" aria-busy="true">
        <div className="hero-content">
          <span className="eyebrow">COMUNIDAD ACADÉMICA</span>
          <h1>Preparando tu espacio en GensTI...</h1>
        </div>
      </section>
    );
  }

  if (user) {
    const isStudent = hasRole("student");
    const canViewEvents = hasPermission("events.view");

    return (
      <section
        className="hero hero--authenticated"
        id="inicio"
      >
        <div className="hero-content">
          <ScrollReveal
            className="hero-reveal-item"
            y={24}
            duration={0.65}
          >
            <span className="eyebrow">
              TU COMUNIDAD ACADÉMICA
            </span>
          </ScrollReveal>

          <ScrollReveal
            className="hero-reveal-item"
            delay={0.08}
            y={28}
            duration={0.75}
          >
            <h1>
              <span className="hero-title-normal">
                Qué bueno tenerte de vuelta.
              </span>

              <span className="hero-title-highlight">
                {" "}Esto es GensTI.
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal
            className="hero-reveal-item"
            delay={0.16}
            y={24}
            duration={0.7}
          >
            <p>
              Tu espacio para mantenerte al día con la carrera,
              descubrir actividades y conectar con la comunidad
              de Ingeniería de Sistemas.
            </p>
          </ScrollReveal>

          <ScrollReveal
            className="hero-reveal-item"
            delay={0.24}
            y={20}
            duration={0.65}
          >
            <div className="hero-buttons">
              {isStudent && (
                <Link className="primary-btn" to="/noticias">
                  Explorar noticias
                  <span aria-hidden="true"> →</span>
                </Link>
              )}

              {canViewEvents && (
                <Link className="secondary-btn" to="/eventos">
                  Descubrir eventos
                  <span aria-hidden="true"> →</span>
                </Link>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal
            className="hero-reveal-item"
            delay={0.32}
            y={16}
            duration={0.6}
          >
            <div className="hero-quick-links">
              <span className="hero-quick-links-label">
                TU COMUNIDAD, A UN CLIC
              </span>

              <div className="hero-quick-links-list">
                {isStudent && (
                  <Link to="/noticias" className="hero-quick-link">
                    <span aria-hidden="true">↗</span>
                    Noticias y anuncios
                  </Link>
                )}

                {canViewEvents && (
                  <Link to="/eventos" className="hero-quick-link">
                    <span aria-hidden="true">↗</span>
                    Actividades académicas
                  </Link>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal
          className="hero-decoration-reveal"
          delay={0.3}
          y={18}
          duration={0.9}
        >
          <div className="hero-decoration hero-decoration--authenticated">
            <Hummingbird />

            <div className="floating-card card-one">
              <span className="floating-card-icon" aria-hidden="true">
                ↗
              </span>
              <strong>Comunidad</strong>
              <span>Crece con GensTI</span>
            </div>

            <div className="floating-card card-two">
              <span className="floating-card-icon" aria-hidden="true">
                ✳
              </span>
              <strong>Eventos</strong>
              <span>Participa y conecta</span>
            </div>
          </div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <section className="hero" id="inicio">
      <div className="hero-content">
        <ScrollReveal
          className="hero-reveal-item"
          y={24}
          duration={0.65}
        >
          <span className="eyebrow">
            COMUNIDAD ACADÉMICA
          </span>
        </ScrollReveal>

        <ScrollReveal
          className="hero-reveal-item"
          delay={0.08}
          y={28}
          duration={0.75}
        >
          <h1>
            <span className="hero-title-normal">
              Todo lo que pasa en
            </span>

            <span> GensTI.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal
          className="hero-reveal-item"
          delay={0.16}
          y={24}
          duration={0.7}
        >
          <p>
            Un espacio para estudiantes donde encontrarás
            información académica, eventos y recursos de la carrera.
          </p>
        </ScrollReveal>

        <ScrollReveal
          className="hero-reveal-item"
          delay={0.24}
          y={20}
          duration={0.65}
        >
          <div className="hero-buttons">
            <Link className="primary-btn" to="/login">
              Iniciar sesión
            </Link>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal
        className="hero-decoration-reveal"
        delay={0.3}
        y={18}
        duration={0.9}
      >
        <div className="hero-decoration">
          <Hummingbird />
        </div>
      </ScrollReveal>
    </section>
  );
}

export default Hero;