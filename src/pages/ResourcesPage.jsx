import { Link } from "react-router-dom";
import {
  BookOpen,
  Braces,
  CheckSquare,
  Code2,
  GitBranch,
  GraduationCap,
  Library,
  MessageSquareText,
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


function ResourceIcon({ name, size = 28 }) {
  const Icon = resourceIcons[name] || BookOpen;


  return (
    <Icon
      size={size}
      strokeWidth={1.7}
      aria-hidden="true"
    />
  );
}


function ResourcesPage() {
  const categories = [
    "TODOS",
    ...new Set(
      resources.map((resource) => resource.category)
    ),
  ];


  const featuredResources = resources.filter(
    (resource) => resource.featured
  );


  return (
    <section className="resources-page">
      <ScrollReveal className="resources-page-intro">
        <header>
          <div>
            <span className="section-label">
              CENTRO DE RECURSOS
            </span>


            <h1>Lo que necesitas para avanzar</h1>


            <p>
              Encuentra documentos, herramientas, guías y enlaces útiles para
              tu recorrido en Ingeniería de Sistemas.
            </p>
          </div>


          <div className="resources-summary">
            <div className="resources-summary-count">
              <strong>{resources.length}</strong>
              <span>recursos organizados</span>
            </div>


            <Link to="/pqrs" className="resources-pqrs-button">
              <MessageSquareText
                size={18}
                aria-hidden="true"
              />


              PQRS
            </Link>
          </div>
        </header>
      </ScrollReveal>


      <ScrollReveal
        className="resources-categories"
        delay={0.08}
      >
        {categories.map((category, index) => (
          <button
            key={category}
            type="button"
            style={{
              transitionDelay: `${index * 40}ms`,
            }}
          >
            {category}
          </button>
        ))}
      </ScrollReveal>


      <section className="resources-featured">
        <ScrollReveal
          className="resources-section-heading"
          delay={0.1}
        >
          <div>
            <span className="section-label">
              PARA EMPEZAR
            </span>


            <h2>Recursos recomendados</h2>
          </div>
        </ScrollReveal>


        {featuredResources.length > 0 ? (
          <div className="resources-featured-grid">
            {featuredResources.map((resource, index) => (
              <ScrollReveal
                key={resource.id}
                className="resource-featured-reveal"
                delay={index * 0.09}
              >
                <article className="resource-featured-card">
                  <div
                    className="resource-icon"
                    aria-label={`Icono de ${resource.type}`}
                  >
                    <ResourceIcon
                      name={resource.icon}
                      size={32}
                    />
                  </div>


                  <span className="resource-type">
                    {resource.type}
                  </span>


                  <h3>{resource.title}</h3>


                  <p>{resource.description}</p>


                  <div className="resource-card-footer">
                    <span>{resource.category}</span>


                    <Link
                      to={`/recursos/${resource.id}`}
                    >
                      Ver recurso →
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <p className="resources-empty-state">
              No hay recursos recomendados por ahora.
            </p>
          </ScrollReveal>
        )}
      </section>


      <section className="resources-list-section">
        <ScrollReveal
          className="resources-section-heading"
          delay={0.1}
        >
          <div>
            <span className="section-label">
              EXPLORAR
            </span>


            <h2>Todos los recursos</h2>
          </div>
        </ScrollReveal>


        {resources.length > 0 ? (
          <div className="resources-list">
            {resources.map((resource, index) => (
              <ScrollReveal
                key={resource.id}
                className="resource-list-reveal"
                delay={index * 0.06}
              >
                <article className="resource-list-item">
                  <span className="resource-list-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>


                  <span className="resource-list-icon">
                    <ResourceIcon
                      name={resource.icon}
                      size={24}
                    />
                  </span>


                  <div className="resource-list-content">
                    <span className="resource-type">
                      {resource.category}
                    </span>


                    <h3>{resource.title}</h3>


                    <p>{resource.description}</p>
                  </div>


                  <div className="resource-list-meta">
                    <span>
                      {resource.semester === "GENERAL"
                        ? "General"
                        : `Semestre ${resource.semester}`}
                    </span>


                    <span>{resource.access}</span>
                  </div>


                  <Link
                    className="resource-list-link"
                    to={`/recursos/${resource.id}`}
                  >
                    Abrir →
                  </Link>
                </article>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <p className="resources-empty-state">
              No hay recursos disponibles por ahora.
            </p>
          </ScrollReveal>
        )}
      </section>
    </section>
  );
}


export default ResourcesPage;