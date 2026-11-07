import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { communityHighlights as staticHighlights } from "../data/community";
import ScrollReveal from "./ScrollReveal";

function CommunityHighlights() {
  const [highlights, setHighlights] = useState(staticHighlights);
  const [loading, setLoading] = useState(true);

  const [mainHighlight, ...secondaryHighlights] = highlights;

  const featuredRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: featuredRef,
    offset: ["start end", "end start"],
  });

  const featuredImageY = useTransform(
    scrollYProgress,
    [0, 1],
    ["-8%", "8%"]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHighlights() {
      try {
        const response = await fetch("/community-highlights", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("No fue posible cargar los destacados");
        }

        const data = await response.json();

        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setHighlights(data);
        }
      } catch {
        if (!cancelled) {
          setHighlights(staticHighlights);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHighlights();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !mainHighlight) {
    return null;
  }

  return (
    <section className="community-section">
      <ScrollReveal className="community-section-header">
        <div>
          <span className="section-label">
            GENSTI EN MOVIMIENTO
          </span>

          <h2>Una comunidad que también se vive</h2>

          <p>
            Viajes, encuentros, talleres y experiencias que conectan a quienes
            hacen parte de Ingeniería de Sistemas.
          </p>
        </div>

        <Link
          className="community-main-link"
          to="/eventos"
        >
          Explorar eventos

          <ArrowUpRight
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Link>
      </ScrollReveal>

      <div className="community-gallery">
        <ScrollReveal
          className="community-featured-reveal"
          delay={0.08}
        >
          <div
            className="community-featured-scroll-target"
            ref={featuredRef}
          >
            <Link
              className="community-featured"
              to={`/eventos/${mainHighlight.eventId}`}
            >
              <div className="community-featured-image-window">
                <m.img
                  src={mainHighlight.image}
                  alt={mainHighlight.title}
                  style={{
                    y: featuredImageY,
                  }}
                />
              </div>

              <div className="community-overlay">
                <span>{mainHighlight.category}</span>

                <h3>{mainHighlight.title}</h3>

                <p>{mainHighlight.description}</p>
              </div>
            </Link>
          </div>
        </ScrollReveal>

        <div className="community-secondary">
          {secondaryHighlights.map((highlight, index) => (
            <ScrollReveal
              key={highlight.id}
              className="community-secondary-reveal"
              delay={0.14 + index * 0.1}
            >
              <Link
                className="community-secondary-card"
                to={`/eventos/${highlight.eventId}`}
              >
                <div className="community-secondary-image-window">
                  <img
                    src={highlight.image}
                    alt={highlight.title}
                  />
                </div>

                <div className="community-secondary-overlay">
                  <span>{highlight.category}</span>
                  <h3>{highlight.title}</h3>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommunityHighlights;