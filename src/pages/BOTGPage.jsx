import { useEffect, useRef, useState } from "react";
import styles from "../styles/BestOfGensTI.module.css";

/* ==========================================
   CATEGORÍAS Y ADAPTACIÓN DE DATOS
========================================== */

const categories = [
  { id: "todos", label: "Todo lo destacado" },
  { id: "semilleros", label: "Semilleros" },
  { id: "saber-pro", label: "Saber Pro" },
  { id: "proyectos", label: "Proyectos" },
  { id: "excelencia", label: "Excelencia académica" },
];

const CATEGORY_LABELS = {
  semilleros: "INVESTIGACIÓN",
  "saber-pro": "SABER PRO",
  proyectos: "INNOVACIÓN",
  excelencia: "EXCELENCIA ACADÉMICA",
};

function normalizeEntry(entry) {
  return {
    id: entry.id,
    category: entry.category,
    categoryLabel:
      entry.content_type === "gallery"
        ? "IMA-GENSTI"
        : CATEGORY_LABELS[entry.category] ?? "RECONOCIMIENTO",
    studentName: entry.student_name ?? "",
    title: entry.title,
    description: entry.description,
    period: entry.period ?? "",
    image: entry.image_url,
    imageAlt: entry.image_alt ?? "",
    imagePosition: entry.image_position ?? "center",
    featured: Boolean(entry.featured),
    isGallery: entry.content_type === "gallery",
  };
}

/* ==========================================
   ENTRADAS Y SALIDAS AL HACER SCROLL
========================================== */

function useRevealOnScroll(dependency) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const root = sectionRef.current;

    if (!root) return;

    const elements = root.querySelectorAll("[data-reveal]");
    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let observer;

    function configureObserver() {
      observer?.disconnect();

      if (
        motionQuery.matches ||
        !("IntersectionObserver" in window)
      ) {
        elements.forEach((element) => {
          element.classList.add(styles.isVisible);
        });

        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle(
              styles.isVisible,
              entry.isIntersecting
            );
          });
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -20px 0px",
        }
      );

      elements.forEach((element) => observer.observe(element));
    }

    configureObserver();

    motionQuery.addEventListener("change", configureObserver);

    return () => {
      observer?.disconnect();
      motionQuery.removeEventListener("change", configureObserver);
    };
  }, [dependency]);

  return sectionRef;
}

/* ==========================================
   COLIBRÍ ANIMADO
========================================== */

function HummingbirdMark() {
  return (
    <svg
      className={styles.hummingbird}
      viewBox="0 0 180 130"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className={styles.birdWingBack}
        d="M83 60 35 14 59 67 28 75 76 83Z"
        fill="currentColor"
      />

      <path
        className={styles.birdWingFront}
        d="M90 59 74 7 111 47 137 30 121 64Z"
        fill="#B9F3DF"
      />

      <path
        d="M88 63 148 41 119 69 100 82 76 78Z"
        fill="#38BFA0"
      />

      <path
        d="M115 60 173 46 123 69Z"
        fill="#FFFFFF"
      />

      <circle
        cx="111"
        cy="57"
        r="2.7"
        fill="#073B50"
      />

      <path
        d="M80 77 62 103 91 85 108 91 100 77Z"
        fill="#087E8B"
      />

      <path
        d="M61 69 22 58 58 78Z"
        fill="#38BFA0"
      />
    </svg>
  );
}

/* ==========================================
   MODAL DE HISTORIA O FOTOGRAFÍA
========================================== */

