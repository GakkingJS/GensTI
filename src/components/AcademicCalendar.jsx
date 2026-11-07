import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];


const FILTERS = [
  "TODOS",
  "FESTIVAL",
  "INGENIERÍA",
  "TALLER",
  "COMUNIDAD",
  "CONFERENCIA",
  "ACADÉMICO",
];


const TYPE_STYLES = {
  FESTIVAL: "festival",
  "INGENIERÍA": "engineering",
  TALLER: "workshop",
  COMUNIDAD: "community",
  CONFERENCIA: "conference",
  "ACADÉMICO": "academic",
};


function parseDate(value) {
  if (!value) return null;


  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);


  if (!match) return null;


  const [, year, month, day] = match;


  return new Date(Number(year), Number(month) - 1, Number(day));
}


function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");


  return `${year}-${month}-${day}`;
}


function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat("es-CO", options).format(date);
}


function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}


function eventOccursOn(event, date) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate) || start;


  if (!start || !end) return false;


  return sameDay(date, start) || sameDay(date, end);
}


function getEventDayLabel(event, date) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate) || start;


  if (start && sameDay(date, start)) {
    return "Inicio";
  }


  if (end && sameDay(date, end)) {
    return "Cierre";
  }


  return event.type;
}


function AcademicCalendar({ events = [] }) {
  const today = new Date();


  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );


  const [selectedDate, setSelectedDate] = useState(() =>
    dateKey(today)
  );


  const [activeFilter, setActiveFilter] = useState("TODOS");


  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();


  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (firstDay.getDay() + 6) % 7;


  const calendarDays = useMemo(() => {
    return [
      ...Array.from({ length: mondayOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [mondayOffset, daysInMonth]);


  const datedEvents = useMemo(() => {
    return events.filter((event) => {
      return (
        parseDate(event.startDate) &&
        parseDate(event.endDate || event.startDate)
      );
    });
  }, [events]);


  const filteredEvents = useMemo(() => {
    return datedEvents.filter((event) => {
      return (
        activeFilter === "TODOS" ||
        event.type === activeFilter
      );
    });
  }, [datedEvents, activeFilter]);


  const selected = parseDate(selectedDate);


  const selectedEvents = selected
    ? filteredEvents.filter((event) =>
        eventOccursOn(event, selected)
      )
    : [];


  const undatedEvents = events.filter((event) => {
    return !parseDate(event.startDate);
  });


  function changeMonth(offset) {
    const nextMonth = new Date(year, month + offset, 1);


    setVisibleMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth));
  }


  function selectDay(day) {
    if (!day) return;


    setSelectedDate(
      dateKey(new Date(year, month, day))
    );
  }


  return (
    <section
      className="academic-calendar"
      aria-labelledby="calendar-title"
    >
      <div className="calendar-heading">
        <div className="calendar-heading-copy">
          <span className="calendar-kicker">
            <span className="calendar-kicker-dot" />
            Agenda de la comunidad
          </span>


          <h2 id="calendar-title">
            Tu tiempo, <span>mejor organizado.</span>
          </h2>


          <p>
            Explora las fechas importantes, encuentra
            actividades y descubre qué está pasando en
            gensTI.
          </p>
        </div>


        <div className="calendar-date-stamp">
          <span className="calendar-date-stamp-month">
            {formatDate(today, {
              month: "short",
            }).replace(".", "")}
          </span>


          <strong>
            {String(today.getDate()).padStart(2, "0")}
          </strong>


          <span className="calendar-date-stamp-year">
            {today.getFullYear()}
          </span>
        </div>
      </div>


      <div className="calendar-shell">
        <div className="calendar-main">
          <div className="calendar-toolbar">
            <div className="calendar-month-label">
              <h3>
                {formatDate(visibleMonth, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>


              <p>
                {filteredEvents.length} actividades con
                fecha
              </p>
            </div>


            <div className="calendar-navigation">
              <button
                type="button"
                className="calendar-nav-button"
                onClick={() => changeMonth(-1)}
                aria-label="Mes anterior"
              >
                ←
              </button>


              <button
                type="button"
                className="calendar-today-button"
                onClick={() => {
                  setVisibleMonth(
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    )
                  );


                  setSelectedDate(dateKey(today));
                }}
              >
                Hoy
              </button>


              <button
                type="button"
                className="calendar-nav-button"
                onClick={() => changeMonth(1)}
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>
          </div>


          <div
            className="calendar-filters"
            aria-label="Filtrar eventos"
          >
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter}
                className={`calendar-filter ${
                  activeFilter === filter
                    ? "is-active"
                    : ""
                }`}
                aria-pressed={
                  activeFilter === filter
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter === "TODOS"
                  ? "Todas"
                  : filter}
              </button>
            ))}
          </div>


          <div
            className="calendar-grid"
            role="grid"
            aria-label="Calendario mensual"
          >
            {WEEKDAYS.map((day) => (
              <div
                className="calendar-weekday"
                role="columnheader"
                key={day}
              >
                {day}
              </div>
            ))}


            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <div
                    className="calendar-day calendar-day--empty"
                    role="gridcell"
                    key={`empty-${index}`}
                    aria-hidden="true"
                  />
                );
              }


              const date = new Date(
                year,
                month,
                day
              );


              const dayEvents = filteredEvents.filter(
                (event) => eventOccursOn(event, date)
              );


              const isSelected =
                selectedDate === dateKey(date);


              const isToday = sameDay(date, today);


              return (
                <button
                  type="button"
                  role="gridcell"
                  key={day}
                  className={[
                    "calendar-day",
                    isSelected ? "is-selected" : "",
                    isToday ? "is-today" : "",
                    dayEvents.length
                      ? "has-events"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={isSelected}
                  aria-label={`${formatDate(date, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}${
                    dayEvents.length
                      ? `, ${dayEvents.length} actividades`
                      : ""
                  }`}
                  onClick={() => selectDay(day)}
                >
                  <span className="calendar-day-number">
                    {day}
                  </span>


                  {dayEvents.length > 0 && (
                    <span
                      className="calendar-day-indicators"
                      aria-hidden="true"
                    >
                      {dayEvents
                        .slice(0, 3)
                        .map((event) => (
                          <i
                            key={event.id}
                            className={`calendar-event-dot ${
                              TYPE_STYLES[
                                event.type
                              ] ?? "default"
                            }`}
                          />
                        ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>


          <div className="calendar-legend">
            <span>
              <i className="legend-dot legend-dot--event" />
              Con actividades
            </span>


            <span>
              <i className="legend-dot legend-dot--today" />
              Hoy
            </span>


            <span>
              <i className="legend-dot legend-dot--selected" />
              Día seleccionado
            </span>
          </div>
        </div>


        <aside
          className="calendar-agenda"
          aria-live="polite"
        >
          <div className="calendar-agenda-top">
            <span className="calendar-agenda-eyebrow">
              <span className="calendar-agenda-eyebrow-dot" />
              Detalle del día
            </span>


            <h3>
              {selected
                ? formatDate(selected, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Selecciona una fecha"}
            </h3>


            <p className="calendar-agenda-intro">
              {selectedEvents.length === 1
                ? "1 actividad disponible"
                : `${selectedEvents.length} actividades disponibles`}
            </p>
          </div>


          {selectedEvents.length ? (
            <div
              className="calendar-agenda-list"
              key={selectedDate}
            >
              {selectedEvents.map((event) => (
                <article
                  className="calendar-agenda-event"
                  key={event.id}
                >
                  <div className="calendar-agenda-event-heading">
                    <span
                      className={`calendar-agenda-type ${
                        TYPE_STYLES[
                          event.type
                        ] ?? "default"
                      }`}
                    >
                      {getEventDayLabel(event, selected)}
                      {" — "}
                      {event.type}
                    </span>
                  </div>


                  <h4>{event.title}</h4>


                  <p className="calendar-agenda-description">
                    {event.shortDescription}
                  </p>


                  <div className="calendar-agenda-meta">
                    <div className="calendar-meta-row">
                      <span className="calendar-meta-icon">
                        ◷
                      </span>


                      <span>{event.time}</span>
                    </div>


                    <div className="calendar-meta-row">
                      <span className="calendar-meta-icon">
                        ⌖
                      </span>


                      <span>{event.location}</span>
                    </div>
                  </div>


                  {event.externalUrl && (
                    <a
                      href={event.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="calendar-agenda-link"
                    >
                      Consulta la programación oficial


                      <span aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="calendar-no-events">
              <div className="calendar-no-events-symbol">
                <span />
                <span />
                <span />
              </div>


              <h4>No hay actividades este día</h4>


              <p>
                Selecciona otra fecha o cambia el filtro
                para ver otras actividades de la
                comunidad.
              </p>
            </div>
          )}


          <div className="calendar-agenda-footer">
            <span className="calendar-agenda-pulse" />


            Agenda de la comunidad gensTI
          </div>
        </aside>
      </div>


      {undatedEvents.length > 0 && (
        <div className="calendar-unconfirmed">
          <div className="calendar-unconfirmed-heading">
            <span className="calendar-kicker">
              <span className="calendar-kicker-dot" />
              Fecha por confirmar
            </span>


            <h3>En preparación</h3>


            <p>
              Estas actividades todavía no tienen una
              fecha publicada.
            </p>
          </div>


          <div className="calendar-unconfirmed-list">
            {undatedEvents
              .filter((event) => {
                return (
                  activeFilter === "TODOS" ||
                  event.type === activeFilter
                );
              })
              .map((event) => (
                <article
                  className="calendar-unconfirmed-card"
                  key={event.id}
                >
                  <span className="calendar-unconfirmed-status">
                    {event.type}
                  </span>


                  <h4>{event.title}</h4>


                  <p>{event.shortDescription}</p>


                  <span className="calendar-unconfirmed-status">
                    {event.status}
                  </span>
                </article>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}


export default AcademicCalendar;