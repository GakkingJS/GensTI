import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ScrollReveal from "./ScrollReveal";

const staticEvents = [
  {
    id: "inteligencia-artificial",
    day: "12",
    month: "SEP",
    type: "CONFERENCIA",
    title: "Introducción a la Inteligencia Artificial",
    details: "Auditorio principal · 4:00 PM",
  },
  {
    id: "encuentro-gensti",
    day: "18",
    month: "SEP",
    type: "COMUNIDAD",
    title: "Encuentro GENSTI",
    details: "Bloque académico · 2:00 PM",
  },
  {
    id: "taller-desarrollo-web",
    day: "25",
    month: "SEP",
    type: "TALLER",
    title: "Taller de desarrollo web",
    details: "Laboratorio de sistemas · 3:00 PM",
  },
];

function Events() {
  const [events, setEvents] = useState(staticEvents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const response = await fetch("/events?limit=3", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("No fue posible cargar los eventos");
        }

        const data = await response.json();

        if (!cancelled) {
          setEvents(data);
        }
      } catch {
        if (!cancelled) {
          setEvents(staticEvents);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="events-section" id="eventos">
        <p className="news-empty-state">
          Cargando eventos...
        </p>
      </section>
    );
  }

  return (
    <section className="events-section" id="eventos">
      <ScrollReveal className="section-header">
        <div>
          <span className="section-label">AGENDA</span>
          <h2>Próximos eventos</h2>
        </div>

        <Link to="/eventos">
          Ver calendario →
        </Link>
      </ScrollReveal>

      <div className="events-list">
        {events.length > 0 ? (
          events.map((event, index) => (
            <ScrollReveal
              key={event.id}
              className="event-reveal"
              delay={index * 0.1}
            >
              <article className="event">
                <div className="event-date">
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>

                <div className="event-info">
                  <span>{event.type}</span>
                  <h3>{event.title}</h3>
                  <p>{event.details}</p>
                </div>

                <Link
                  className="event-link"
                  to={`/eventos/${event.id}`}
                >
                  Ver evento →
                </Link>
              </article>
            </ScrollReveal>
          ))
        ) : (
          <p className="news-empty-state">
            No hay eventos próximos por ahora.
          </p>
        )}
      </div>
    </section>
  );
}

export default Events;