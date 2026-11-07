import { useEffect, useRef, useState } from "react";
import {
  advisingSessions,
  parcheInfo,
  subjectGroups,
} from "../data/parcheGensTI";

import styles from "../styles/ParcheGensTI.module.css";

const filters = [
  { id: "todos", label: "Todas las áreas" },
  { id: "programacion", label: "Programación" },
  { id: "matematicas", label: "Matemáticas y física" },
];

const preparationSteps = [
  {
    number: "01",
    title: "Identifica tu tema",
    description:
      "Revisa las materias disponibles y selecciona el espacio relacionado con tu duda.",
  },
  {
    number: "02",
    title: "Prepara tus preguntas",
    description:
      "Te sugerimos llevar el ejercicio, tu avance y el punto exacto en el que necesitas apoyo.",
  },
  {
    number: "03",
    title: "Consulta el horario",
    description:
      "Ubica el día, la hora y los líderes de la asesoría antes de organizar tu visita.",
  },
];

const questions = [
  {
    question: "¿Dónde se realizan las asesorías?",
    answer:
      "Los cuatro espacios del horario compartido tienen como lugar la Sala cómputo 3.",
  },
  {
    question: "¿Cuándo puedo consultar temas de programación?",
    answer:
      "Los martes a las 9:00 a. m. y los viernes a las 4:00 p. m., con Walter Alturo y Johan Reyes. Los temas son estructuras de datos y programación orientada a objetos.",
  },
  {
    question: "¿Cuándo son las asesorías de matemáticas y física?",
    answer:
      "Los martes a las 4:00 p. m., con Juan P. Gómez Zapata y Daniel E. Aristizábal, y los viernes a las 9:00 a. m., con Daniel E. Aristizábal.",
  },
  {
    question: "¿Necesito inscripción? ¿Tiene algún costo?",
    answer:
      "La información compartida no especifica inscripción, costo ni requisitos de asistencia. Estos detalles están pendientes de confirmar con la organización.",
  },
  {
    question: "¿Durante qué fechas funciona este horario?",
    answer:
      "No se indicaron fechas de inicio, finalización ni vigencia semestral. Confirma su disponibilidad actual con la organización antes de asistir.",
  },
];

function useScrollReveal() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const elements = root.querySelectorAll("[data-parche-reveal]");
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let observer;

    function configure() {
      observer?.disconnect();

      if (
        media.matches ||
        !("IntersectionObserver" in window)
      ) {
        elements.forEach((element) => {
          element.classList.add(styles.visible);
        });

        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle(
              styles.visible,
              entry.isIntersecting
            );
          });
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -15px 0px",
        }
      );

      elements.forEach((element) => observer.observe(element));
    }

    configure();
    media.addEventListener("change", configure);

    return () => {
      observer?.disconnect();
      media.removeEventListener("change", configure);
    };
  }, []);

  return rootRef;
}

