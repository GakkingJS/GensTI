import { useEffect, useRef, useState } from "react";

import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/AdminCommunityPostsPage.module.css";

const STATUS_LABELS = {
  pending: "Pendiente",
  published: "Publicada",
  rejected: "Rechazada",
};

const SECTION_LABELS = {
  community: "Comunidad",
  opportunities: "Oportunidades",
};

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
    return "No tienes permiso para moderar publicaciones.";
  }

  if (response.status === 409) {
    return "Esta publicación ya fue revisada. Actualiza el listado.";
  }

  return `${fallback} (HTTP ${response.status}).`;
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function PostImage({ post }) {
  const [failed, setFailed] = useState(false);

  if (!post.image_url) return null;

  return (
    <section
      className={styles.imageSection}
      aria-label="Fotografía adjunta"
    >
      <div className={styles.imageHeader}>
        <h4>Fotografía adjunta</h4>

        <a
          className={styles.imageLink}
          href={post.image_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir imagen
        </a>
      </div>

      {failed ? (
        <div className={styles.imageFallback} role="status">
          <p>No fue posible cargar la fotografía.</p>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setFailed(false)}
          >
            Reintentar imagen
          </button>
        </div>
      ) : (
        <img
          className={styles.postImage}
          src={post.image_url}
          alt={post.image_alt || "Fotografía adjunta a la publicación"}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}

      <dl className={styles.imageMetadata}>
        <div>
          <dt>Texto alternativo</dt>
          <dd>{post.image_alt || "No registrado."}</dd>
        </div>

        <div>
          <dt>Autorización declarada por el autor</dt>
          <dd>
            {post.image_authorized
              ? "Sí. El autor confirmó que tiene autorización."
              : "No registrada."}
          </dd>
        </div>
      </dl>

      <p className={styles.imageHint}>
        Revisa la fotografía antes de aprobar. La declaración del autor
        no sustituye la revisión del contenido.
      </p>
    </section>
  );
}

export default function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const [notes, setNotes] = useState({});
  const [destinations, setDestinations] = useState({});

  const [statusFilter, setStatusFilter] = useState("pending");
  const [sectionFilter, setSectionFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [busyAction, setBusyAction] = useState(null);
  const actionLockRef = useRef(false);

  const isBusy = busyAction !== null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      setIsLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams();

        if (statusFilter) {
          params.set("status_filter", statusFilter);
        }

        const query = params.toString();

        const response = await fetch(
          `/community-posts/${query ? `?${query}` : ""}`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            await getResponseError(
              response,
              "No se pudieron cargar las publicaciones"
            )
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "El servidor devolvió un formato de publicaciones inesperado."
          );
        }

        if (!controller.signal.aborted) {
          setPosts(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPosts();

    return () => controller.abort();
  }, [statusFilter, reloadKey]);

  const visiblePosts = sectionFilter
    ? posts.filter(
        (post) => (post.section || "community") === sectionFilter
      )
    : posts;

  function clearDraft(postId) {
    setNotes((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });

    setDestinations((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  async function reviewPost(post, newStatus) {
    if (actionLockRef.current || isLoading || loadError) return;

    setActionError("");
    setMessage("");

    const destination =
      destinations[post.id] ?? post.section ?? "community";

    const note = (notes[post.id] || "").trim();

    if (note.length > 2000) {
      setActionError(
        "La nota de moderación no puede superar 2.000 caracteres."
      );
      return;
    }

    if (
      newStatus === "published" &&
      post.image_url &&
      (!post.image_authorized || !post.image_alt?.trim())
    ) {
      setActionError(
        "No puedes publicar esta fotografía sin autorización declarada y texto alternativo."
      );
      return;
    }

    actionLockRef.current = true;

    setBusyAction({
      id: post.id,
      type: newStatus,
    });

    try {
      const response = await fetch(
        `/community-posts/${post.id}/review`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            status: newStatus,
            admin_note: note || null,
            section: destination,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            "No se pudo revisar la publicación"
          )
        );
      }

      clearDraft(post.id);

      setMessage(
        newStatus === "published"
          ? `Publicación aprobada para la sección ${SECTION_LABELS[destination]}.`
          : "Publicación rechazada. La nota registrada estará disponible para su autor."
      );

      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error.message);
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  }

  async function deletePost(post) {
    if (actionLockRef.current || isLoading || loadError) return;

    const confirmed = window.confirm(
      `¿Eliminar definitivamente "${post.title}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setActionError("");
    setMessage("");

    actionLockRef.current = true;

    setBusyAction({
      id: post.id,
      type: "delete",
    });

    try {
      const response = await fetch(
        `/community-posts/${post.id}`,
        {
          method: "DELETE",
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
            "No se pudo eliminar la publicación"
          )
        );
      }

      clearDraft(post.id);
      setMessage("Publicación eliminada correctamente.");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error.message);
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  }

  return (
    <section
      className={styles.page}
      aria-labelledby="moderation-title"
    >
      <ScrollReveal>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Administración GENSTI</p>

          <h1 id="moderation-title" className={styles.title}>
            Moderar publicaciones
          </h1>

          <p className={styles.description}>
            Revisa el contenido, la fotografía y la sección de destino
            antes de aprobar los aportes de la comunidad.
          </p>
        </header>
      </ScrollReveal>

      <div className={styles.notice}>
        <p>
          Aprobar una publicación la incorpora al feed de su sección.
          Puedes corregir el destino mientras esté pendiente de revisión.
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <label className={styles.filterField}>
            <span>Estado</span>

            <select
              className={styles.select}
              value={statusFilter}
              disabled={isBusy}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setActionError("");
                setMessage("");
              }}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="published">Publicadas</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Sección</span>

            <select
              className={styles.select}
              value={sectionFilter}
              disabled={isBusy}
              onChange={(event) =>
                setSectionFilter(event.target.value)
              }
            >
              <option value="">Todas las secciones</option>
              <option value="community">Comunidad</option>
              <option value="opportunities">Oportunidades</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isLoading || isBusy}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          {isLoading ? "Actualizando..." : "Actualizar listado"}
        </button>
      </div>

      {message && (
        <p className={styles.successMessage} role="status">
          {message}
        </p>
      )}

      {actionError && (
        <p className={styles.errorMessage} role="alert">
          {actionError}
        </p>
      )}

      <div aria-busy={isLoading}>
        {isLoading ? (
          <p className={styles.loadingState} role="status">
            Cargando publicaciones...
          </p>
        ) : loadError ? (
          <div className={styles.emptyState} role="alert">
            <h2>No pudimos cargar el listado</h2>
            <p>{loadError}</p>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No hay publicaciones para estos filtros</h2>
            <p>
              Cambia el estado o la sección para consultar otros envíos.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.resultsCount}>
              {visiblePosts.length}{" "}
              {visiblePosts.length === 1
                ? "publicación en esta consulta"
                : "publicaciones en esta consulta"}
            </p>

            <div className={styles.list}>
              {visiblePosts.map((post) => {
                const destination =
                  destinations[post.id] ??
                  post.section ??
                  "community";

                const imageDataIncomplete =
                  Boolean(post.image_url) &&
                  (!post.image_authorized || !post.image_alt?.trim());

                const isPublishing =
                  busyAction?.id === post.id &&
                  busyAction.type === "published";

                const isRejecting =
                  busyAction?.id === post.id &&
                  busyAction.type === "rejected";

                const isDeleting =
                  busyAction?.id === post.id &&
                  busyAction.type === "delete";

                return (
                  <ScrollReveal key={post.id}>
                    <article
                      className={styles.card}
                      aria-labelledby={`post-title-${post.id}`}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.tags}>
                          <span className={styles.sectionTag}>
                            {SECTION_LABELS[post.section] || "Comunidad"}
                          </span>

                          <span className={styles.category}>
                            {post.category}
                          </span>
                        </div>

                        <span
                          className={`${styles.statusBadge} ${
                            styles[post.status] || ""
                          }`}
                        >
                          {STATUS_LABELS[post.status] || post.status}
                        </span>
                      </div>

                      <h2
                        id={`post-title-${post.id}`}
                        className={styles.postTitle}
                      >
                        {post.title}
                      </h2>

                      <p className={styles.postDate}>
                        Enviada el {formatDate(post.created_at)}
                      </p>

                      <p className={styles.postContent}>
                        {post.content}
                      </p>

                      <PostImage
                        key={`${post.id}-${post.image_url || "none"}`}
                        post={post}
                      />

                      {post.status === "pending" ? (
                        <fieldset
                          className={styles.reviewActions}
                          disabled={isBusy}
                        >
                          <legend>Revisión de la publicación</legend>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>
                              Sección de destino
                            </span>

                            <select
                              className={styles.select}
                              value={destination}
                              onChange={(event) => {
                                const value = event.target.value;

                                setDestinations((current) => ({
                                  ...current,
                                  [post.id]: value,
                                }));
                              }}
                            >
                              <option value="community">
                                Comunidad
                              </option>

                              <option value="opportunities">
                                Oportunidades
                              </option>
                            </select>

                            <span className={styles.fieldHint}>
                              El cambio se guarda al publicar o rechazar.
                            </span>
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>
                              Nota para el estudiante
                            </span>

                            <textarea
                              className={styles.noteTextarea}
                              value={notes[post.id] || ""}
                              onChange={(event) => {
                                const value = event.target.value;

                                setNotes((current) => ({
                                  ...current,
                                  [post.id]: value,
                                }));
                              }}
                              placeholder="Explica ajustes o el motivo del rechazo."
                              maxLength={2000}
                              rows={3}
                            />

                            <span className={styles.fieldHint}>
                              Opcional. Si rechazas el envío, explica qué
                              necesita corregir el autor.
                            </span>
                          </label>

                          {imageDataIncomplete && (
                            <p className={styles.warningMessage}>
                              La fotografía no tiene autorización declarada
                              o texto alternativo. No se puede publicar en
                              estas condiciones.
                            </p>
                          )}

                          <div className={styles.reviewFooter}>
                            <p className={styles.destinationHint}>
                              Destino al aprobar:{" "}
                              <span>
                                {SECTION_LABELS[destination]}
                              </span>
                            </p>

                            <div className={styles.reviewButtons}>
                              <button
                                type="button"
                                className={styles.rejectButton}
                                onClick={() =>
                                  reviewPost(post, "rejected")
                                }
                              >
                                {isRejecting ? "Rechazando..." : "Rechazar"}
                              </button>

                              <button
                                type="button"
                                className={styles.approveButton}
                                disabled={imageDataIncomplete}
                                onClick={() =>
                                  reviewPost(post, "published")
                                }
                              >
                                {isPublishing
                                  ? "Publicando..."
                                  : "Aprobar y publicar"}
                              </button>
                            </div>
                          </div>
                        </fieldset>
                      ) : (
                        <div className={styles.reviewedInfo}>
                          <p>
                            Revisada el {formatDate(post.reviewed_at)}
                          </p>

                          {post.admin_note && (
                            <div className={styles.adminNote}>
                              <h3>Nota de moderación</h3>
                              <p>{post.admin_note}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <footer className={styles.cardFooter}>
                        <p>
                          {post.status === "pending"
                            ? "Este envío todavía no es público."
                            : post.status === "published"
                              ? "Esta publicación está aprobada."
                              : "Este envío fue rechazado y no es público."}
                        </p>

                        <button
                          type="button"
                          className={styles.deleteButton}
                          disabled={isBusy}
                          onClick={() => deletePost(post)}
                        >
                          {isDeleting
                            ? "Eliminando..."
                            : "Eliminar publicación"}
                        </button>
                      </footer>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}