
import ScrollReveal from "./ScrollReveal";

const features = [
  {
    number: "01",
    title: "Información en un solo lugar",
    description:
      "Encuentra novedades, actividades y contenido de interés para la comunidad de Ingeniería de Sistemas.",
  },
  {
    number: "02",
    title: "Una comunidad conectada",
    description:
      "Mantente al tanto de las iniciativas, encuentros y oportunidades que fortalecen la vida universitaria.",
  },
  {
    number: "03",
    title: "Conocimiento que se comparte",
    description:
      "Descubre recursos e ideas que pueden complementar tu formación académica y profesional.",
  },
];

function AboutGensti() {
  return (
    <>
      <style>{`
        /* ==============================
           SECCIÓN PRINCIPAL
        ============================== */

        .about-gensti {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 100px 6%;
          margin: 0 auto;
          overflow: hidden;
          background: #f5f4ed;
          color: #14251e;
        }

        .about-gensti *,
        .about-gensti *::before,
        .about-gensti *::after {
          box-sizing: border-box;
        }

        /* ==============================
           INTRODUCCIÓN CENTRADA
        ============================== */

        .about-gensti__intro {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 850px;
          margin: 0 auto 70px;
          text-align: center;
        }

        .about-gensti__eyebrow {
          display: block;
          width: 100%;
          margin: 0 auto 22px;
          color: #66816c;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-align: center;
          text-transform: uppercase;
        }

        .about-gensti__intro h2 {
          display: block;
          width: 100%;
          max-width: 850px;
          margin: 0 auto 24px;
          color: #14251e;
          font-size: clamp(2.4rem, 5vw, 4.5rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.055em;
          text-align: center;
        }

        .about-gensti__intro h2 span {
          display: block;
          width: 100%;
          margin: 0 auto;
          color: #14251e;
          text-align: center;
        }

        .about-gensti__intro > p {
          display: block;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          color: #68756d;
          font-size: 1.05rem;
          line-height: 1.9;
          text-align: center;
        }

        /* ==============================
           TARJETAS: TRES COLUMNAS
        ============================== */

        .about-gensti__features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 25px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .about-gensti__features > * {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          height: 100%;
          margin: 0;
        }

        .about-gensti__card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          height: 100%;
          min-height: 290px;
          padding: 38px 28px;
          overflow: hidden;
          border: 1px solid rgba(20, 37, 30, 0.1);
          border-top: 4px solid #14251e;
          border-radius: 5px;
          background: #ffffff;
          text-align: center;
          box-shadow: 0 12px 35px rgba(20, 37, 30, 0.04);
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease;
        }

        .about-gensti__card:hover {
          transform: translateY(-8px);
          border-top-color: #66816c;
          box-shadow: 0 22px 45px rgba(20, 37, 30, 0.11);
        }

        /* ==============================
           NÚMEROS DE LAS TARJETAS
        ============================== */

        .about-gensti__number {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
          margin: 0 auto 25px;
          border: 1px solid rgba(20, 37, 30, 0.35);
          border-radius: 50%;
          color: #14251e;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          transition:
            color 0.3s ease,
            background 0.3s ease,
            transform 0.3s ease;
        }

        .about-gensti__card:hover .about-gensti__number {
          transform: rotate(8deg) scale(1.08);
          background: #14251e;
          color: #ffffff;
        }

        /* ==============================
           TÍTULOS CENTRADOS
        ============================== */

        .about-gensti__card h3 {
          display: block;
          width: 100%;
          margin: 0 auto 15px;
          color: #183b2c;
          font-size: 1.3rem;
          font-weight: 800;
          line-height: 1.4;
          letter-spacing: -0.025em;
          text-align: center;
        }

        /* ==============================
           DESCRIPCIONES CENTRADAS
        ============================== */

        .about-gensti__card p {
          display: block;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          padding: 0;
          color: #6b776f;
          font-size: 0.96rem;
          font-weight: 400;
          line-height: 1.8;
          text-align: center;
          text-indent: 0;
        }

        /* ==============================
           MENSAJE INFERIOR CENTRADO
        ============================== */

        .about-gensti__footer {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 14px;
          width: 100%;
          max-width: 850px;
          margin: 65px auto 0;
          padding-top: 28px;
          border-top: 1px solid rgba(20, 37, 30, 0.14);
          text-align: center;
        }

        .about-gensti__dot {
          display: block;
          flex: 0 0 9px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #366653;
          box-shadow: 0 0 0 5px rgba(98, 207, 162, 0.13);
        }

        .about-gensti__footer p {
          width: auto;
          max-width: 100%;
          margin: 0;
          padding: 0;
          color: #42564a;
          font-size: 0.95rem;
          line-height: 1.7;
          text-align: center;
        }

        /* ==============================
           TABLET
        ============================== */

        @media (max-width: 900px) {
          .about-gensti {
            padding: 80px 5%;
          }

          .about-gensti__features {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }

          .about-gensti__intro {
            margin-bottom: 50px;
          }

          .about-gensti__card {
            padding: 32px 24px;
          }
        }

        /* ==============================
           MÓVILES
        ============================== */

        @media (max-width: 600px) {
          .about-gensti {
            padding: 60px 20px;
          }

          .about-gensti__intro {
            margin-bottom: 40px;
          }

          .about-gensti__intro h2 {
            font-size: clamp(2rem, 9vw, 3rem);
            line-height: 1.12;
          }

          .about-gensti__intro > p {
            font-size: 0.96rem;
            line-height: 1.8;
          }

          .about-gensti__features {
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
          }

          .about-gensti__card {
            min-height: auto;
            padding: 32px 25px;
          }

          .about-gensti__card h3 {
            font-size: 1.2rem;
          }

          .about-gensti__card p {
            max-width: 340px;
            margin-right: auto;
            margin-left: auto;
            text-align: center;
          }

          .about-gensti__footer {
            gap: 12px;
            margin-top: 40px;
            padding-top: 24px;
          }

          .about-gensti__footer p {
            font-size: 0.88rem;
          }
        }

        /* ==============================
           ACCESIBILIDAD
        ============================== */

        @media (prefers-reduced-motion: reduce) {
          .about-gensti__card,
          .about-gensti__number {
            transition: none;
          }

          .about-gensti__card:hover,
          .about-gensti__card:hover .about-gensti__number {
            transform: none;
          }
        }
      `}</style>

      <section className="about-gensti" id="conoce-gensti">
        <ScrollReveal y={28} duration={0.7}>
          <div className="about-gensti__intro">
            <span className="about-gensti__eyebrow">
              MÁS QUE UNA PLATAFORMA
            </span>

            <h2>
              La comunidad crece cuando
              <span> compartimos lo que sabemos.</span>
            </h2>

            <p>
              GENSTI es un espacio digital pensado para conectar a la comunidad
              de Ingeniería de Sistemas, facilitar el acceso a información
              relevante y mantener más cerca las experiencias de la vida
              universitaria.
            </p>
          </div>
        </ScrollReveal>

        <div className="about-gensti__features">
          {features.map((feature, index) => (
            <ScrollReveal
              key={feature.number}
              y={24}
              delay={index * 0.12}
              duration={0.65}
            >
              <article className="about-gensti__card">
                <span className="about-gensti__number">
                  {feature.number}
                </span>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal y={20} duration={0.65}>
          <div className="about-gensti__footer">
            <span className="about-gensti__dot" />

            <p>
              Un punto de encuentro para aprender, participar y construir
              comunidad.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

export default AboutGensti;