function ParchePage() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const rootRef = useScrollReveal();

  const filteredSessions = advisingSessions.filter(
    (session) =>
      activeFilter === "todos" ||
      session.groupId === activeFilter
  );

  function goToSection(event) {
    const href = event.currentTarget.getAttribute("href");
    const target = document.getElementById(href?.slice(1));

    if (!target) return;

    event.preventDefault();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    target.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
  }

  return (
    <main className={styles.page} ref={rootRef}>
      {/* HERO */}
      <section
        className={styles.hero}
        aria-labelledby="parche-title"
      >
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={styles.heroLayout}>
          <div className={styles.heroContent} data-parche-reveal>
            <span className={styles.eyebrow}>
              <span aria-hidden="true" />
              GENSTI · UCC IBAGUÉ
            </span>

            <h1 id="parche-title">
              Aprender es mejor
              <span> en parche.</span>
            </h1>

            <p className={styles.heroDescription}>
              Asesorías del Parche GensTI: un espacio para
              compartir preguntas y fortalecer tus conocimientos
              en programación, matemáticas y física.
            </p>

            <div className={styles.heroActions}>
              <a
                href="#horarios-parche"
                className={styles.primaryButton}
                onClick={goToSection}
              >
                Encuentra tu asesoría
                <span aria-hidden="true">↘</span>
              </a>

              <a
                href="#areas-parche"
                className={styles.textLink}
                onClick={goToSection}
              >
                Explorar materias →
              </a>
            </div>

            <div className={styles.heroMeta}>
              <span>Martes y viernes</span>
              <span>{parcheInfo.location}</span>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.orbit} />

            <div className={styles.communityCard}>
              <span className={styles.visualEyebrow}>
                ASESORÍAS DEL
              </span>

              <span className={styles.visualTitle}>Parche</span>
              <span className={styles.visualBrand}>GensTI</span>

              <span className={styles.visualCode}>{"</>"}</span>

              <div className={styles.visualFooter}>
                <span>Preguntar.</span>
                <span>Compartir.</span>
                <span>Aprender.</span>
              </div>
            </div>

            <span className={`${styles.floatingChip} ${styles.chipOne}`}>
              {"{ ideas }"}
            </span>

            <span className={`${styles.floatingChip} ${styles.chipTwo}`}>
              x + y
            </span>

            <span className={`${styles.floatingChip} ${styles.chipThree}`}>
              Una duda, un comienzo.
            </span>
          </div>
        </div>
      </section>

      {/* RESUMEN */}
      <section
        className={styles.quickInfo}
        aria-label="Resumen del horario compartido"
        data-parche-reveal
      >
        <div>
          <strong>02</strong>
          <span>Días de encuentro</span>
        </div>

        <div>
          <strong>04</strong>
          <span>Espacios en el horario</span>
        </div>

        <div>
          <strong>08</strong>
          <span>Materias para consultar</span>
        </div>

        <div>
          <strong>{"</>"}</strong>
          <span>Una comunidad para aprender</span>
        </div>
      </section>

      {/* ÁREAS */}
      <section
        id="areas-parche"
        className={styles.section}
        aria-labelledby="areas-title"
      >
        <header className={styles.sectionHeading} data-parche-reveal>
          <div>
            <span className={styles.sectionLabel}>
              01 / ENCUENTRA TU ÁREA
            </span>

            <h2 id="areas-title">
              Tus preguntas tienen <span>un espacio.</span>
            </h2>
          </div>

          <p>
            Consulta los temas incluidos y encuentra el horario
            que corresponde a tu materia.
          </p>
        </header>

        <div className={styles.areasGrid}>
          {subjectGroups.map((group) => (
            <article
              key={group.id}
              className={styles.areaCard}
              data-parche-reveal
            >
              <span className={styles.areaSymbol} aria-hidden="true">
                {group.symbol}
              </span>

              <h3>{group.label}</h3>
              <p>{group.description}</p>

              <ul className={styles.subjectList}>
                {group.subjects.map((subject) => (
                  <li key={subject}>{subject}</li>
                ))}
              </ul>

              <a
                href="#horarios-parche"
                className={styles.areaLink}
                onClick={(event) => {
                  setActiveFilter(group.id);
                  goToSection(event);
                }}
              >
                Ver horarios del área
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* HORARIOS */}
      <section
        id="horarios-parche"
        className={styles.scheduleSection}
        aria-labelledby="schedule-title"
      >
        <div className={styles.sectionInner}>
          <header className={styles.sectionHeading} data-parche-reveal>
            <div>
              <span className={styles.sectionLabel}>
                02 / ORGANIZA TU ENCUENTRO
              </span>

              <h2 id="schedule-title">
                Un horario para <span>dar el siguiente paso.</span>
              </h2>
            </div>

            <p>
              Todos los encuentros del horario compartido
              se realizan en la Sala cómputo 3.
            </p>
          </header>

          <div
            className={styles.filters}
            role="group"
            aria-label="Filtrar asesorías por área"
          >
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`${styles.filter} ${
                  activeFilter === filter.id
                    ? styles.filterActive
                    : ""
                }`}
                aria-pressed={activeFilter === filter.id}
                aria-controls="parche-results"
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className={styles.resultsCount} role="status">
            {filteredSessions.length}{" "}
            {filteredSessions.length === 1
              ? "espacio disponible en el horario compartido"
              : "espacios disponibles en el horario compartido"}
          </p>

          <div
            id="parche-results"
            className={styles.scheduleGrid}
            key={activeFilter}
          >
            {filteredSessions.map((session, index) => {
              const group = subjectGroups.find(
                (item) => item.id === session.groupId
              );

              return (
                <article
                  key={session.id}
                  className={styles.sessionCard}
                  style={{ "--delay": `${index * 65}ms` }}
                >
                  <div className={styles.sessionTop}>
                    <span className={styles.day}>{session.day}</span>
                    <span className={styles.sessionGroup}>
                      {group.label}
                    </span>
                  </div>

                  <p className={styles.time}>
                    <time dateTime={session.time24}>
                      {session.time}
                    </time>
                  </p>

                  <p className={styles.location}>
                    <span aria-hidden="true">↗</span>
                    {session.location}
                  </p>

                  <ul className={styles.sessionSubjects}>
                    {group.subjects.map((subject) => (
                      <li key={subject}>{subject}</li>
                    ))}
                  </ul>

                  <div className={styles.leaders}>
                    <span>LIDERAN ESTE ESPACIO</span>

                    {session.leaders.map((leader) => (
                      <p key={leader}>{leader}</p>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className={styles.scheduleNotice}>
            <span aria-hidden="true">ⓘ</span>
            <p>
              <strong>Antes de asistir:</strong> el horario recibido
              no indica vigencia semestral, fechas de inicio o
              finalización ni duración de las sesiones. Confirma
              la disponibilidad actual con la organización.
            </p>
          </aside>
        </div>
      </section>

      {/* PREPARACIÓN */}
      <section
        className={styles.section}
        aria-labelledby="prepare-title"
      >
        <header className={styles.sectionHeading} data-parche-reveal>
          <div>
            <span className={styles.sectionLabel}>
              03 / APROVECHA EL ESPACIO
            </span>

            <h2 id="prepare-title">
              Llega con una duda.
              <span> Empieza una conversación.</span>
            </h2>
          </div>

          <p>
            Algunas sugerencias para preparar tu participación.
            No son requisitos de inscripción.
          </p>
        </header>

        <div className={styles.stepsGrid}>
          {preparationSteps.map((step) => (
            <article
              key={step.number}
              className={styles.step}
              data-parche-reveal
            >
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PREGUNTAS */}
      <section
        className={`${styles.section} ${styles.faqSection}`}
        aria-labelledby="faq-title"
      >
        <header className={styles.sectionHeading} data-parche-reveal>
          <div>
            <span className={styles.sectionLabel}>
              04 / RESOLVAMOS LO BÁSICO
            </span>

            <h2 id="faq-title">
              Antes de <span>sumarte al parche.</span>
            </h2>
          </div>
        </header>

        <div className={styles.faqList}>
          {questions.map((item) => (
            <details key={item.question} className={styles.faq}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>

              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CIERRE */}
      <section className={styles.closing} data-parche-reveal>
        <span className={styles.closingCode} aria-hidden="true">
          {"</>"}
        </span>

        <span className={styles.sectionLabel}>
          COMUNIDAD QUE ACOMPAÑA
        </span>

        <h2>
          No tienes que tener
          <span> todas las respuestas.</span>
        </h2>

        <p>
          A veces, el siguiente paso empieza con una buena pregunta.
        </p>

        <a
          href="#horarios-parche"
          className={styles.primaryButton}
          onClick={goToSection}
        >
          Volver a los horarios
          <span aria-hidden="true">↑</span>
        </a>
      </section>
    </main>
  );
}

export default ParchePage;