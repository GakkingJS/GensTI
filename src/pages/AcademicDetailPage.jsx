import { Link, useParams } from "react-router-dom";
import { academicSubjects } from "../data/academic";

import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/AcademicPage.module.css";

function AcademicDetailPage() {
  const { id } = useParams();

  const subject = academicSubjects.find((item) => item.id === id);

  if (!subject) {
    return (
      <section className="academic-not-found">
        <span className="section-label">RUTA ACADÉMICA</span>
        <h1>Materia no encontrada</h1>
        <p>
          No encontramos la materia solicitada dentro de este prototipo.
        </p>

        <Link className="subject-card-link" to="/academico">
          Volver a información académica →
        </Link>
      </section>
    );
  }

  return (
    <article className="academic-detail-page">
      <Link className="back-link" to="/academico">
        ← Volver a información académica
      </Link>

      <header className="academic-detail-header">
        <span className="section-label">SEMESTRE {subject.semester}</span>
        <h1>{subject.name}</h1>
        <p>{subject.description}</p>
      </header>

      <div className="academic-detail-layout">
        <div className="academic-detail-main">
          <span className="academic-detail-label">¿Qué se verá?</span>

          <p>
            En esta materia se desarrollarán conocimientos y habilidades
            relacionados con {subject.name.toLowerCase()}, conectando los
            conceptos fundamentales con situaciones propias de la formación en
            Ingeniería de Sistemas.
          </p>

          <p>
            Su contenido puede complementarse con actividades prácticas,
            lecturas, ejercicios y proyectos definidos por el docente y el
            programa académico.
          </p>
        </div>

        <aside className="academic-detail-aside">
          <span>SEMESTRE</span>
          <strong>{subject.semester}</strong>

          <span>CRÉDITOS</span>
          <strong>{subject.credits}</strong>

          <span>TIPO DE INFORMACIÓN</span>
          <strong>Referencia académica</strong>
        </aside>
      </div>
    </article>
  );
}

export default AcademicDetailPage;