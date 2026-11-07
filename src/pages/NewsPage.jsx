import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { news as staticNews } from "../data/news";
import { opportunities, opportunityCategories } from "../data/opportunities";
import { useAuth } from "../context/AuthContext";
import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/NewsPage.module.css";

 
function formatDate(value) {
  if (!value) return "Fecha por confirmar";


  const date = new Date(
    String(value).length === 10 ? `${value}T12:00:00` : value
  );


  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";


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
  return item.image_url || item.image || item.cover_image || item.imagen || "";
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
  return item.title || item.titulo || "Noticia";
}


function getNewsId(item) {
  return item.id ?? item.news_id;
}


function getPermissionChecker(auth) {
  return (permission) => {
    if (typeof auth?.hasPermission === "function") {
      return auth.hasPermission(permission);
    }


    if (typeof auth?.can === "function") {
      return auth.can(permission);
    }


    const permissions =
      auth?.permissions ||
      auth?.user?.permissions ||
      auth?.profile?.permissions ||
      [];


    if (Array.isArray(permissions)) {
      return permissions.some((item) =>
        typeof item === "string"
          ? item === permission
          : item?.name === permission || item?.code === permission
      );
    }


    if (permissions && typeof permissions === "object") {
      return Boolean(permissions[permission]);
    }


    return false;
  };
}


function NewsImage({ item, featured = false }) {
  const image = getNewsImage(item);
  const placeholderClass = featured
    ? styles.featuredPlaceholder
    : styles.cardPlaceholder;


  if (!image) {
    return (
      <div className={placeholderClass} aria-label="Noticia sin imagen">
        <span>GENSTI</span>
      </div>
    );
  }


  return (
    <img
      src={image}
      alt={getNewsTitle(item)}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}


function AdminActions({ item, canEdit, canDelete, deletingId, onDelete }) {
  const id = getNewsId(item);


  if (!canEdit && !canDelete) return null;


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
          className={`${styles.adminButton} ${styles.deleteButton}`}
          type="button"
          disabled={deletingId === id}
          onClick={() => onDelete(id)}
        >
          {deletingId === id ? "Eliminando..." : "Eliminar"}
        </button>
      )}
    </div>
  );
}


