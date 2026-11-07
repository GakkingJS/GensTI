import { useCallback, useEffect, useState } from "react";

import styles from "../styles/EventsAdminPage.module.css";


const EMPTY_FORM = {
  title: "",
  type: "FESTIVAL",
  short_description: "",
  description: "",
  start_date: "",
  end_date: "",
  time: "",
  location: "",
  image_url: "",
  external_url: "",
  featured: false,
};


const EVENT_TYPES = [
  "FESTIVAL",
  "INGENIERÍA",
  "TALLER",
  "COMUNIDAD",
  "CONFERENCIA",
];


function EventsAdminPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/events/admin", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los eventos.");
      }

      const data = await response.json();
      setEvents(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    loadEvents();
  }, [loadEvents]);


  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }


  function startEditing(eventItem) {
    setEditingEventId(eventItem.id);
    setError("");
    setMessage("");

    setForm({
      title: eventItem.title ?? "",
      type: eventItem.type ?? "FESTIVAL",
      short_description: eventItem.short_description ?? "",
      description: eventItem.description ?? "",
      start_date: eventItem.start_date ?? "",
      end_date: eventItem.end_date ?? "",
      time: eventItem.time ?? "",
      location: eventItem.location ?? "",
      image_url: eventItem.image_url ?? "",
      external_url: eventItem.external_url ?? "",
      featured: Boolean(eventItem.featured),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function cancelEditing() {
    setEditingEventId(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
  }


  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const isEditing = Boolean(editingEventId);

    const url = isEditing
      ? `/events/${editingEventId}`
      : "/events";

    const method = isEditing ? "PATCH" : "POST";

    const payload = {
      title: form.title,
      type: form.type,
      short_description: form.short_description,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      time: form.time || null,
      location: form.location || null,
      image_url: form.image_url || null,
      external_url: form.external_url || null,
      featured: form.featured,
    };

    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ??
            (isEditing
              ? "No se pudo actualizar el evento."
              : "No se pudo crear el evento."),
        );
      }

      setMessage(
        isEditing
          ? "Evento actualizado correctamente."
          : "Evento creado como borrador.",
      );

      setEditingEventId(null);
      setForm(EMPTY_FORM);

      await loadEvents();
    } catch (submitError) {
      setError(submitError.message);
    }
  }


  async function handlePublish(eventId) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/events/${eventId}/publish`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudo publicar el evento.");
      }

      setMessage("Evento publicado.");
      await loadEvents();
    } catch (publishError) {
      setError(publishError.message);
    }
  }


  async function handleUnpublish(eventId) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/events/${eventId}/unpublish`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudo retirar el evento.");
      }

      setMessage("Evento retirado del calendario.");
      await loadEvents();
    } catch (unpublishError) {
      setError(unpublishError.message);
    }
  }


  async function handleDelete(eventId) {
    setError("");
    setMessage("");

    const isConfirmed = window.confirm(
      "¿Seguro que quieres eliminar este evento?",
    );

    if (!isConfirmed) return;

    try {
      const response = await fetch(`/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el evento.");
      }

      setMessage("Evento eliminado.");

      if (editingEventId === eventId) {
        cancelEditing();
      }

      await loadEvents();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }


  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.sectionLabel}>ADMINISTRACIÓN</span>

        <h1>Eventos de la comunidad</h1>

        <p>
          Crea y administra los festivales, talleres, conferencias y
          actividades de gensTI.
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>
          {editingEventId ? "Editar evento" : "Nuevo evento"}
        </h2>

        <label className={styles.field}>
          Título

          <input
            name="title"
            value={form.title}
            onChange={handleInputChange}
            required
            minLength={3}
            maxLength={200}
          />
        </label>

        <div className={styles.gridTwo}>
          <label className={styles.field}>
            Tipo

            <select
              name="type"
              value={form.type}
              onChange={handleInputChange}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            Ubicación

            <input
              name="location"
              value={form.location}
              onChange={handleInputChange}
              maxLength={200}
            />
          </label>
        </div>

        <label className={styles.field}>
          Descripción corta

          <input
            name="short_description"
            value={form.short_description}
            onChange={handleInputChange}
            required
            minLength={5}
            maxLength={500}
          />
        </label>

        <label className={styles.field}>
          Descripción completa

          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={4}
          />
        </label>

        <div className={styles.gridTwo}>
          <label className={styles.field}>
            Fecha de inicio

            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleInputChange}
              required
            />
          </label>

          <label className={styles.field}>
            Fecha de cierre

            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleInputChange}
            />
          </label>
        </div>

        <label className={styles.field}>
          Horario

          <input
            name="time"
            value={form.time}
            onChange={handleInputChange}
            placeholder="Ejemplo: 8:00 a.m. - 5:00 p.m."
            maxLength={100}
          />
        </label>

        <label className={styles.field}>
          URL de la imagen

          <input
            type="url"
            name="image_url"
            value={form.image_url}
            onChange={handleInputChange}
          />
        </label>

        <label className={styles.field}>
          Enlace oficial

          <input
            type="url"
            name="external_url"
            value={form.external_url}
            onChange={handleInputChange}
          />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleInputChange}
          />

          Mostrar como evento destacado
        </label>

        <div className={styles.actions}>
          <button type="submit" disabled={isLoading}>
            {editingEventId ? "Guardar cambios" : "Guardar borrador"}
          </button>

          {editingEventId && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={cancelEditing}
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <h2>Eventos registrados</h2>

      {events.length === 0 ? (
        <p className={styles.emptyState}>
          Todavía no hay eventos registrados.
        </p>
      ) : (
        <ul className={styles.eventList}>
          {events.map((eventItem) => (
            <li
              key={eventItem.id}
              className={`${styles.eventCard} ${
                editingEventId === eventItem.id ? styles.isEditing : ""
              }`}
            >
              <div className={styles.eventHeading}>
                <div>
                  <span className={styles.eventType}>
                    {eventItem.type}
                  </span>

                  <h3>{eventItem.title}</h3>
                </div>

                <span
                  className={`${styles.status} ${
                    eventItem.status === "published"
                      ? styles.statusPublished
                      : styles.statusDraft
                  }`}
                >
                  {eventItem.status === "published"
                    ? "Publicado"
                    : "Borrador"}
                </span>
              </div>

              <p>{eventItem.short_description}</p>

              <div className={styles.eventMeta}>
                <span>
                  {new Date(
                    `${eventItem.start_date}T00:00:00`,
                  ).toLocaleDateString("es-CO")}
                  {eventItem.end_date &&
                    ` — ${new Date(
                      `${eventItem.end_date}T00:00:00`,
                    ).toLocaleDateString("es-CO")}`}
                </span>

                {eventItem.location && (
                  <span>{eventItem.location}</span>
                )}

                {eventItem.featured && (
                  <span className={styles.featuredBadge}>
                    Destacado
                  </span>
                )}
              </div>

              <div className={styles.eventActions}>
                <button
                  type="button"
                  onClick={() => startEditing(eventItem)}
                  disabled={isLoading}
                >
                  Editar
                </button>

                {eventItem.status === "draft" ? (
                  <button
                    type="button"
                    onClick={() => handlePublish(eventItem.id)}
                    disabled={isLoading}
                  >
                    Publicar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUnpublish(eventItem.id)}
                    disabled={isLoading}
                  >
                    Retirar
                  </button>
                )}

                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => handleDelete(eventItem.id)}
                  disabled={isLoading}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


export default EventsAdminPage;