function RecognitionModal({ item, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    const modal = modalRef.current;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function getFocusableElements() {
      if (!modal) return [];

      return Array.from(
        modal.querySelectorAll(
          [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(",")
        )
      ).filter(
        (element) =>
          !element.closest("[hidden], [inert]") &&
          element.getClientRects().length > 0
      );
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (!firstElement) {
        event.preventDefault();
        modal?.focus();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !modal?.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !modal?.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    function keepFocusInside(event) {
      if (modal && !modal.contains(event.target)) {
        closeButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocusInside);

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocusInside);

      if (
        previousActiveElement instanceof HTMLElement &&
        previousActiveElement.isConnected
      ) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tbog-modal-title"
        aria-describedby="tbog-modal-description"
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Cerrar detalles"
        >
          ×
        </button>

        {item.image && (
          <div className={styles.modalImageWrap}>
            <img
              src={item.image}
              alt={item.imageAlt}
              className={styles.modalImage}
              style={{
                objectPosition: item.imagePosition,
              }}
            />
          </div>
        )}

        <div className={styles.modalContent}>
          <span className={styles.sectionIndex}>
            {item.categoryLabel}
          </span>

          <h2 id="tbog-modal-title">{item.title}</h2>

          {item.studentName && (
            <p className={styles.studentName}>
              {item.studentName}
            </p>
          )}

          <p id="tbog-modal-description">
            {item.description}
          </p>

          {item.period && (
            <span className={styles.modalPeriod}>
              {item.period}
            </span>
          )}

          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={onClose}
          >
            Volver a TBOG
            <span aria-hidden="true">←</span>
          </button>
        </div>
      </section>
    </div>
  );
}

/* ==========================================
   PÁGINA PRINCIPAL
========================================== */

function BOTGPage() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [selectedItem, setSelectedItem] = useState(null);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEntries() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/tbog/entries", {
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `No fue posible cargar TBOG (${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "La API devolvió un formato de contenido inesperado."
          );
        }

        if (controller.signal.aborted) return;

        setEntries(data.map(normalizeEntry));
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error.message || "No fue posible cargar TBOG."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEntries();

    return () => controller.abort();
  }, [reloadKey]);

  const recognitions = entries.filter(
    (item) => !item.isGallery
  );

  const imaGallery = entries.filter(
    (item) => item.isGallery
  );

  const featuredItems = recognitions.filter(
    (item) => item.featured
  );

  const visibleItems =
    activeCategory === "todos"
      ? recognitions
      : recognitions.filter(
          (item) => item.category === activeCategory
        );

  const activeCategoryLabel =
    categories.find(
      (item) => item.id === activeCategory
    )?.label ?? "Todo lo destacado";

  // También observa las tarjetas que aparecen al llegar los datos.
  const sectionRef = useRevealOnScroll(
    `${activeCategory}-${loading}-${reloadKey}`
  );

  const closeModal = useRef(
    () => setSelectedItem(null)
  ).current;

  function handleAnchorClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const targetId = event.currentTarget
      .getAttribute("href")
      ?.replace(/^#/, "");

    const target = targetId
      ? document.getElementById(targetId)
      : null;

    if (!target) return;

    event.preventDefault();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    target.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
  }

  return (
    <>
      <div
        id="top"
        className={styles.page}
        ref={sectionRef}
        inert={selectedItem ? "" : undefined}
      >
        {/* HERO */}

        <section
          className={styles.hero}
          aria-labelledby="tbog-title"
        >
          <div
            className={styles.heroAmbient}
            aria-hidden="true"
          />

          <div
            className={styles.heroGrid}
            aria-hidden="true"
          />

          <div className={styles.heroContent} data-reveal>
            <span className={styles.eyebrow}>
              <span
                className={styles.eyebrowDot}
                aria-hidden="true"
              />
              GensTI PRESENTA
            </span>

            <div
              className={styles.codeSignature}
              aria-label="GensTI, código y creatividad"
            >
              <span
                className={styles.codeBracket}
                aria-hidden="true"
              >
                {"<"}
              </span>

              <span
                className={styles.codeSlash}
                aria-hidden="true"
              >
                /
              </span>

              <span
                className={styles.codeBracket}
                aria-hidden="true"
              >
                {">"}
              </span>

              <span className={styles.codeLabel}>
                IDEAS EN MOVIMIENTO
              </span>
            </div>

            <h1 id="tbog-title" className={styles.heroTitle}>
              THE BEST
              <span>OF GensTI.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Las ideas, los proyectos y las personas que hacen
              extraordinaria nuestra comunidad.
            </p>

            <div className={styles.heroActions}>
              <a
                className={`${styles.button} ${styles.buttonPrimary}`}
                href="#destacados"
                onClick={handleAnchorClick}
              >
                Explorar destacados
                <span aria-hidden="true">↘</span>
              </a>

              <span className={styles.heroEdition}>
                TALENTO
                <i aria-hidden="true" />
                INNOVACIÓN
                <i aria-hidden="true" />
                COMUNIDAD
              </span>
            </div>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div
              className={`${styles.orbit} ${styles.orbitOne}`}
            />

            <div
              className={`${styles.orbit} ${styles.orbitTwo}`}
            />

            <div
              className={`${styles.orbit} ${styles.orbitThree}`}
            />

            <div className={styles.heroOrb}>
              <div className={styles.heroOrbInner}>
                <span className={styles.orbTop}>
                  THE BEST OF
                </span>

                <span className={styles.orbCode}>
                  {"</>"}
                </span>

                <span className={styles.orbBottom}>
                  GENSTI COMMUNITY
                </span>
              </div>
            </div>

            <div
              className={`${styles.floatingToken} ${styles.tokenOne}`}
            >
              <span>{"{ }"}</span>
              <small>CREAR</small>
            </div>

            <div
              className={`${styles.floatingToken} ${styles.tokenTwo}`}
            >
              <span>01</span>
              <small>INSPIRAR</small>
            </div>

            <div className={styles.birdBadge}>
              <HummingbirdMark />
            </div>

            <span
              className={`${styles.artLabel} ${styles.artLabelOne}`}
            >
              IDEAS
            </span>

            <span
              className={`${styles.artLabel} ${styles.artLabelTwo}`}
            >
              TALENTO
            </span>
          </div>

          <a
            href="#introduccion"
            className={styles.scrollCue}
            aria-label="Desplazarse a nuestra comunidad"
            onClick={handleAnchorClick}
          >
            <span>DESCUBRE LO EXTRAORDINARIO</span>

            <span
              className={styles.scrollLine}
              aria-hidden="true"
            />
          </a>
        </section>

        {/* INTRODUCCIÓN */}

        <section
          id="introduccion"
          className={styles.intro}
          aria-labelledby="intro-title"
          data-reveal
        >
          <span className={styles.sectionIndex}>
            01 / NUESTRA COMUNIDAD
          </span>

          <div className={styles.introLayout}>
            <h2
              id="intro-title"
              className={styles.sectionTitle}
            >
              El talento no pasa
              <span> desapercibido.</span>
            </h2>

            <p className={styles.introText}>
              TBOG reúne historias, proyectos e iniciativas que
              merecen ser conocidas. Un lugar para celebrar lo
              que construimos juntos desde Ingeniería de Sistemas.
            </p>
          </div>

          <div className={styles.introSignature}>
            <span aria-hidden="true">{"</>"}</span>
            <p>Imaginamos. Construimos. Dejamos huella.</p>
          </div>
        </section>

        {/* IMA-GENSTI */}

        <section
          id="ima-gensti"
          className={styles.imaSection}
          aria-labelledby="ima-title"
          data-reveal
        >
          <div className={styles.imaVisual} aria-hidden="true">
            <div className={styles.imaHalo} />
            <div className={styles.imaOrbit} />

            <HummingbirdMark />

            <span className={styles.imaCode}>
              {"</>"}
            </span>

            <span className={styles.imaSparkle}>✳</span>
          </div>

          <div className={styles.imaContent}>
            <span className={styles.sectionIndex}>
              02 / ESPACIO DE EXCELENCIA
            </span>

            <span className={styles.imaEyebrow}>
              UN EVENTO PARA RECORDAR
            </span>

            <h2 id="ima-title">
              IMA-<span>GensTI</span>
            </h2>

            <p className={styles.imaLead}>
              La excelencia también merece su propio escenario.
            </p>

            <p className={styles.imaDescription}>
              Un espacio para celebrar el talento, compartir
              experiencias y reconocer aquello que nos impulsa
              a crecer como comunidad. Aquí reunimos los
              recuerdos y momentos destacados del evento IMA-GensTI.
            </p>

            <div className={styles.imaTags}>
              <span>EXCELENCIA</span>
              <span>COMUNIDAD</span>
              <span>INSPIRACIÓN</span>
            </div>

            <a
              className={`${styles.button} ${styles.buttonOutline}`}
              href="#galeria-ima"
              onClick={handleAnchorClick}
            >
              Explorar galería
              <span aria-hidden="true">↘</span>
            </a>
          </div>
        </section>

        {/* CARGA Y ERRORES */}

        {loading && (
          <div className={styles.contentState} role="status">
            Cargando reconocimientos y fotografías...
          </div>
        )}

        {!loading && loadError && (
          <div className={styles.contentState} role="alert">
            <p>{loadError}</p>

            <button
              type="button"
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Volver a intentar
            </button>
          </div>
        )}

        {/* GALERÍA IMA-GENSTI */}

        <section
          id="galeria-ima"
          className={styles.gallerySection}
          aria-labelledby="ima-gallery-title"
        >
          <div className={styles.sectionHeading} data-reveal>
            <div>
              <span className={styles.sectionIndex}>
                MEMORIAS / IMA-GENSTI
              </span>

              <h2
                id="ima-gallery-title"
                className={styles.sectionTitle}
              >
                Instantes que <span>dejan huella.</span>
              </h2>
            </div>

            <p className={styles.headingDescription}>
              Las fotografías y los recuerdos que nos conectan
              con los mejores momentos del evento.
            </p>
          </div>

          <div data-reveal>
            {imaGallery.length > 0 && (
              <div className={styles.galleryStage}>
                {imaGallery.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    className={styles.galleryPhoto}
                    style={{
                      "--rotation": `${
                        [-7, 4, -4, 7][index % 4]
                      }deg`,
                      "--float-delay": `${index * -1.3}s`,
                    }}
                    onClick={() => setSelectedItem(photo)}
                    aria-label={`Abrir ${photo.title}`}
                    aria-haspopup="dialog"
                  >
                    <span className={styles.galleryPhotoInner}>
                      <img
                        src={photo.image}
                        alt={photo.imageAlt}
                        loading="lazy"
                        decoding="async"
                        style={{
                          objectPosition: photo.imagePosition,
                        }}
                      />

                      <span
                        className={styles.galleryPhotoCaption}
                      >
                        <span>{photo.title}</span>
                        <span aria-hidden="true">↗</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!loading && !loadError && imaGallery.length === 0 && (
              <p className={styles.galleryNotice}>
                Próximamente compartiremos las fotografías
                de IMA-GensTI.
              </p>
            )}
          </div>
        </section>

        {/* HISTORIAS DESTACADAS */}

        <section
          id="destacados"
          className={styles.featured}
          aria-labelledby="featured-title"
        >
          <div className={styles.sectionHeading} data-reveal>
            <div>
              <span className={styles.sectionIndex}>
                03 / EN PRIMER PLANO
              </span>

              <h2
                id="featured-title"
                className={styles.sectionTitle}
              >
                Historias que <span>inspiran.</span>
              </h2>
            </div>

            <span className={styles.headingNote}>
              UNA COMUNIDAD, MUCHAS FORMAS DE DESTACAR
            </span>
          </div>

          <div className={styles.featuredGrid}>
            {featuredItems.map((item) => (
              <article
                key={item.id}
                className={styles.featureCard}
                data-reveal
              >
                <button
                  type="button"
                  className={styles.featureButton}
                  onClick={() => setSelectedItem(item)}
                  aria-label={`Ver detalles de ${item.title}`}
                  aria-haspopup="dialog"
                >
                  <img
                    src={item.image}
                    alt=""
                    className={styles.featureImage}
                    style={{
                      objectPosition: item.imagePosition,
                    }}
                    loading="lazy"
                    decoding="async"
                  />

                  <span
                    className={styles.featureShade}
                    aria-hidden="true"
                  />

                  <span className={styles.featureTopline}>
                    <span>{item.categoryLabel}</span>
                    <span aria-hidden="true">↗</span>
                  </span>

                  <span className={styles.featureBody}>
                    <span className={styles.featureTag}>
                      {item.studentName || "RECONOCIMIENTO GENSTI"}
                    </span>

                    <span className={styles.featureTitle}>
                      {item.title}
                    </span>

                    <span className={styles.featureDescription}>
                      {item.description}
                    </span>

                    <span className={styles.featureLink}>
                      Explorar historia
                      <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </button>
              </article>
            ))}
          </div>

          {!loading && !loadError && featuredItems.length === 0 && (
            <p className={styles.contentState}>
              Pronto conocerás nuevas historias destacadas.
            </p>
          )}
        </section>

        {/* CATEGORÍAS Y TARJETAS */}

        <section
          className={styles.categories}
          aria-labelledby="categories-title"
        >
          <div className={styles.sectionHeading} data-reveal>
            <div>
              <span className={styles.sectionIndex}>
                04 / DESCUBRE
              </span>

              <h2
                id="categories-title"
                className={styles.sectionTitle}
              >
                Cada logro tiene <span>su lugar.</span>
              </h2>
            </div>

            <p className={styles.headingDescription}>
              Explora las distintas formas de aportar, crear e
              inspirar dentro de nuestra comunidad.
            </p>
          </div>

          <div
            className={styles.filterList}
            role="group"
            aria-label="Filtrar reconocimientos"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.filter} ${
                  activeCategory === category.id
                    ? styles.filterActive
                    : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
                aria-controls="tbog-recognition-results"
              >
                {category.label}

                {activeCategory === category.id && (
                  <span aria-hidden="true">↗</span>
                )}
              </button>
            ))}
          </div>

          <div
            className={styles.resultsMeta}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>{activeCategoryLabel.toUpperCase()}</span>

            <span>
              {loading
                ? "CARGANDO..."
                : loadError
                ? "CONTENIDO NO DISPONIBLE"
                : `${visibleItems.length} ${
                    visibleItems.length === 1
                      ? "HISTORIA"
                      : "HISTORIAS"
                  }`}
            </span>
          </div>

          <div
            id="tbog-recognition-results"
            aria-busy={loading}
          >
            {!loading && !loadError && visibleItems.length === 0 && (
              <p className={styles.contentState}>
                Todavía no hay reconocimientos publicados
                en esta categoría.
              </p>
            )}

            <div
              className={styles.cardGrid}
              key={activeCategory}
            >
              {visibleItems.map((item, index) => (
                <article
                  key={item.id}
                  className={styles.card}
                  data-reveal
                  style={{
                    "--card-delay": `${index * 75}ms`,
                  }}
                >
                  <button
                    type="button"
                    className={styles.cardButton}
                    onClick={() => setSelectedItem(item)}
                    aria-label={`Ver detalles de ${item.title}`}
                    aria-haspopup="dialog"
                  >
                    <span className={styles.cardImageWrap}>
                      <img
                        src={item.image}
                        alt=""
                        className={styles.cardImage}
                        style={{
                          objectPosition: item.imagePosition,
                        }}
                        loading="lazy"
                        decoding="async"
                      />

                      <span
                        className={styles.cardImageOverlay}
                        aria-hidden="true"
                      />

                      <span className={styles.cardCategory}>
                        {item.categoryLabel}
                      </span>

                      <span
                        className={styles.cardOpen}
                        aria-hidden="true"
                      >
                        ↗
                      </span>
                    </span>

                    <span className={styles.cardContent}>
                      {item.period && (
                        <span className={styles.cardPeriod}>
                          {item.period}
                        </span>
                      )}

                      <span className={styles.cardTitle}>
                        {item.title}
                      </span>

                      {item.studentName && (
                        <span className={styles.studentName}>
                          {item.studentName}
                        </span>
                      )}

                      <span className={styles.cardDescription}>
                        {item.description}
                      </span>

                      <span className={styles.cardMore}>
                        Conocer más
                        <span aria-hidden="true">→</span>
                      </span>
                    </span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MANIFIESTO */}

        <section
          className={styles.manifesto}
          aria-labelledby="manifesto-title"
          data-reveal
        >
          <div
            className={styles.manifestoDecoration}
            aria-hidden="true"
          >
            {"</>"}
          </div>

          <span className={styles.sectionIndex}>
            05 / LO QUE NOS MUEVE
          </span>

          <h2 id="manifesto-title">
            El próximo logro que inspire a todos
            <span> puede empezar contigo.</span>
          </h2>

          <p>
            Las buenas ideas merecen un espacio. Los proyectos
            merecen ser vistos. Y las personas que hacen la
            diferencia merecen ser reconocidas.
          </p>

          <a
            className={`${styles.button} ${styles.buttonLight}`}
            href="#destacados"
            onClick={handleAnchorClick}
          >
            Seguir explorando
            <span aria-hidden="true">↑</span>
          </a>
        </section>

        {/* FOOTER DE TBOG */}

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <span
              className={styles.footerCode}
              aria-hidden="true"
            >
              {"</>"}
            </span>

            <strong>GensTI</strong>
            <span>Ingeniería de Sistemas</span>
          </div>

          <p>Ideas que conectan. Tecnología que transforma.</p>

          <a href="#top" onClick={handleAnchorClick}>
            Volver arriba ↑
          </a>
        </footer>
      </div>

      {/* El modal queda fuera del contenido inactivo. */}

      {selectedItem && (
        <div className={styles.page}>
          <RecognitionModal
            item={selectedItem}
            onClose={closeModal}
          />
        </div>
      )}
    </>
  );
}

export default BOTGPage;