export default function NewsPage() {
  const auth = useAuth();
  const can = useMemo(() => getPermissionChecker(auth), [auth]);


  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);


  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);


  const [activeSection, setActiveSection] = useState("news");
  const [newsCategory, setNewsCategory] = useState("TODAS");
  const [opportunityCategory, setOpportunityCategory] = useState("TODAS");


  const canCreate = can("news.create");
  const canEdit = can("news.edit");
  const canDelete = can("news.delete");


  const canCreateCommunityPost = can("community_posts.create");
  const canModerateCommunityPosts = can("community_posts.moderate");


  useEffect(() => {
    let active = true;


    async function loadNews() {
      setLoading(true);
      setError("");


      try {
        const response = await fetch("/news", {
          credentials: "include",
        });


        if (!response.ok) {
          throw new Error("No fue posible cargar las noticias.");
        }


        const data = await response.json();
        const items = Array.isArray(data)
          ? data
          : data.items || data.news || [];


        if (active) {
          setNews(items);
        }
      } catch {
        if (active) {
          setNews(staticNews);
          setError(
            "No se pudo consultar el servidor. Se muestran las noticias de ejemplo disponibles."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }


    loadNews();


    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    let active = true;


    async function loadCommunityPosts() {
      setCommunityLoading(true);


      try {
        const response = await fetch("/community-posts/feed", {
          credentials: "include",
        });


        if (!response.ok) {
          throw new Error();
        }


        const data = await response.json();


        if (active) {
          setCommunityPosts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setCommunityPosts([]);
        }
      } finally {
        if (active) {
          setCommunityLoading(false);
        }
      }
    }


    loadCommunityPosts();


    return () => {
      active = false;
    };
  }, []);


  const publishedNews = useMemo(() => {
    return news
      .filter((item) => {
        const status = String(item.status || item.estado || "published")
          .toLowerCase();


        return ["published", "publicado", "publicada"].includes(status);
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.published_at || a.created_at || a.fecha_publicacion || 0
        ).getTime();


        const dateB = new Date(
          b.published_at || b.created_at || b.fecha_publicacion || 0
        ).getTime();


        return dateB - dateA;
      });
  }, [news]);


  const newsCategories = useMemo(() => {
    const categories = [
      ...new Set(publishedNews.map(getNewsCategory).filter(Boolean)),
    ];


    return ["TODAS", ...categories];
  }, [publishedNews]);


  const filteredNews = useMemo(() => {
    if (newsCategory === "TODAS") return publishedNews;


    return publishedNews.filter(
      (item) => getNewsCategory(item) === newsCategory
    );
  }, [publishedNews, newsCategory]);


  const featuredNews = filteredNews[0] || null;
  const remainingNews = filteredNews.slice(1);


  const filteredOpportunities = useMemo(() => {
    if (opportunityCategory === "TODAS") return opportunities;


    return opportunities.filter(
      (item) => item.category === opportunityCategory
    );
  }, [opportunityCategory]);


  async function handleDelete(newsId) {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta noticia?"
    );


    if (!confirmed) return;


    setDeletingId(newsId);
    setError("");


    try {
      const response = await fetch(`/news/${newsId}`, {
        method: "DELETE",
        credentials: "include",
      });


      if (!response.ok) {
        throw new Error("No fue posible eliminar la noticia.");
      }


      setNews((current) =>
        current.filter((item) => getNewsId(item) !== newsId)
      );
    } catch (deleteError) {
      setError(
        deleteError.message || "Ocurrió un error al eliminar la noticia."
      );
    } finally {
      setDeletingId(null);
    }
  }


  return (
    <main className={styles.newsPage}>
      <ScrollReveal>
        <header className={styles.pageIntro}>
          <p className={styles.eyebrow}>Comunidad GENSTI</p>
          <h1 className={styles.pageTitle}>Actualidad y oportunidades</h1>
          <p className={styles.pageDescription}>
            Mantente al día con las novedades de la comunidad y descubre
            oportunidades para aprender, participar y crecer profesionalmente.
          </p>
        </header>
      </ScrollReveal>


      <nav className={styles.tabs} aria-label="Secciones de actualidad">
        <button
          type="button"
          className={`${styles.tab} ${
            activeSection === "news" ? styles.tabActive : ""
          }`}
          aria-pressed={activeSection === "news"}
          onClick={() => setActiveSection("news")}
        >
          Noticias
          <span className={styles.tabCount}>{publishedNews.length}</span>
        </button>


        <button
          type="button"
          className={`${styles.tab} ${
            activeSection === "opportunities" ? styles.tabActive : ""
          }`}
          aria-pressed={activeSection === "opportunities"}
          onClick={() => setActiveSection("opportunities")}
        >
          Oportunidades
          <span className={styles.tabCount}>{opportunities.length}</span>
        </button>


        <button
          type="button"
          className={`${styles.tab} ${
            activeSection === "community" ? styles.tabActive : ""
          }`}
          aria-pressed={activeSection === "community"}
          onClick={() => setActiveSection("community")}
        >
          Comunidad
          <span className={styles.tabCount}>{communityPosts.length}</span>
        </button>
      </nav>


      {error && <p className={styles.errorMessage}>{error}</p>}


      {activeSection === "news" && (
        <section aria-label="Noticias de GENSTI">
          <div className={styles.sectionHeading}>
            <div>
              <h2 className={styles.sectionTitle}>Noticias de la comunidad</h2>
              <p className={styles.sectionDescription}>
                Información, novedades y actividades de interés.
              </p>
            </div>


            {canCreate && (
              <Link
                className={styles.adminButton}
                to="/admin/noticias/crear"
              >
                Crear noticia
              </Link>
            )}
          </div>


          <div className={styles.categoryFilters} aria-label="Filtrar noticias">
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


          {loading ? (
            <p className={styles.loadingState}>Cargando noticias...</p>
          ) : filteredNews.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No hay noticias para mostrar</h3>
              <p>
                Prueba con otra categoría o vuelve más tarde para consultar
                nuevas publicaciones.
              </p>
            </div>
          ) : (
            <>
              {featuredNews && (
                <ScrollReveal>
                  <article className={styles.featuredCard}>
                    <div className={styles.featuredVisual}>
                      <NewsImage item={featuredNews} featured />
                      <span className={styles.featuredLabel}>Destacado</span>
                    </div>


                    <div className={styles.featuredContent}>
                      <div className={styles.meta}>
                        <span className={styles.metaCategory}>
                          {getNewsCategory(featuredNews)}
                        </span>
                        <span>
                          {formatDate(
                            featuredNews.published_at ||
                              featuredNews.created_at ||
                              featuredNews.fecha_publicacion
                          )}
                        </span>
                      </div>


                      <h2 className={styles.featuredTitle}>
                        {getNewsTitle(featuredNews)}
                      </h2>


                      <p className={styles.featuredSummary}>
                        {getNewsSummary(featuredNews)}
                      </p>


                      <Link
                        className={styles.textLink}
                        to={`/noticias/${getNewsId(featuredNews)}`}
                      >
                        Leer noticia <span aria-hidden="true">→</span>
                      </Link>


                      <AdminActions
                        item={featuredNews}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        deletingId={deletingId}
                        onDelete={handleDelete}
                      />
                    </div>
                  </article>
                </ScrollReveal>
              )}


              {remainingNews.length > 0 && (
                <>
                  <div className={styles.sectionHeading}>
                    <div>
                      <h2 className={styles.sectionTitle}>Más noticias</h2>
                      <p className={styles.sectionDescription}>
                        Otras publicaciones de la comunidad.
                      </p>
                    </div>
                  </div>


                  <div className={styles.newsGrid}>
                    {remainingNews.map((item) => (
                      <ScrollReveal key={getNewsId(item)}>
                        <article className={styles.newsCard}>
                          <div className={styles.cardVisual}>
                            <NewsImage item={item} />
                          </div>


                          <div className={styles.cardContent}>
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


                            <h3 className={styles.cardTitle}>
                              {getNewsTitle(item)}
                            </h3>


                            <p className={styles.cardSummary}>
                              {getNewsSummary(item)}
                            </p>


                            <Link
                              className={styles.textLink}
                              to={`/noticias/${getNewsId(item)}`}
                            >
                              Leer noticia <span aria-hidden="true">→</span>
                            </Link>


                            <AdminActions
                              item={item}
                              canEdit={canEdit}
                              canDelete={canDelete}
                              deletingId={deletingId}
                              onDelete={handleDelete}
                            />
                          </div>
                        </article>
                      </ScrollReveal>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}


      {activeSection === "community" && (
        <section aria-label="Publicaciones de la comunidad">
          <div className={styles.sectionHeading}>
            <div>
              <h2 className={styles.sectionTitle}>
                Publicaciones de la comunidad
              </h2>


              <p className={styles.sectionDescription}>
                Convocatorias, logros, actividades y oportunidades compartidas
                por estudiantes de Ingeniería de Sistemas.
              </p>
            </div>


            <div className={styles.adminActions}>
              {canCreateCommunityPost && (
                <Link
                  className={styles.adminButton}
                  to="/comunidad/publicaciones"
                >
                  Crear publicación
                </Link>
              )}


              {canModerateCommunityPosts && (
                <Link
                  className={styles.adminButton}
                  to="/admin/comunidad/publicaciones"
                >
                  Moderar publicaciones
                </Link>
              )}
            </div>
          </div>


          {communityLoading ? (
            <p className={styles.loadingState}>
              Cargando publicaciones...
            </p>
          ) : communityPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No hay publicaciones publicadas</h3>
              <p>
                Cuando el equipo de moderación apruebe publicaciones,
                aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className={styles.newsGrid}>
              {communityPosts.map((post) => (
                <ScrollReveal key={post.id}>
                  <article className={styles.newsCard}>
                    <div className={styles.cardContent}>
                      <div className={styles.meta}>
                        <span className={styles.metaCategory}>
                          {post.category}
                        </span>


                        <span>
                          {formatDate(post.created_at)}
                        </span>
                      </div>


                      <h3 className={styles.cardTitle}>
                        {post.title}
                      </h3>


                      <p className={styles.cardSummary}>
                        {post.content}
                      </p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>
      )}


      {activeSection === "opportunities" && (
        <section aria-label="Oportunidades y convocatorias">
          <div className={styles.opportunitiesIntro}>
            <div className={styles.opportunitiesIntroText}>
              <p className={styles.eyebrow}>Da el siguiente paso</p>
              <h2 className={styles.sectionTitle}>
                Oportunidades para crecer
              </h2>
              <p className={styles.sectionDescription}>
                Explora ejemplos de prácticas, becas, convocatorias, talleres y
                actividades académicas que podrían interesarte.
              </p>
            </div>
          </div>


          <p className={styles.opportunitiesNotice}>
            <strong>Contenido de demostración:</strong> estas oportunidades son
            ficticias y se muestran para probar la interfaz. Verifica siempre
            la información oficial antes de tomar decisiones o compartir
            documentos.
          </p>


          <div
            className={styles.categoryFilters}
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
                aria-pressed={opportunityCategory === category}
                onClick={() => setOpportunityCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>


          <div className={styles.sectionHeading}>
            <div>
              <h3 className={styles.sectionTitle}>
                {filteredOpportunities.length}{" "}
                {filteredOpportunities.length === 1
                  ? "oportunidad disponible"
                  : "oportunidades disponibles"}
              </h3>
              <p className={styles.sectionDescription}>
                Selecciona una tarjeta para consultar sus requisitos.
              </p>
            </div>
          </div>


          {filteredOpportunities.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No hay oportunidades en esta categoría</h3>
              <p>Prueba con otra categoría para explorar más opciones.</p>
            </div>
          ) : (
            <div className={styles.opportunitiesGrid}>
              {filteredOpportunities.map((opportunity) => (
                <ScrollReveal key={opportunity.id}>
                  <article className={styles.opportunityCard}>
                    <div className={styles.opportunityTop}>
                      <span className={styles.opportunityType}>
                        {opportunity.category}
                      </span>
                      <span className={styles.opportunityStatus}>
                        <span className={styles.statusDot} />
                        {opportunity.status}
                      </span>
                    </div>


                    <h3 className={styles.opportunityTitle}>
                      {opportunity.title}
                    </h3>


                    <p className={styles.opportunityDescription}>
                      {opportunity.description}
                    </p>


                    <div className={styles.opportunityMeta}>
                      <span>
                        <strong>Tipo:</strong> {opportunity.type}
                      </span>
                      <span>
                        <strong>Modalidad:</strong> {opportunity.modality}
                      </span>
                      <span>
                        <strong>Fecha de referencia:</strong>{" "}
                        {formatDate(opportunity.deadline)}
                      </span>
                    </div>


                    <details className={styles.opportunityDetails}>
                      <summary className={styles.detailsSummary}>
                        Consultar requisitos
                      </summary>
                      <div className={styles.expandedDetails}>
                        <ul>
                          {opportunity.requirements.map((requirement) => (
                            <li key={requirement}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    </details>


                    <p className={styles.demoCaption}>
                      Ejemplo de interfaz. No es una convocatoria oficial.
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}