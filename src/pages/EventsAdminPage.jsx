import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ImageOff,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";

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

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function getResponseError(response, fallback) {
  const data = await response.json().catch(() => null);

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg || "Valor inválido.")
      .join(" ");
  }

  if (response.status === 401) {
    return "Tu sesión no está activa. Inicia sesión nuevamente.";
  }

  if (response.status === 403) {
    return "No tienes permiso para realizar esta acción.";
  }

  if (response.status === 413) {
    return "La imagen supera el tamaño permitido.";
  }

  return `${fallback} (HTTP ${response.status}).`;
}

function formatDateRange(start, end) {
  if (!start) return "Fecha por confirmar";

  const startDate = new Date(`${start}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return "Fecha por confirmar";
  }

  const formatter = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!end || end === start) {
    return formatter.format(startDate);
  }

  const endDate = new Date(`${end}T00:00:00`);

  if (Number.isNaN(endDate.getTime())) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} — ${formatter.format(endDate)}`;
}

function EventImage({ event }) {
  const [failed, setFailed] = useState(false);

  if (!event.image_url || failed) {
    return (
      <div className={styles.eventImageFallback}>
        <ImageOff size={22} aria-hidden="true" />
        <span>Sin imagen</span>
      </div>
    );
  }

  return (
    <img
      className={styles.eventImage}
      src={event.image_url}
      alt={event.title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEventId, setEditingEventId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyEventId, setBusyEventId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const fileInputRef = useRef(null);

  const isBusy =
    isLoading ||
    isSaving ||
    isUploadingImage ||
    busyEventId !== null;

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/events/admin", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            "No se pudieron cargar los eventos"
          )
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "El servidor devolvió un formato de eventos inesperado."
        );
      }

      setEvents(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await loadEvents();
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loadEvents, reloadKey]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview("");
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setImageError("");
    setImageFile(null);
    setImagePreview("");

    if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
      setImageError("Selecciona una imagen JPEG, PNG o WebP.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size === 0) {
      setImageError("El archivo seleccionado está vacío.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setImageError("La imagen no puede superar 5 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(selectedFile);
  }

  async function uploadImage() {
    if (!imageFile) return null;

    setIsUploadingImage(true);
    setImageError("");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/event-images/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            "No fue posible subir la imagen"
          )
        );
      }

      const data = await response.json();

      if (!data?.image_url) {
        throw new Error(
          "El servidor no devolvió la dirección de la imagen."
        );
      }

      return data.image_url;
    } catch (uploadError) {
      setImageError(uploadError.message);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  }

  function startEditing(eventItem) {
    setEditingEventId(eventItem.id);
    setError("");
    setMessage("");
    clearImage();

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
    clearImage();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving || isUploadingImage) return;

    setError("");
    setMessage("");

    const isEditing = Boolean(editingEventId);

    const title = form.title.trim();
    const shortDescription = form.short_description.trim();
    const location = form.location.trim();
    const time = form.time.trim();
    const imageUrl = form.image_url.trim();
    const externalUrl = form.external_url.trim();

    if (title.length < 3 || title.length > 200) {
      setError("El título debe tener entre 3 y 200 caracteres.");
      return;
    }

    if (
      shortDescription.length < 5 ||
      shortDescription.length > 500
    ) {
      setError(
        "La descripción corta debe tener entre 5 y 500 caracteres."
      );
      return;
    }

    if (form.start_date && form.end_date) {
      if (form.end_date < form.start_date) {
        setError(
          "La fecha de cierre no puede ser anterior a la fecha de inicio."
        );
        return;
      }
    }

    if (imageError) {
      setError(
        "Corrige el problema de la imagen o quítala antes de guardar."
      );
      return;
    }

    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const uploadedUrl = await uploadImage();

        if (!uploadedUrl) {
          setError(
            imageError ||
              "No fue posible subir la imagen. Revisa el archivo e inténtalo de nuevo."
          );
          return;
        }

        finalImageUrl = uploadedUrl;
      }

      const url = isEditing
        ? `/events/${editingEventId}`
        : "/events";

      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        title,
        type: form.type,
        short_description: shortDescription,
        description: form.description.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        time: time || null,
        location: location || null,
        image_url: finalImageUrl || null,
        external_url: externalUrl || null,
        featured: form.featured,
      };

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            isEditing
              ? "No se pudo actualizar el evento"
              : "No se pudo crear el evento"
          )
        );
      }

      setMessage(
        isEditing
          ? "Evento actualizado correctamente."
          : "Evento creado como borrador."
      );

      setEditingEventId(null);
      setForm(EMPTY_FORM);
      clearImage();

      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(eventId, action) {
    if (busyEventId !== null) return;

    setError("");
    setMessage("");

    setBusyEventId(eventId);

    try {
      const response = await fetch(
        `/events/${eventId}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            action === "publish"
              ? "No se pudo publicar el evento"
              : "No se pudo retirar el evento"
          )
        );
      }

      setMessage(
        action === "publish"
          ? "Evento publicado correctamente."
          : "Evento retirado del calendario."
      );

      setReloadKey((value) => value + 1);
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusyEventId(null);
    }
  }

  async function handleDelete(eventId) {
    if (busyEventId !== null) return;

    setError("");
    setMessage("");

    const eventToDelete = events.find(
      (item) => item.id === eventId
    );

    const isConfirmed = window.confirm(
      `¿Eliminar definitivamente "${
        eventToDelete?.title || "este evento"
      }"?\n\nEsta acción no se puede deshacer.`
    );

    if (!isConfirmed) return;

    setBusyEventId(eventId);

    try {
      const response = await fetch(`/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            "No se pudo eliminar el evento"
          )
        );
      }

      setMessage("Evento eliminado correctamente.");

      if (editingEventId === eventId) {
        cancelEditing();
      }

      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyEventId(null);
    }
  }

  const draftCount = events.filter(
    (event) => event.status === "draft"
  ).length;

  const publishedCount = events.filter(
    (event) => event.status === "published"
  ).length;

  const previewUrl = imagePreview || form.image_url;

  return (
    <section
      className={styles.page}
      aria-labelledby="events-admin-title"
    >
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          Administración GENSTI
        </span>

        <h1 id="events-admin-title" className={styles.title}>
          Eventos de la comunidad
        </h1>

        <p className={styles.description}>
          Crea y administra festivales, talleres, conferencias
          y actividades de GENSTI.
        </p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {events.length}
            </span>

            <span className={styles.statLabel}>
              Eventos totales
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statValue}>
              {publishedCount}
            </span>

            <span className={styles.statLabel}>
              Publicados
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statValue}>
              {draftCount}
            </span>

            <span className={styles.statLabel}>
              Borradores
            </span>
          </div>
        </div>
      </header>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className={styles.successMessage} role="status">
          {message}
        </p>
      )}

      <section
        className={styles.formCard}
        aria-labelledby="event-form-title"
      >
        <div className={styles.formHeader}>
          <div>
            <h2 id="event-form-title" className={styles.formTitle}>
              {editingEventId
                ? "Editar evento"
                : "Nuevo evento"}
            </h2>

            <p className={styles.formDescription}>
              {editingEventId
                ? "Actualiza la información del evento seleccionado."
                : "Completa la información. El evento se guardará como borrador."}
            </p>
          </div>

          {editingEventId && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={cancelEditing}
              disabled={isBusy}
            >
              <X size={16} aria-hidden="true" />
              Cancelar edición
            </button>
          )}
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <fieldset
            className={styles.fields}
            disabled={isBusy}
          >
            <legend className={styles.srOnly}>
              Datos del evento
            </legend>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-title">
                Título <span aria-hidden="true">*</span>
              </label>

              <input
                id="event-title"
                name="title"
                className={styles.input}
                value={form.title}
                onChange={handleInputChange}
                placeholder="Ej. Feria de proyectos de ingeniería"
                required
                minLength={3}
                maxLength={200}
              />

              <p className={styles.hint}>
                Entre 3 y 200 caracteres.
              </p>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event-type">
                  Tipo
                </label>

                <select
                  id="event-type"
                  name="type"
                  className={styles.select}
                  value={form.type}
                  onChange={handleInputChange}
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label
                  className={styles.label}
                  htmlFor="event-location"
                >
                  Ubicación
                </label>

                <input
                  id="event-location"
                  name="location"
                  className={styles.input}
                  value={form.location}
                  onChange={handleInputChange}
                  placeholder="Ej. Auditorio principal"
                  maxLength={200}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="event-short-description"
              >
                Descripción corta{" "}
                <span aria-hidden="true">*</span>
              </label>

              <input
                id="event-short-description"
                name="short_description"
                className={styles.input}
                value={form.short_description}
                onChange={handleInputChange}
                placeholder="Resume el evento en una frase."
                required
                minLength={5}
                maxLength={500}
              />

              <p className={styles.hint}>
                Entre 5 y 500 caracteres.
              </p>
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="event-description"
              >
                Descripción completa
              </label>

              <textarea
                id="event-description"
                name="description"
                className={styles.textarea}
                value={form.description}
                onChange={handleInputChange}
                placeholder="Explica el propósito, actividades, requisitos o detalles adicionales."
                rows={6}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label
                  className={styles.label}
                  htmlFor="event-start-date"
                >
                  Fecha de inicio{" "}
                  <span aria-hidden="true">*</span>
                </label>

                <input
                  id="event-start-date"
                  type="date"
                  name="start_date"
                  className={styles.input}
                  value={form.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label
                  className={styles.label}
                  htmlFor="event-end-date"
                >
                  Fecha de cierre
                </label>

                <input
                  id="event-end-date"
                  type="date"
                  name="end_date"
                  className={styles.input}
                  value={form.end_date}
                  onChange={handleInputChange}
                  min={form.start_date || undefined}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-time">
                Horario
              </label>

              <input
                id="event-time"
                name="time"
                className={styles.input}
                value={form.time}
                onChange={handleInputChange}
                placeholder="Ejemplo: 8:00 a.m. - 5:00 p.m."
                maxLength={100}
              />
            </div>

            <section
              className={styles.imageSection}
              aria-labelledby="event-image-title"
            >
              <div className={styles.imageIntro}>
                <h2
                  id="event-image-title"
                  className={styles.imageTitle}
                >
                  Imagen del evento
                  <span className={styles.optional}>
                    Opcional
                  </span>
                </h2>

                <p className={styles.hint}>
                  JPEG, PNG o WebP. Máximo 5 MB.
                  También puedes pegar una URL.
                </p>
              </div>

              <div className={styles.imageGrid}>
                <label className={styles.uploadArea}>
                  <span
                    className={styles.uploadIcon}
                    aria-hidden="true"
                  >
                    <Upload size={21} strokeWidth={1.8} />
                  </span>

                  <span className={styles.uploadTitle}>
                    {imageFile
                      ? "Cambiar imagen"
                      : "Seleccionar imagen"}
                  </span>

                  <span className={styles.uploadDescription}>
                    Elige un archivo desde tu dispositivo.
                  </span>

                  <input
                    ref={fileInputRef}
                    className={styles.fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </label>

                <div className={styles.urlField}>
                  <label
                    className={styles.label}
                    htmlFor="event-image-url"
                  >
                    O pega una URL de imagen
                  </label>

                  <input
                    id="event-image-url"
                    type="url"
                    name="image_url"
                    className={styles.input}
                    value={form.image_url}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    disabled={Boolean(imageFile)}
                  />

                  {imageFile && (
                    <p className={styles.hint}>
                      La imagen seleccionada reemplazará la URL al guardar.
                    </p>
                  )}
                </div>
              </div>

              {imageError && (
                <p className={styles.errorMessage} role="alert">
                  {imageError}
                </p>
              )}

              {previewUrl ? (
                <figure className={styles.preview}>
                  <img
                    src={previewUrl}
                    alt="Vista previa de la imagen del evento"
                    onError={() => {
                      if (!imageFile) {
                        setImageError(
                          "No se pudo cargar la imagen desde la URL indicada."
                        );
                      }
                    }}
                  />

                  {imageFile && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={clearImage}
                    >
                      <X size={15} aria-hidden="true" />
                      Quitar imagen
                    </button>
                  )}
                </figure>
              ) : (
                <div className={styles.imageFallback}>
                  <ImageOff size={26} aria-hidden="true" />
                  <span>Sin imagen de evento</span>
                </div>
              )}

              {isUploadingImage && (
                <p className={styles.uploadingState} role="status">
                  <Loader2
                    size={16}
                    className={styles.spinner}
                    aria-hidden="true"
                  />
                  Subiendo imagen...
                </p>
              )}
            </section>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="event-external-url"
              >
                Enlace oficial
              </label>

              <input
                id="event-external-url"
                type="url"
                name="external_url"
                className={styles.input}
                value={form.external_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/convocatoria"
              />
            </div>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleInputChange}
              />

              <span>
                Mostrar como evento destacado
              </span>
            </label>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isBusy}
              >
                {isUploadingImage
                  ? "Subiendo imagen..."
                  : isSaving
                    ? "Guardando..."
                    : editingEventId
                      ? "Guardar cambios"
                      : "Guardar borrador"}
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      <section
        className={styles.listSection}
        aria-labelledby="events-list-title"
      >
        <div className={styles.listHeader}>
          <div>
            <h2 id="events-list-title" className={styles.listTitle}>
              Eventos registrados
            </h2>

            <p className={styles.listDescription}>
              Consulta, edita, publica o retira los eventos creados.
            </p>
          </div>

          <button
            type="button"
            className={styles.secondaryButton}
            disabled={isLoading}
            onClick={() => setReloadKey((value) => value + 1)}
          >
            {isLoading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {isLoading ? (
          <p className={styles.loadingState} role="status">
            <Loader2
              size={17}
              className={styles.spinner}
              aria-hidden="true"
            />
            Cargando eventos...
          </p>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <CalendarDays size={28} aria-hidden="true" />
            <h3>Todavía no hay eventos registrados</h3>
            <p>Crea el primer evento usando el formulario superior.</p>
          </div>
        ) : (
          <ul className={styles.eventList}>
            {events.map((eventItem) => {
              const isCurrentEvent =
                editingEventId === eventItem.id;

              const isDeleting =
                busyEventId === eventItem.id;

              return (
                <li
                  key={eventItem.id}
                  className={`${styles.eventCard} ${
                    isCurrentEvent ? styles.isEditing : ""
                  }`}
                >
                  <EventImage event={eventItem} />

                  <div className={styles.eventBody}>
                    <div className={styles.eventHeading}>
                      <div className={styles.eventHeadingText}>
                        <span className={styles.eventType}>
                          {eventItem.type}
                        </span>

                        <h3 className={styles.eventTitle}>
                          {eventItem.title}
                        </h3>
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

                    <p className={styles.eventDescription}>
                      {eventItem.short_description}
                    </p>

                    <div className={styles.eventMeta}>
                      <span>
                        <CalendarDays
                          size={15}
                          aria-hidden="true"
                        />
                        {formatDateRange(
                          eventItem.start_date,
                          eventItem.end_date
                        )}
                      </span>

                      {eventItem.location && (
                        <span>
                          <MapPin
                            size={15}
                            aria-hidden="true"
                          />
                          {eventItem.location}
                        </span>
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
                        className={styles.secondaryButton}
                        onClick={() => startEditing(eventItem)}
                        disabled={isBusy}
                      >
                        <Pencil size={15} aria-hidden="true" />
                        Editar
                      </button>

                      {eventItem.status === "draft" ? (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() =>
                            changeStatus(
                              eventItem.id,
                              "publish"
                            )
                          }
                          disabled={isBusy}
                        >
                          Publicar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            changeStatus(
                              eventItem.id,
                              "unpublish"
                            )
                          }
                          disabled={isBusy}
                        >
                          Retirar
                        </button>
                      )}

                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() =>
                          handleDelete(eventItem.id)
                        }
                        disabled={isBusy}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {isDeleting
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}