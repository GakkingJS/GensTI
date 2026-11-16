import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ClipboardCheck,
  ImageOff,
  Newspaper,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/NewsPage.module.css";

/* ==========================================
   UTILIDADES
========================================== */

function formatDate(value) {
  if (!value) return "Fecha por confirmar";

  const date = new Date(
    String(value).length === 10
      ? `${value}T12:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) {
    return "Fecha por confirmar";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getNewsCategory(item) {
  return item.category || item.categoria || "General";
}

function getNewsImage(item) {
  return (
    item.image_url ||
    item.image ||
    item.cover_image ||
    item.imagen ||
    ""
  );
}

function getNewsSummary(item) {
  return (
    item.summary ||
    item.excerpt ||
    item.description ||
    item.content ||
    item.contenido ||
    "Conoce más detalles de esta publicación."
  );
}

function getNewsTitle(item) {
  return item.title || item.titulo || "Publicación";
}

function getNewsId(item) {
  return item.id ?? item.news_id;
}

function getTimestamp(item) {
  const value =
    item.published_at ||
    item.created_at ||
    item.fecha_publicacion;

  const timestamp = new Date(value || 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function fetchItems(url, signal) {
  const response = await fetch(url, {
    credentials: "include",
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = `No fue posible consultar el contenido (HTTP ${response.status}).`;

    const data = await response
      .json()
      .catch(() => null);

    if (typeof data?.detail === "string") {
      detail = data.detail;
    }

    throw new Error(detail);
  }

  const data = await response.json();

  const items = Array.isArray(data)
    ? data
    : data?.items ?? data?.news;

  if (!Array.isArray(items)) {
    throw new Error(
      "El servidor devolvió un formato inesperado."
    );
  }

  return items;
}

function truncateText(value, maxLength = 240) {
  const text = String(value || "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

/* ==========================================
   IMÁGENES
========================================== */

function NewsImage({ item, featured = false }) {
  const image = getNewsImage(item);
  const [failedImage, setFailedImage] = useState(null);

  const placeholderClass = featured
    ? styles.featuredPlaceholder
    : styles.cardPlaceholder;

  if (!image || failedImage === image) {
    return (
      <div className={placeholderClass}>
        <ImageOff size={30} aria-hidden="true" />
        <span>GENSTI</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={item.image_alt || getNewsTitle(item)}
      loading="lazy"
      decoding="async"
      onError={() => setFailedImage(image)}
    />
  );
}

/* ==========================================
   ACCIONES ADMINISTRATIVAS
========================================== */

function AdminActions({
  item,
  canEdit,
  canDelete,
  deletingId,
  onDelete,
}) {
  if (!canEdit && !canDelete) return null;

  const id = getNewsId(item);

  return (
    <div className={styles.adminActions}>
      {canEdit && (
        <Link
          className={styles.adminButton}
          to={`/admin/noticias/${id}/editar`}
        >
          Editar
        </Link>
      )}

      {canDelete && (
        <button
          type="button"
          className={`${styles.adminButton} ${styles.deleteButton}`}
          disabled={deletingId === id}
          onClick={() => onDelete(id)}
        >
          {deletingId === id ? "Eliminando..." : "Eliminar"}
        </button>
      )}
    </div>
  );
}

/* ==========================================
   TARJETA DE NOTICIA
========================================== */

function NewsCard({
  item,
  featured = false,
  canEdit,
  canDelete,
  deletingId,
  onDelete,
}) {
  const title = getNewsTitle(item);
  const id = getNewsId(item);

  return (
    <article
      className={
        featured ? styles.featuredCard : styles.newsCard
      }
    >
      <div
        className={
          featured ? styles.featuredVisual : styles.cardVisual
        }
      >
        <NewsImage item={item} featured={featured} />

        {featured && (
          <span className={styles.featuredLabel}>
            Última publicación
          </span>
        )}
      </div>

      <div
        className={
          featured
            ? styles.featuredContent
            : styles.cardContent
        }
      >
        <div className={styles.meta}>
          <span className={styles.metaCategory}>
            {getNewsCategory(item)}
          </span>

          <span>
            {formatDate(
              item.published_at ||
                item.created_at ||
                item.fecha_publicacion
            )}
          </span>
        </div>

        {featured ? (
          <h3 className={styles.featuredTitle}>{title}</h3>
        ) : (
          <h3 className={styles.cardTitle}>{title}</h3>
        )}

        <p
          className={
            featured
              ? styles.featuredSummary
              : styles.cardSummary
          }
        >
          {truncateText(getNewsSummary(item))}
        </p>

        <Link
          className={styles.textLink}
          to={`/noticias/${id}`}
        >
          Leer noticia
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>

        <AdminActions
          item={item}
          canEdit={canEdit}
          canDelete={canDelete}
          deletingId={deletingId}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

/* ==========================================
   TARJETA DE PUBLICACIÓN APROBADA
========================================== */

function CommunityPostCard({
  item,
  variant = "community",
}) {
  const image = getNewsImage(item);
  const [failedImage, setFailedImage] = useState(null);

  return (
    <article className={styles.newsCard}>
      {image && failedImage !== image && (
        <div className={styles.cardVisual}>
          <img
            src={image}
            alt={item.image_alt || item.title}
            loading="lazy"
            decoding="async"
            onError={() => setFailedImage(image)}
          />
        </div>
      )}

      <div className={styles.cardContent}>
        <div className={styles.meta}>
          <span className={styles.metaCategory}>
            {item.category || "General"}
          </span>

          <span>
            {formatDate(
              item.published_at || item.created_at
            )}
          </span>
        </div>

        <h3 className={styles.cardTitle}>
          {item.title}
        </h3>

        <p className={styles.communityContent}>
          {truncateText(item.content, 320)}
        </p>

        <p className={styles.sectionSource}>
          {variant === "opportunities"
            ? "Aporte de la comunidad"
            : "Publicación aprobada"}
        </p>
      </div>
    </article>
  );
}

/* ==========================================
   PÁGINA PRINCIPAL
========================================== */

export default function NewsPage() {
  const { hasPermission } = useAuth();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [newsReloadKey, setNewsReloadKey] = useState(0);

  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState("");
  const [communityReloadKey, setCommunityReloadKey] = useState(0);

  const [opportunityPosts, setOpportunityPosts] = useState([]);
  const [opportunityLoading, setOpportunityLoading] = useState(true);
  const [opportunityError, setOpportunityError] = useState("");
  const [opportunityReloadKey, setOpportunityReloadKey] = useState(0);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [activeSection, setActiveSection] = useState("news");
  const [newsCategory, setNewsCategory] = useState("TODAS");
  const [opportunityCategory, setOpportunityCategory] =
    useState("TODAS");

  const canCreateNews = hasPermission("news.create");
  const canEditNews = hasPermission("news.edit");
  const canDeleteNews = hasPermission("news.delete");

  const canCreateCommunityPost = hasPermission(
    "community_posts.create"
  );

  const canOpenModeration = hasPermission(
    "community_posts.moderate"
  );

  /* NOTICIAS */

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setNewsError("");

      try {
        const items = await fetchItems(
          "/news",
          controller.signal
        );

        if (!controller.signal.aborted) {
          setNews(items);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setNewsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => controller.abort();
  }, [newsReloadKey]);

  /* COMUNIDAD */

  useEffect(() => {
    const controller = new AbortController();

    async function loadCommunityPosts() {
      setCommunityLoading(true);
      setCommunityError("");

      try {
        const items = await fetchItems(
          "/community-posts/feed?section=community",
          controller.signal
        );

        if (!controller.signal.aborted) {
          setCommunityPosts(items);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setCommunityError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCommunityLoading(false);
        }
      }
    }

    loadCommunityPosts();

    return () => controller.abort();
  }, [communityReloadKey]);

  /* OPORTUNIDADES */

  useEffect(() => {
    const controller = new AbortController();

    async function loadOpportunityPosts() {
      setOpportunityLoading(true);
      setOpportunityError("");

      try {
        const items = await fetchItems(
          "/community-posts/feed?section=opportunities",
          controller.signal
        );

        if (!controller.signal.aborted) {
          setOpportunityPosts(items);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setOpportunityError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setOpportunityLoading(false);
        }
      }
    }

    loadOpportunityPosts();

    return () => controller.abort();
  }, [opportunityReloadKey]);

  /* FILTROS */

  const publishedNews = useMemo(() => {
    return news
      .filter((item) => {
        const status = String(
          item.status || item.estado || "published"
        ).toLowerCase();

        return [
          "published",
          "publicado",
          "publicada",
        ].includes(status);
      })
      .sort((a, b) => getTimestamp(b) - getTimestamp(a));
  }, [news]);

  const newsCategories = useMemo(() => {
    return [
      "TODAS",
      ...new Set(
        publishedNews.map(getNewsCategory).filter(Boolean)
      ),
    ];
  }, [publishedNews]);

  const filteredNews = useMemo(() => {
    if (newsCategory === "TODAS") {
      return publishedNews;
    }

    return publishedNews.filter(
      (item) => getNewsCategory(item) === newsCategory
    );
  }, [publishedNews, newsCategory]);

  const opportunityCategories = useMemo(() => {
    return [
      "TODAS",
      ...new Set(
        opportunityPosts
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];
  }, [opportunityPosts]);

  const filteredOpportunities = useMemo(() => {
    if (opportunityCategory === "TODAS") {
      return opportunityPosts;
    }

    return opportunityPosts.filter(
      (item) => item.category === opportunityCategory
    );
  }, [opportunityPosts, opportunityCategory]);

  const sortedCommunityPosts = useMemo(() => {
    return [...communityPosts].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a)
    );
  }, [communityPosts]);

  const featuredNews = filteredNews[0] ?? null;
  const remainingNews = filteredNews.slice(1);

  /* ELIMINACIÓN DE NOTICIAS */

  async function handleDelete(newsId) {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta noticia?"
    );

    if (!confirmed) return;

    setDeletingId(newsId);
    setDeleteError("");

    try {
      const response = await fetch(`/news/${newsId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "No fue posible eliminar la noticia."
        );
      }

      setNews((current) =>
        current.filter(
          (item) => getNewsId(item) !== newsId
        )
      );
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      className={styles.newsPage}
      aria-labelledby="news-page-title"
    >
      {/* ENCABEZADO */}

      <ScrollReveal>
        <header className={styles.pageIntro}>
          <p className={styles.eyebrow}>
            Comunidad GENSTI
          </p>

          <h1
            id="news-page-title"
            className={styles.pageTitle}
          >
            Actualidad y oportunidades
          </h1>

          <p className={styles.pageDescription}>
            Descubre las novedades de Ingeniería de Sistemas
            y explora oportunidades compartidas por la comunidad.
          </p>

          {canCreateCommunityPost && (
            <div className={styles.publishBanner}>
              <span
                className={styles.publishIcon}
                aria-hidden="true"
              >
                <Send size={23} strokeWidth={1.7} />
              </span>

              <div className={styles.publishCopy}>
                <h2>Tu comunidad también tiene algo que contar</h2>

                <p>
                  Comparte una iniciativa, un logro o una convocatoria.
                  Tu publicación pasará por revisión antes de aparecer.
                </p>
              </div>

              <div className={styles.publishActions}>
                <Link
                  to="/comunidad/publicaciones"
                  className={styles.primaryAction}
                >
                  <Plus size={18} aria-hidden="true" />
                  Crear publicación
                </Link>
              </div>
            </div>
          )}

          {canCreateNews && (
            <div className={styles.newsAdminBanner}>
              <span
                className={styles.newsAdminIcon}
                aria-hidden="true"
              >
                <Newspaper size={23} strokeWidth={1.7} />
              </span>

              <div className={styles.newsAdminCopy}>
                <h2>Publicación institucional</h2>

                <p>
                  Crea una noticia oficial para informar a la comunidad
                  sobre novedades, actividades y comunicados de GENSTI.
                </p>
              </div>

              <Link
                to="/admin/noticias/crear"
                className={styles.newsAdminAction}
              >
                <Sparkles size={18} aria-hidden="true" />
                Crear noticia
              </Link>
            </div>
          )}

          {canOpenModeration && (
            <div className={styles.managementLinks}>
              <Link
                to="/admin/comunidad/publicaciones"
                className={styles.secondaryAction}
              >
                <ClipboardCheck
                  size={17}
                  aria-hidden="true"
                />
                Moderar publicaciones
              </Link>
            </div>
          )}
        </header>
      </ScrollReveal>

      {/* SECCIONES */}

      <nav
        className={styles.tabs}
        aria-label="Secciones de actualidad"
      >
        <button
          type="button"
          className={`${styles.tab} ${
            activeSection === "news"
              ? styles.tabActive
              : ""
          }`}
          aria-pressed={activeSection === "news"}
          aria-controls="news-section-content"
          onClick={() => setActiveSection("news")}
        >
          Noticias
          <span className={styles.tabCount}>
            {publishedNews.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tab} ${
            activeSection === "opportunities"
              ? styles.tabActive
              : ""
          }`}
          aria-pressed={activeSection === "opportunities"}
          aria-controls="news-section-content"
          onClick={() => setActiveSection("opportunities")}
        >
          Oportunidades
          <span className={styles.tabCount}>
            {opportunityPosts.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tab} ${
            activeSection === "community"
              ? styles.tabActive
              : ""
          }`}
          aria-pressed={activeSection === "community"}
          aria-controls="news-section-content"
          onClick={() => setActiveSection("community")}
        >
          Comunidad
          <span className={styles.tabCount}>
            {communityPosts.length}
          </span>
        </button>
      </nav>

      <div id="news-section-content">
        {/* NOTICIAS */}

        {activeSection === "news" && (
          <section aria-labelledby="news-section-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2
                  id="news-section-title"
                  className={styles.sectionTitle}
                >
                  Noticias de GENSTI
                </h2>

                <p className={styles.sectionDescription}>
                  Información, novedades y actividades de interés.
                </p>
              </div>
            </div>

            <div
              className={styles.categoryFilters}
              role="group"
              aria-label="Filtrar noticias por categoría"
            >
              {newsCategories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`${styles.categoryButton} ${
                    newsCategory === category
                      ? styles.categoryButtonActive
                      : ""
                  }`}
                  aria-pressed={newsCategory === category}
                  onClick={() => setNewsCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {deleteError && (
              <p
                className={styles.errorMessage}
                role="alert"
              >
                {deleteError}
              </p>
            )}

            {loading ? (
              <p
                className={styles.loadingState}
                role="status"
              >
                Cargando noticias...
              </p>
            ) : newsError ? (
              <div
                className={styles.emptyState}
                role="alert"
              >
                <h3>No pudimos cargar las noticias</h3>
                <p>{newsError}</p>

                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() =>
                    setNewsReloadKey((value) => value + 1)
                  }
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No hay noticias en esta categoría</h3>
                <p>
                  Prueba con otra categoría o vuelve más tarde.
                </p>
              </div>
            ) : (
              <>
                {featuredNews && (
                  <ScrollReveal>
                    <NewsCard
                      item={featuredNews}
                      featured
                      canEdit={canEditNews}
                      canDelete={canDeleteNews}
                      deletingId={deletingId}
                      onDelete={handleDelete}
                    />
                  </ScrollReveal>
                )}

                {remainingNews.length > 0 && (
                  <>
                    <div className={styles.sectionHeading}>
                      <div>
                        <h2 className={styles.sectionTitle}>
                          Más noticias
                        </h2>

                        <p className={styles.sectionDescription}>
                          Sigue explorando la actualidad de GENSTI.
                        </p>
                      </div>
                    </div>

                    <div className={styles.newsGrid}>
                      {remainingNews.map((item) => (
                        <ScrollReveal key={getNewsId(item)}>
                          <NewsCard
                            item={item}
                            canEdit={canEditNews}
                            canDelete={canDeleteNews}
                            deletingId={deletingId}
                            onDelete={handleDelete}
                          />
                        </ScrollReveal>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {/* OPORTUNIDADES */}

        {activeSection === "opportunities" && (
          <section aria-labelledby="opportunities-section-title">
            <div className={styles.opportunitiesIntro}>
              <div className={styles.opportunitiesIntroText}>
                <p className={styles.eyebrow}>
                  Da el siguiente paso
                </p>

                <h2
                  id="opportunities-section-title"
                  className={styles.sectionTitle}
                >
                  Oportunidades para crecer
                </h2>

                <p className={styles.sectionDescription}>
                  Becas, prácticas, empleos, convocatorias, talleres
                  y actividades académicas compartidas por la comunidad.
                </p>
              </div>

              {canCreateCommunityPost && (
                <Link
                  to="/comunidad/publicaciones"
                  className={styles.primaryAction}
                >
                  <Plus size={18} aria-hidden="true" />
                  Compartir oportunidad
                </Link>
              )}
            </div>

            <div
              className={styles.categoryFilters}
              role="group"
              aria-label="Filtrar oportunidades"
            >
              {opportunityCategories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`${styles.categoryButton} ${
                    opportunityCategory === category
                      ? styles.categoryButtonActive
                      : ""
                  }`}
                  aria-pressed={
                    opportunityCategory === category
                  }
                  onClick={() =>
                    setOpportunityCategory(category)
                  }
                >
                  {category}
                </button>
              ))}
            </div>

            {opportunityLoading ? (
              <p
                className={styles.loadingState}
                role="status"
              >
                Cargando oportunidades...
              </p>
            ) : opportunityError ? (
              <div
                className={styles.emptyState}
                role="alert"
              >
                <h3>No pudimos cargar las oportunidades</h3>
                <p>{opportunityError}</p>

                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() =>
                    setOpportunityReloadKey(
                      (value) => value + 1
                    )
                  }
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>
                  No hay oportunidades en esta categoría
                </h3>

                <p>
                  Cuando el equipo de moderación apruebe
                  convocatorias, aparecerán aquí.
                </p>

                {canCreateCommunityPost && (
                  <Link
                    to="/comunidad/publicaciones"
                    className={styles.primaryAction}
                  >
                    <Plus size={18} aria-hidden="true" />
                    Compartir una oportunidad
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className={styles.sectionHeading}>
                  <div>
                    <h3 className={styles.sectionTitle}>
                      {filteredOpportunities.length}{" "}
                      {filteredOpportunities.length === 1
                        ? "oportunidad disponible"
                        : "oportunidades disponibles"}
                    </h3>

                    <p className={styles.sectionDescription}>
                      Revisa la información y confirma siempre
                      los datos con la fuente oficial.
                    </p>
                  </div>
                </div>

                <div className={styles.newsGrid}>
                  {filteredOpportunities.map((item) => (
                    <ScrollReveal key={item.id}>
                      <CommunityPostCard
                        item={item}
                        variant="opportunities"
                      />
                    </ScrollReveal>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* COMUNIDAD */}

        {activeSection === "community" && (
          <section aria-labelledby="community-section-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2
                  id="community-section-title"
                  className={styles.sectionTitle}
                >
                  Lo que comparte nuestra comunidad
                </h2>

                <p className={styles.sectionDescription}>
                  Iniciativas, experiencias y publicaciones
                  aprobadas por el equipo de moderación.
                </p>
              </div>

              {canCreateCommunityPost && (
                <Link
                  to="/comunidad/publicaciones"
                  className={styles.primaryAction}
                >
                  <Plus size={18} aria-hidden="true" />
                  Crear publicación
                </Link>
              )}
            </div>

            {communityLoading ? (
              <p
                className={styles.loadingState}
                role="status"
              >
                Cargando publicaciones...
              </p>
            ) : communityError ? (
              <div
                className={styles.emptyState}
                role="alert"
              >
                <h3>No pudimos cargar las publicaciones</h3>
                <p>{communityError}</p>

                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() =>
                    setCommunityReloadKey(
                      (value) => value + 1
                    )
                  }
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            ) : sortedCommunityPosts.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>Todavía no hay publicaciones aprobadas</h3>

                <p>
                  Cuando el equipo de moderación apruebe
                  contenido, aparecerá en esta sección.
                </p>

                {canCreateCommunityPost && (
                  <Link
                    to="/comunidad/publicaciones"
                    className={styles.primaryAction}
                  >
                    <Plus size={18} aria-hidden="true" />
                    Crear la primera publicación
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.newsGrid}>
                {sortedCommunityPosts.map((item) => (
                  <ScrollReveal key={item.id}>
                    <CommunityPostCard
                      item={item}
                      variant="community"
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}