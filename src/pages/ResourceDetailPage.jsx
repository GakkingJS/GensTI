import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Braces,
  CheckSquare,
  Code2,
  GitBranch,
  GraduationCap,
  Library,
  Terminal,
} from "lucide-react";

import styles from "../styles/ResourcesPage.module.css";
import { resources } from "../data/resources";
import ScrollReveal from "../components/ScrollReveal";

const resourceIcons = {
  library: Library,
  clipboard: CheckSquare,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  "code-2": Code2,
  "git-branch": GitBranch,
  braces: Braces,
  terminal: Terminal,
};

function ResourceIcon({ name, size = 52 }) {
  const Icon = resourceIcons[name] || BookOpen;

  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

function ResourceDetailPage() {
  const { id } = useParams();
  const resource = resources.find((item) => item.id === id);

  if (!resource) {
    return (
      <section className={styles.resourceNotFound}>
        <span className={styles.sectionLabel}>CENTRO DE RECURSOS</span>

        <h1>Recurso no encontrado</h1>

        <p>
          El recurso solicitado no está disponible en este prototipo.
        </p>

        <Link className={styles.resourcePrimaryLink} to="/recursos">
          Volver a recursos →
        </Link>
      </section>
    );
  }

  return (
    <article className={styles.resourceDetailPage}>
      <Link className={styles.backLink} to="/recursos">
        ← Volver al centro de recursos
      </Link>

      <ScrollReveal className={styles.resourceDetailHeader}>
        <div className={styles.resourceDetailIcon}>
          <ResourceIcon name={resource.icon} />
        </div>

        <span className={styles.resourceType}>
          {resource.category}
        </span>

        <h1>{resource.title}</h1>

        <p>{resource.description}</p>
      </ScrollReveal>

      <div className={styles.resourceDetailLayout}>
        <div className={styles.resourceDetailMain}>
          <span className={styles.sectionLabel}>
            SOBRE ESTE RECURSO
          </span>

          <p>
            Este recurso forma parte del centro de apoyo de GENSTI y está
            organizado para facilitar el acceso a información útil para la
            comunidad de Ingeniería de Sistemas.
          </p>

          <p>
            Antes de utilizar información institucional, verifica siempre que
            el contenido corresponda a la versión vigente publicada por la
            universidad.
          </p>

          {resource.externalUrl ? (
            <a
              className={styles.resourcePrimaryLink}
              href={resource.externalUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ir al recurso ↗
            </a>
          ) : (
            <button
              className={styles.resourcePrimaryLink}
              type="button"
              disabled
            >
              Recurso en preparación
            </button>
          )}
        </div>

        <aside className={styles.resourceDetailAside}>
          <span>CATEGORÍA</span>
          <strong>{resource.category}</strong>

          <span>TIPO</span>
          <strong>{resource.type}</strong>

          <span>ÁMBITO</span>
          <strong>
            {resource.semester === "GENERAL"
              ? "General"
              : `Semestre ${resource.semester}`}
          </strong>

          <span>ACTUALIZACIÓN</span>
          <strong>{resource.displayDate}</strong>
        </aside>
      </div>
    </article>
  );
}

export default ResourceDetailPage;