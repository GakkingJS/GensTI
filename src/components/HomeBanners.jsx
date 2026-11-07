import { useEffect, useState } from "react";
import ScrollReveal from "./ScrollReveal";
import "./HomeBanners.css";

const banners = [
  {
    eyebrow: "COMUNIDAD GENSTI",
    title: "Las grandes ideas comienzan con una pregunta.",
    description:
      "Conoce una comunidad que conecta estudiantes, comparte conocimiento y abre nuevas oportunidades en Ingeniería de Sistemas.",
    buttonText: "Conoce GENSTI",
    link: "#conoce-gensti",
    external: false,
    style: "banner--community",
  },
  {
    eyebrow: "INGENIERÍA DE SISTEMAS",
    title: "La tecnología no solo se usa. También se crea.",
    description:
      "Explora cómo la programación, la inteligencia artificial y la innovación pueden transformar ideas en soluciones reales.",
    buttonText: "Descubre la carrera",
    link: "#ingenieria-sistemas",
    external: false,
    style: "banner--technology",
  },
  {
    eyebrow: "TU FUTURO COMIENZA AQUÍ",
    title: "Tu próxima gran idea puede empezar en la universidad.",
    description:
      "Descubre las oportunidades de formación y comienza a construir tu camino en el mundo de la tecnología.",
    buttonText: "Conoce el programa",
    link: "https://www.ucc.edu.co/programas/pregrados/Paginas/ibague-espinal/Ingenieria-de-Sistemas-Ibague.aspx#pensum",
    external: true,
    style: "banner--future",
  },
];

function HomeBanners() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
      setAnimationKey((current) => current + 1);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  function changeBanner(index) {
    setActiveIndex((index + banners.length) % banners.length);
    setAnimationKey((current) => current + 1);
  }

  function showPrevious() {
    changeBanner(activeIndex - 1);
  }

  function showNext() {
    changeBanner(activeIndex + 1);
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsPaused(false);
    }
  }

  const activeBanner = banners[activeIndex];

  return (
    <ScrollReveal y={20} duration={0.6}>
      <section
        className="home-banners"
        aria-label="Descubre GENSTI"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={handleBlur}
      >
        <div className={`home-banner ${activeBanner.style}`}>
          <div
            className="home-banner__content"
            key={`content-${animationKey}`}
          >
            <span className="home-banner__eyebrow">
              {activeBanner.eyebrow}
            </span>

            <h2>{activeBanner.title}</h2>

            <p>{activeBanner.description}</p>

            {activeBanner.external ? (
              <a
                className="home-banner__button"
                href={activeBanner.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activeBanner.buttonText}
                <span aria-hidden="true"> ↗</span>
              </a>
            ) : (
              <a
                className="home-banner__button"
                href={activeBanner.link}
              >
                {activeBanner.buttonText}
                <span aria-hidden="true"> →</span>
              </a>
            )}
          </div>

          <div className="home-banner__visual" aria-hidden="true">
            <div className="banner-orbit banner-orbit--outer" />
            <div className="banner-orbit banner-orbit--inner" />

            <div className="banner-core">
              <span>&lt;/&gt;</span>
            </div>

            <span className="banner-floating banner-floating--one">
              01
            </span>
            <span className="banner-floating banner-floating--two">
              AI
            </span>
            <span className="banner-floating banner-floating--three">
              {"{ }"}
            </span>
          </div>

          
        <div className="home-banner__controls">
        <button
            type="button"
            className="banner-arrow"
            onClick={showPrevious}
            aria-label="Banner anterior"
        >
            <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
            </svg>
        </button>

        <div className="banner-dots" aria-label="Seleccionar banner">
            {banners.map((banner, index) => (
            <button
                key={banner.eyebrow}
                type="button"
                className={`banner-dot ${
                index === activeIndex ? "is-active" : ""
                }`}
                onClick={() => changeBanner(index)}
                aria-label={`Mostrar banner ${index + 1}: ${banner.eyebrow}`}
                aria-current={index === activeIndex ? "true" : undefined}
            />
            ))}
        </div>

        <button
            type="button"
            className="banner-arrow"
            onClick={showNext}
            aria-label="Siguiente banner"
        >
            <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
            </svg>
        </button>
        </div>

        </div>
      </section>
    </ScrollReveal>
  );
}

export default HomeBanners;
