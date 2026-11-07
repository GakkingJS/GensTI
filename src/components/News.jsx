import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { news as staticNews } from "../data/news";
import ScrollReveal from "./ScrollReveal";

function News() {
  const [news, setNews] = useState(staticNews);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentNews() {
      try {
        const response = await fetch("/news?limit=4", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("No fue posible cargar las noticias");
        }

        const data = await response.json();

        if (!cancelled) {
          setNews(data);
        }
      } catch {
        if (!cancelled) {
          setNews(staticNews);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecentNews();

    return () => {
      cancelled = true;
    };
  }, []);

  const recentNews = news
    .filter((item) => item.status === "published")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const featuredNews =
    recentNews.find((item) => item.featured) || recentNews[0];

  const secondaryNews = recentNews
    .filter((item) => item.id !== featuredNews?.id)
    .slice(0, 3);

  if (loading) {
    return (
      <section
        className="section home-news-section"
        id="noticias"
      >
        <p className="news-empty-state">
          Cargando noticias...
        </p>
      </section>
    );
  }

  return (
    <section
      className="section home-news-section"
      id="noticias"
    >
      <ScrollReveal className="section-header">
        <div>
          <span className="section-label">RECIENTE</span>
          <h2>Lo último de GensTI</h2>
        </div>

        <Link to="/noticias">
          Ver todas →
        </Link>
      </ScrollReveal>

      <div className="home-news-layout">
        {featuredNews && (
          <ScrollReveal
            className="home-featured-news-reveal"
            delay={0.08}
          >
            <article className="home-featured-news">
              <div className="home-featured-news-visual">
                {featuredNews.image ? (
                  <img
                    src={featuredNews.image}
                    alt={featuredNews.title}
                  />
                ) : (
                  <span>GENSTI</span>
                )}
              </div>

              <div className="home-featured-news-content">
                <span className="tag">
                  {featuredNews.category}
                </span>

                <h3>{featuredNews.title}</h3>

                <p>{featuredNews.excerpt}</p>

                <span className="date">
                  {featuredNews.displayDate}
                </span>

                <Link
                  className="news-card-link"
                  to={`/noticias/${featuredNews.id}`}
                >
                  Leer noticia →
                </Link>
              </div>
            </article>
          </ScrollReveal>
        )}

        <div className="home-secondary-news">
          {secondaryNews.map((item, index) => (
            <ScrollReveal
              key={item.id}
              className="home-secondary-news-reveal"
              delay={0.14 + index * 0.09}
            >
              <article className="home-secondary-news-item">
                <div className="home-secondary-news-visual">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                    />
                  ) : (
                    <span>{item.category}</span>
                  )}
                </div>

                <div>
                  <span className="tag">
                    {item.category}
                  </span>

                  <h3>{item.title}</h3>

                  <span className="date">
                    {item.displayDate}
                  </span>

                  <Link
                    className="text-link"
                    to={`/noticias/${item.id}`}
                  >
                    Leer más →
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default News;