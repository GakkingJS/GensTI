import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import StaggeredCountdown from "../components/StaggeredCountdown";
import ScrollReveal from "../components/ScrollReveal";

import AcademicCalendar from "../components/AcademicCalendar";
import styles from "../styles/EventsPage.module.css";


function EventPlaceholder({ event }) {
  return (
    <div className="event-placeholder">
      <span>{event.type}</span>
      <strong>gensTI</strong>
      <small>Próximamente</small>
    </div>
  );
}


function formatDateValue(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function mapBackendEvent(event) {
  const startDate = formatDateValue(event.start_date);

  if (!startDate) {
    return null;
  }

  const endDate = formatDateValue(event.end_date) || startDate;

  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startDate,
    endDate,
    shortDescription: event.short_description,
    description: event.description,
    time: event.time ?? "Por confirmar",
    location: event.location ?? "Por confirmar",
    image: event.image_url,
    externalUrl: event.external_url,
    featured: event.featured,
    status: event.status,
  };
}


function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/events", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar los eventos de la comunidad.",
          );
        }

        const data = await response.json();
        const mappedEvents = data
          .map(mapBackendEvent)
          .filter(Boolean);

        setEvents(mappedEvents);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);


  const featuredEvents = useMemo(
    () => events.filter((event) => event.featured),
    [events],
  );

  const upcomingEvents = useMemo(
    () => events.filter((event) => !event.featured),
    [events],
  );


  return (
    <section className="events-page">
      <ScrollReveal className="events-page-intro">
        <header>
          <div>
            <span className="section-label">AGENDA gensTI</span>

            <h1>Lo que viene para la comunidad</h1>

            <p>
              Conoce los próximos festivales, conferencias, talleres, espacios
              de encuentro y fechas académicas de Ingeniería de Sistemas.
            </p>
          </div>

          <div className="events-intro-note">
            <StaggeredCountdown
              targetNumber={String(events.length)}
              duration={1.8}
              delay={0.2}
              color="var(--color-accent)"
              spacing={2}
              direction="up"
            />

            <small>actividades registradas</small>

            {error && (
              <p className="calendar-error">
                {error}
              </p>
            )}

            <AcademicCalendar events={events} />
          </div>
        </header>
      </ScrollReveal>

      <section className="featured-events">
        <ScrollReveal className="events-subheading">
          <div>
            <span className="section-label">DESTACADOS</span>
            <h2>Eventos que no te puedes perder</h2>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <p className="events-empty-state">
            Cargando eventos...
          </p>
        ) : featuredEvents.length > 0 ? (
          <div className="featured-events-grid">
            {featuredEvents.map((event, index) => (
              <ScrollReveal
                key={event.id}
                delay={index * 0.12}
                className="event-reveal-wrapper"
              >
                <article className="featured-event-card">
                  <div className="featured-event-image">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={`Afiche de ${event.title}`}
                      />
                    ) : (
                      <EventPlaceholder event={event} />
                    )}

                    <span className="event-status-badge">
                      {event.status}
                    </span>
                  </div>

                  <div className="featured-event-content">
                    <span className="tag">{event.type}</span>

                    <h3>{event.title}</h3>

                    <p>{event.shortDescription}</p>

                    <div className="featured-event-details">
                      <span>{event.time}</span>
                      <span>{event.location}</span>
                    </div>

                    {event.externalUrl && (
                      <div className="featured-event-actions">
                        <a
                          className="official-event-link"
                          href={event.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ir al sitio oficial ↗
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <p className="events-empty-state">
              Todavía no hay eventos destacados.
            </p>
          </ScrollReveal>
        )}
      </section>

      <section className="upcoming-events">
        <ScrollReveal className="events-subheading">
          <div>
            <span className="section-label">PRÓXIMAMENTE</span>
            <h2>Más actividades de la comunidad</h2>
          </div>

          <span className="upcoming-note">
            Información sujeta a confirmación
          </span>
        </ScrollReveal>

        {isLoading ? (
          <p className="events-empty-state">
            Cargando eventos...
          </p>
        ) : upcomingEvents.length > 0 ? (
          <div className="upcoming-events-list">
            {upcomingEvents.map((event, index) => (
              <ScrollReveal
                key={event.id}
                delay={index * 0.08}
                className="event-reveal-wrapper"
              >
                <article className="upcoming-event-item">
                  <span className="upcoming-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="upcoming-event-main">
                    <span className="tag">{event.type}</span>

                    <h3>{event.title}</h3>

                    <p>{event.shortDescription}</p>
                  </div>

                  <div className="upcoming-event-info">
                    <span>{event.time}</span>
                    <span>{event.location}</span>
                  </div>

                  {event.externalUrl && (
                    <a
                      className="upcoming-event-link"
                      href={event.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Conocer más →
                    </a>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <p className="events-empty-state">
              No hay más actividades programadas por ahora.
            </p>
          </ScrollReveal>
        )}
      </section>
    </section>
  );
}


export default EventsPage;