import { Link } from "react-router-dom";

import { academicSubjects } from "../data/academic";
import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/AcademicPage.module.css";

function AcademicPage() {
  const semesters = [
    ...new Set(
      academicSubjects.map((subject) => subject.semester)
    ),
  ];

  return (
    <section className="academic-page">
      <ScrollReveal className="academic-page-intro">
        <header>
          <div>
            <span className="section-label">RUTA ACADÉMICA</span>

            <h1>Conoce lo que viene en tu carrera</h1>

            <p>
              Explora las materias, los créditos y los temas generales que
              hacen parte del recorrido de Ingeniería de Sistemas.
            </p>
          </div>

          <div className="academic-page-summary">
            <strong>{semesters.length}</strong>
            <span>semestres de referencia</span>
          </div>
        </header>
      </ScrollReveal>

      <ScrollReveal
        className="academic-notice"
        delay={0.08}
      >
        <span>NOTA </span>

        <p>
          Esta información es una guía visual y puede cambiar según el plan de
          estudios, la sede o la actualización académica correspondiente.
        </p>
      </ScrollReveal>

      <section className="academic-semesters">
        {semesters.map((semester, semesterIndex) => {
          const subjects = academicSubjects.filter(
            (subject) => subject.semester === semester
          );

          return (
            <section
              className="semester-section"
              key={semester}
            >
              <ScrollReveal
                className="semester-heading"
                delay={semesterIndex * 0.06}
              >
                <span>
                  {String(semester).padStart(2, "0")}
                </span>

                <div>
                  <small>SEMESTRE</small>
                  <h2>Semestre {semester}</h2>
                </div>

                <strong>
                  {subjects.length}{" "}
                  {subjects.length === 1
                    ? "materia"
                    : "materias"}
                </strong>
              </ScrollReveal>

              <div className="subjects-grid">
                {subjects.map((subject, subjectIndex) => (
                  <ScrollReveal
                    key={subject.id}
                    className="subject-reveal"
                    delay={subjectIndex * 0.07}
                  >
                    <article className="subject-card">
                      <div className="subject-card-top">
                        <span>
                          {subject.credits} créditos
                        </span>

                        <span>
                          {String(subject.semester).padStart(2, "0")}
                        </span>
                      </div>

                      <h3>{subject.name}</h3>

                      <p>{subject.description}</p>

                      <Link
                        className="subject-card-link"
                        to={`/academico/${subject.id}`}
                      >
                        Ver materia →
                      </Link>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </section>
  );
}

export default AcademicPage;