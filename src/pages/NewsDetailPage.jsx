import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { news as staticNews } from "../data/news";
import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/NewsPage.module.css";

function NewsDetailPage() {
  const { id } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/news/${id}`, {
          credentials: "include",
        });

        if (response.status === 404) {
          if (!cancelled) {
            setArticle(null);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("No fue posible cargar la noticia");
        }

        const data = await response.json();

        if (!cancelled) {
          setArticle(data);
        }
      } catch (requestError) {
        const localArticle = staticNews.find(
          (item) => item.id === id && item.status === "published"
        );

        if (!cancelled) {
          if (localArticle) {
            setArticle(localArticle);
            setError(
              "No fue posible conectar con el servidor. Mostrando la versión local."
            );
          } else {
            setArticle(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="news-not-found">
        <span className="section-label">GENSTI</span>
        <h1>Cargando noticia...</h1>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="news-not-found">
        <span className="section-label">GENSTI</span>
        <h1>Noticia no encontrada</h1>
        <p>La noticia que buscas no existe o ya no está publicada.</p>

        <Link className="news-main-link" to="/noticias">
          Volver a noticias →
        </Link>
      </section>
    );
  }

  return (
    <article className="news-detail-page">
      <Link className="back-link" to="/noticias">
        ← Volver a noticias
      </Link>

      {error && (
        <p className="news-empty-state" role="status">
          {error}
        </p>
      )}

      <header className="news-detail-header">
        <span className="tag">{article.category}</span>
        <h1>{article.title}</h1>
        <p>{article.excerpt}</p>

        <div className="news-meta news-detail-meta">
          <span>{article.displayDate}</span>
          <span>Publicado por {article.author}</span>
        </div>
      </header>

      <div className="news-detail-layout">
        <div className="news-detail-main">
          <div className="news-detail-image">
            {article.image ? (
              <img src={article.image} alt={article.title} />
            ) : (
              <span>GENSTI</span>
            )}
          </div>

          <div className="news-detail-content">
            {article.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="news-detail-actions">
            <button type="button">
              ♡ {article.likes} me gusta
            </button>

            {article.externalUrl && (
              <a
                href={article.externalUrl}
                target="_blank"
                rel="noreferrer"
              >
                Consultar sitio oficial ↗
              </a>
            )}
          </div>
        </div>

        <aside className="news-detail-aside">
          <span className="section-label">INFORMACIÓN</span>
          <strong>{article.category}</strong>
          <span>{article.displayDate}</span>
          <span>{article.author}</span>
        </aside>
      </div>
    </article>
  );
}

export default NewsDetailPage;