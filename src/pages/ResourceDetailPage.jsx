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
      <section className="resource-not-found">
        <span className="section-label">CENTRO DE RECURSOS</span>
        <h1>Recurso no encontrado</h1>
        <p>El recurso solicitado no está disponible en este prototipo.</p>

        <Link className="resource-primary-link" to="/recursos">
          Volver a recursos →
        </Link>
      </section>
    );
  }

  return (
    <article className="resource-detail-page">
      <Link className="back-link" to="/recursos">
        ← Volver al centro de recursos
      </Link>

      <header className="resource-detail-header">
        <div className="resource-detail-icon">
          <ResourceIcon name={resource.icon} />
        </div>

        <span className="resource-type">{resource.category}</span>

        <h1>{resource.title}</h1>

        <p>{resource.description}</p>
      </header>

      <div className="resource-detail-layout">
        <div className="resource-detail-main">
          <span className="section-label">SOBRE ESTE RECURSO</span>

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
              className="resource-primary-link"
              href={resource.externalUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ir al recurso ↗
            </a>
          ) : (
            <button className="resource-primary-link" type="button">
              Recurso en preparación
            </button>
          )}
        </div>

        <aside className="resource-detail-aside">
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