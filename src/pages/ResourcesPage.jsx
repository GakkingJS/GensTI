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
    <section className={styles.resourcesPage}>
      <ScrollReveal className={styles.resourcesPageIntro}>
        <header>
          <div>
            <span className={styles.sectionLabel}>
              CENTRO DE RECURSOS
            </span>

            <h1>Lo que necesitas para avanzar</h1>

            <p>
              Encuentra documentos, herramientas, guías y enlaces
              útiles para tu recorrido en Ingeniería de Sistemas.
            </p>
          </div>

          <div className={styles.resourcesSummary}>
            <div className={styles.resourcesSummaryCount}>
              <strong>{resources.length}</strong>

              <span>recursos organizados</span>
            </div>

            <Link
              to="/pqrs"
              className={styles.resourcesPqrsButton}
            >
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
        className={styles.resourcesCategories}
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

      <section className={styles.resourcesFeatured}>
        <ScrollReveal
          className={styles.resourcesSectionHeading}
          delay={0.1}
        >
          <div>
            <span className={styles.sectionLabel}>
              PARA EMPEZAR
            </span>

            <h2>Recursos recomendados</h2>
          </div>
        </ScrollReveal>

        {featuredResources.length > 0 ? (
          <div className={styles.resourcesFeaturedGrid}>
            {featuredResources.map((resource, index) => (
              <ScrollReveal
                key={resource.id}
                className={styles.resourceFeaturedReveal}
                delay={index * 0.09}
              >
                <article
                  className={styles.resourceFeaturedCard}
                >
                  <div
                    className={styles.resourceIcon}
                    aria-label={`Icono de ${resource.type}`}
                  >
                    <ResourceIcon
                      name={resource.icon}
                      size={32}
                    />
                  </div>

                  <span className={styles.resourceType}>
                    {resource.type}
                  </span>

                  <h3>{resource.title}</h3>

                  <p>{resource.description}</p>

                  <div className={styles.resourceCardFooter}>
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
            <p className={styles.resourcesEmptyState}>
              No hay recursos recomendados por ahora.
            </p>
          </ScrollReveal>
        )}
      </section>

      <section className={styles.resourcesListSection}>
        <ScrollReveal
          className={styles.resourcesSectionHeading}
          delay={0.1}
        >
          <div>
            <span className={styles.sectionLabel}>
              EXPLORAR
            </span>

            <h2>Todos los recursos</h2>
          </div>
        </ScrollReveal>

        {resources.length > 0 ? (
          <div className={styles.resourcesList}>
            {resources.map((resource, index) => (
              <ScrollReveal
                key={resource.id}
                className={styles.resourceListReveal}
                delay={index * 0.06}
              >
                <article
                  className={styles.resourceListItem}
                >
                  <span
                    className={styles.resourceListNumber}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={styles.resourceListIcon}
                  >
                    <ResourceIcon
                      name={resource.icon}
                      size={24}
                    />
                  </span>

                  <div
                    className={styles.resourceListContent}
                  >
                    <span className={styles.resourceType}>
                      {resource.category}
                    </span>

                    <h3>{resource.title}</h3>

                    <p>{resource.description}</p>
                  </div>

                  <div className={styles.resourceListMeta}>
                    <span>
                      {resource.semester === "GENERAL"
                        ? "General"
                        : `Semestre ${resource.semester}`}
                    </span>

                    <span>{resource.access}</span>
                  </div>

                  <Link
                    className={styles.resourceListLink}
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
            <p className={styles.resourcesEmptyState}>
              No hay recursos disponibles por ahora.
            </p>
          </ScrollReveal>
        )}
      </section>
    </section>
  );
}

export default ResourcesPage;