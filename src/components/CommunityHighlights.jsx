import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  m,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import ScrollReveal from "./ScrollReveal";
import styles from "../styles/CommunityHighlights.module.css";

/* ==========================================
   FOTOGRAFÍA PRINCIPAL
========================================== */

function FeaturedPhoto({ highlight }) {
  const featuredRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: featuredRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    ["-6%", "6%"]
  );

  return (
    <ScrollReveal
      className={styles.featuredReveal}
      delay={0.08}
    >
      <div
        ref={featuredRef}
        className={styles.featuredScrollTarget}
      >
        <Link
          to="/botg"
          className={styles.featuredCard}
          aria-label={`${highlight.title}. Explorar TBOG`}
        >
          <div className={styles.featuredImageWindow}>
            <m.img
              src={highlight.image}
              alt={highlight.image_alt || ""}
              className={styles.featuredImage}
              loading="lazy"
              decoding="async"
              style={{
                y: prefersReducedMotion ? 0 : imageY,
                objectPosition:
                  highlight.image_position || "center",
              }}
            />
          </div>

          <span
            className={styles.imageShade}
            aria-hidden="true"
          />

          <div className={styles.featuredContent}>
            <h3 className={styles.featuredTitle}>
              {highlight.title}
            </h3>

            <span
              className={styles.cardArrow}
              aria-hidden="true"
            >
              <ArrowUpRight size={23} strokeWidth={1.7} />
            </span>
          </div>
        </Link>
      </div>
    </ScrollReveal>
  );
}

/* ==========================================
   FOTOGRAFÍAS SECUNDARIAS
========================================== */

function SecondaryPhoto({ highlight, index }) {
  return (
    <ScrollReveal
      className={styles.secondaryReveal}
      delay={0.14 + Math.min(index, 4) * 0.08}
    >
      <Link
        to="/botg"
        className={styles.secondaryCard}
        aria-label={`${highlight.title}. Explorar TBOG`}
      >
        <div className={styles.secondaryImageWindow}>
          <img
            src={highlight.image}
            alt={highlight.image_alt || ""}
            className={styles.secondaryImage}
            loading="lazy"
            decoding="async"
            style={{
              objectPosition:
                highlight.image_position || "center",
            }}
          />
        </div>

        <span
          className={styles.imageShade}
          aria-hidden="true"
        />

        <div className={styles.secondaryContent}>
          <h3 className={styles.secondaryTitle}>
            {highlight.title}
          </h3>

          <span
            className={styles.cardArrow}
            aria-hidden="true"
          >
            <ArrowUpRight size={20} strokeWidth={1.7} />
          </span>
        </div>
      </Link>
    </ScrollReveal>
  );
}

/* ==========================================
   SECCIÓN PÚBLICA
========================================== */

function CommunityHighlights() {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHighlights() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/community-highlights", {
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `No fue posible cargar las fotografías (${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "La API devolvió un formato de fotografías inesperado."
          );
        }

        if (controller.signal.aborted) return;

        // La API ya devuelve las fotografías publicadas y ordenadas.
        setHighlights(
          data.filter((item) => item && item.id && item.image)
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || "No fue posible cargar las fotografías."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHighlights();

    return () => controller.abort();
  }, [reloadKey]);

  const [mainHighlight, ...secondaryHighlights] = highlights;

  // Sin publicaciones, la sección no ocupa espacio en el inicio.
  if (!loading && !error && !mainHighlight) {
    return null;
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="community-highlights-title"
      aria-busy={loading}
    >
      <div className={styles.container}>
        <ScrollReveal className={styles.sectionHeader}>
          <div className={styles.heading}>
            <span className={styles.sectionLabel}>
              GENSTI EN MOVIMIENTO
            </span>

            <h2
              id="community-highlights-title"
              className={styles.sectionTitle}
            >
              Una comunidad que también se vive
            </h2>
          </div>

          <Link
            to="/botg"
            className={styles.mainLink}
          >
            Explorar TBOG

            <ArrowUpRight
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>
        </ScrollReveal>

        {loading ? (
          <div
            className={styles.loadingState}
            role="status"
          >
            <span
              className={styles.loadingIndicator}
              aria-hidden="true"
            />
            <span>Cargando momentos de nuestra comunidad...</span>
          </div>
        ) : error ? (
          <div
            className={styles.errorState}
            role="alert"
          >
            <p>{error}</p>

            <button
              type="button"
              className={styles.retryButton}
              onClick={() =>
                setReloadKey((value) => value + 1)
              }
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <div
            className={[
              styles.gallery,
              secondaryHighlights.length === 0
                ? styles.singlePhoto
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <FeaturedPhoto highlight={mainHighlight} />

            {secondaryHighlights.length > 0 && (
              <div className={styles.secondaryGrid}>
                {secondaryHighlights.map((highlight, index) => (
                  <SecondaryPhoto
                    key={highlight.id}
                    highlight={highlight}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default CommunityHighlights;