import { useCallback, useEffect, useState } from "react";

import styles from "../styles/CalendarAdminPage.module.css";


const API_BASE_URL = "";

const EMPTY_FORM = {
  title: "",
  description: "",
  starts_at: "",
  ends_at: "",
  source_url: "",
  source_label: "",
};


function toDatetimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function CalendarAdminPage() {
  const [periods, setPeriods] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingEventId, setEditingEventId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);


  const loadPeriods = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/calendar/periods`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los periodos académicos.");
      }

      const data = await response.json();
      setPeriods(data);

      if (data.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(data[0].id);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriodId]);


  const loadEvents = useCallback(async () => {
    if (!selectedPeriodId) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/calendar/events?period_id=${selectedPeriodId}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los eventos del calendario.");
      }

      const data = await response.json();
      setEvents(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriodId]);


  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);


  useEffect(() => {
    loadEvents();
  }, [loadEvents]);


  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }


  function startEditing(eventItem) {
    setEditingEventId(eventItem.id);
    setError("");
    setMessage("");

    setForm({
      title: eventItem.title ?? "",
      description: eventItem.description ?? "",
      starts_at: toDatetimeLocal(eventItem.starts_at),
      ends_at: toDatetimeLocal(eventItem.ends_at),
      source_url: eventItem.source_url ?? "",
      source_label: eventItem.source_label ?? "",
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

    if (!selectedPeriodId) {
      setError("Selecciona un periodo académico.");
      return;
    }

    const payload = {
      period_id: selectedPeriodId,
      title: form.title,
      description: form.description || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      campus: "Ibagué",
      audience: "Estudiantes de Ingeniería de Sistemas",
      source_url: form.source_url || null,
      source_label: form.source_label || null,
    };

    const isEditing = Boolean(editingEventId);

    const url = isEditing
      ? `${API_BASE_URL}/calendar/events/${editingEventId}`
      : `${API_BASE_URL}/calendar/events`;

    const method = isEditing ? "PATCH" : "POST";

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
      const response = await fetch(
        `${API_BASE_URL}/calendar/events/${eventId}/publish`,
        {
          method: "POST",
          credentials: "include",
        },
      );

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
      const response = await fetch(
        `${API_BASE_URL}/calendar/events/${eventId}/unpublish`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo retirar el evento.");
      }

      setMessage("Evento retirado del calendario.");
      await loadEvents();
    } catch (unpublishError) {
      setError(unpublishError.message);
    }
  }


  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.sectionLabel}>ADMINISTRACIÓN</span>

        <h1>Calendario académico</h1>

        <p>
          Administra las fechas importantes de gensTI para el campus Ibagué.
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <label className={styles.field}>
        Periodo académico

        <select
          value={selectedPeriodId}
          onChange={(event) => setSelectedPeriodId(event.target.value)}
        >
          <option value="">Selecciona un periodo</option>

          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.code} — {period.name}
            </option>
          ))}
        </select>
      </label>

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

        <label className={styles.field}>
          Descripción

          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={3}
          />
        </label>

        <div className={styles.dateGrid}>
          <label className={styles.field}>
            Inicio

            <input
              type="datetime-local"
              name="starts_at"
              value={form.starts_at}
              onChange={handleInputChange}
              required
            />
          </label>

          <label className={styles.field}>
            Cierre

            <input
              type="datetime-local"
              name="ends_at"
              value={form.ends_at}
              onChange={handleInputChange}
            />
          </label>
        </div>

        <label className={styles.field}>
          Enlace de la fuente oficial

          <input
            type="url"
            name="source_url"
            value={form.source_url}
            onChange={handleInputChange}
          />
        </label>

        <label className={styles.field}>
          Nombre de la fuente

          <input
            name="source_label"
            value={form.source_label}
            onChange={handleInputChange}
            maxLength={200}
          />
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

      <h2>Eventos del periodo</h2>

      {events.length === 0 ? (
        <p className={styles.emptyState}>
          No hay eventos para mostrar en este periodo.
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
                <h3>{eventItem.title}</h3>

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

              {eventItem.description && (
                <p>{eventItem.description}</p>
              )}

              <div className={styles.eventDates}>
                <span>
                  Inicio:{" "}
                  {new Date(eventItem.starts_at).toLocaleString("es-CO")}
                </span>

                {eventItem.ends_at && (
                  <span>
                    Cierre:{" "}
                    {new Date(eventItem.ends_at).toLocaleString("es-CO")}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


export default CalendarAdminPage;