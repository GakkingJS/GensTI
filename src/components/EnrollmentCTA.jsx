
import ScrollReveal from "./ScrollReveal";

function EnrollmentCTA() {
  return (
    <section className="enrollment-cta enrollment-cta--featured" id="inscripciones">
      <div className="enrollment-cta__glow" aria-hidden="true" />
      <div className="enrollment-cta__grid" aria-hidden="true" />

      <ScrollReveal y={35} duration={0.8}>
        <div className="enrollment-cta__content">
          <span className="enrollment-cta__eyebrow">
            <span className="enrollment-cta__status-dot" />
            TU FUTURO EMPIEZA CON UNA DECISIÓN
          </span>

          <h2>
            El próximo gran proyecto
            <span> puede empezar contigo.</span>
          </h2>

          <p>
            Convierte tu curiosidad en conocimiento, tus ideas en soluciones
            y tu pasión por la tecnología en tu futuro profesional.
            Descubre Ingeniería de Sistemas en la Universidad Cooperativa
            de Colombia.
          </p>

          <div className="enrollment-cta__actions">
            <a
              className="enrollment-cta__button enrollment-cta__button--primary"
              href="https://www.ucc.edu.co/programas/pregrados/Paginas/ibague-espinal/Ingenieria-de-Sistemas-Ibague.aspx#pensum"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Quiero conocer la carrera</span>
              <span className="enrollment-cta__arrow" aria-hidden="true">
                ↗
              </span>
            </a>

            <span className="enrollment-cta__note">
              Conoce el programa en el sitio oficial de la UCC
            </span>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal y={25} duration={1}>
        <div className="enrollment-cta__decoration" aria-hidden="true">
          <div className="enrollment-cta__orbit enrollment-cta__orbit--outer" />
          <div className="enrollment-cta__orbit enrollment-cta__orbit--inner" />

          <div className="enrollment-cta__code-card">
            <span className="enrollment-cta__code-label">
              SI PUEDES IMAGINARLO,
            </span>

            <span className="enrollment-cta__code-symbol">
              {"</>"}
            </span>

            <span className="enrollment-cta__code-caption">
              PUEDES PROGRAMARLO.<span>.</span>
            </span>
          </div>

          <span className="enrollment-cta__floating enrollment-cta__floating--one">
            {"{ }"}
          </span>

          <span className="enrollment-cta__floating enrollment-cta__floating--two">
            01
          </span>

          <span className="enrollment-cta__floating enrollment-cta__floating--three">
            +
          </span>
        </div>
      </ScrollReveal>
    </section>
  );
}

export default EnrollmentCTA;
