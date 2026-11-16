import { useEffect, useRef, useState } from "react";

import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/CommunityPostsPage.module.css";

const CATEGORIES = [
  "General",
  "Académico",
  "Deportes",
  "Cultura",
  "Empleo",
  "Tecnología",
];

const SECTIONS = [
  {
    value: "community",
    label: "Comunidad",
    description: "Logros, actividades, experiencias e iniciativas.",
  },
  {
    value: "opportunities",
    label: "Oportunidades",
    description: "Becas, prácticas, empleos y convocatorias.",
  },
];

const SECTION_LABELS = {
  community: "Comunidad",
  opportunities: "Oportunidades",
};

const STATUS_LABELS = {
  pending: "Pendiente de revisión",
  published: "Publicada",
  rejected: "Rechazada",
};

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 20_000_000;

async function getResponseError(response, fallback) {
  const data = await response.json().catch(() => null);

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => {
        const location = item.loc?.filter(
          (part) => part !== "body"
        );

        const field = location?.join(".");
        const message = item.msg || "Valor inválido.";

        return field ? `${field}: ${message}` : message;
      })
      .join(" ");
  }

  if (response.status === 401) {
    return "Tu sesión no está activa. Inicia sesión nuevamente.";
  }

  if (response.status === 403) {
    return "No tienes permiso para realizar esta acción.";
  }

  if (response.status === 413) {
    return "La solicitud supera el tamaño permitido. Usa una imagen más pequeña.";
  }

  return `${fallback} (HTTP ${response.status}).`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PostImage({ src, alt }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) return null;

  return (
    <img
      className={styles.postImage}
      src={src}
      alt={alt || "Imagen de la publicación"}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

export default function CommunityPostsPage() {
  const [posts, setPosts] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [section, setSection] = useState("community");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageAuthorized, setImageAuthorized] = useState(false);
  const [imageError, setImageError] = useState("");

  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loadError, setLoadError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  /* PUBLICACIONES PROPIAS */

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/community-posts/mine", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            await getResponseError(
              response,
              "No se pudieron cargar tus publicaciones"
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
  }, [reloadKey]);

  /* VISTA PREVIA LOCAL */

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  function clearImage() {
    setImage(null);
    setImagePreview("");
    setImageAlt("");
    setImageAuthorized(false);
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setMessage("");
    setImageError("");
    setImage(null);
    setImagePreview("");
    setImageAlt("");
    setImageAuthorized(false);

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

    setImage(selectedFile);
  }

  /* ENVÍO A MODERACIÓN */

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current) return;

    setMessage("");
    setSubmitError("");

    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanAlt = imageAlt.trim();

    if (cleanTitle.length < 5 || cleanTitle.length > 180) {
      setSubmitError("El título debe tener entre 5 y 180 caracteres.");
      return;
    }

    if (cleanContent.length < 20 || cleanContent.length > 20000) {
      setSubmitError(
        "El contenido debe tener entre 20 y 20.000 caracteres."
      );
      return;
    }

    if (imageError) {
      setSubmitError(
        "Corrige el problema de la imagen o retírala antes de enviar."
      );
      return;
    }

    if (image && !cleanAlt) {
      setSubmitError("Escribe una descripción breve de la imagen.");
      return;
    }

    if (image && !imageAuthorized) {
      setSubmitError(
        "Debes confirmar que tienes autorización para compartir la imagen."
      );
      return;
    }

    const formData = new FormData();

    formData.append("title", cleanTitle);
    formData.append("content", cleanContent);
    formData.append("category", category);
    formData.append("section", section);

    if (image) {
      formData.append("file", image);
      formData.append("image_alt", cleanAlt);
      formData.append("image_authorized", "true");
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch("/community-posts/submit", {
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
            "No se pudo enviar la publicación"
          )
        );
      }

      setTitle("");
      setContent("");
      setCategory("General");
      setSection("community");
      clearImage();

      setMessage(
        "Publicación enviada correctamente. El equipo de moderación la revisará antes de que aparezca públicamente."
      );

      setReloadKey((value) => value + 1);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className={styles.page}
      aria-labelledby="community-posts-title"
    >
      <ScrollReveal>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Comunidad GENSTI</p>

          <h1 id="community-posts-title" className={styles.title}>
            Comparte algo que aporte
          </h1>

          <p className={styles.description}>
            Dale visibilidad a una iniciativa, un logro o una oportunidad
            para los estudiantes de Ingeniería de Sistemas.
          </p>

          <div className={styles.reviewNotice}>
            <span className={styles.noticeMark} aria-hidden="true">
              i
            </span>

            <p>
              Tu publicación pasará por revisión. Solo aparecerá
              públicamente cuando el equipo de moderación la apruebe.
            </p>
          </div>
        </header>
      </ScrollReveal>

      <ScrollReveal>
        <section
          className={styles.formSection}
          aria-labelledby="create-post-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Tu aporte cuenta</p>

              <h2 id="create-post-title" className={styles.formTitle}>
                Crear publicación
              </h2>

              <p className={styles.sectionDescription}>
                Los campos con asterisco son obligatorios.
                La fotografía es opcional.
              </p>
            </div>

            <span className={styles.reviewBadge}>
              Con revisión previa
            </span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <fieldset
              className={styles.formFields}
              disabled={isSubmitting}
            >
              <legend className={styles.srOnly}>
                Datos de la publicación
              </legend>

              <fieldset className={styles.destinationFieldset}>
                <legend className={styles.fieldLabel}>
                  ¿En qué sección debe aparecer? *
                </legend>

                <div className={styles.destinationGrid}>
                  {SECTIONS.map((item) => (
                    <label
                      key={item.value}
                      className={`${styles.destinationCard} ${
                        section === item.value
                          ? styles.destinationSelected
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="section"
                        value={item.value}
                        checked={section === item.value}
                        onChange={(event) =>
                          setSection(event.target.value)
                        }
                        required
                      />

                      <span className={styles.destinationCopy}>
                        <span className={styles.destinationTitle}>
                          {item.label}
                        </span>

                        <span className={styles.destinationDescription}>
                          {item.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={styles.formRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Título *</span>

                  <input
                    className={styles.input}
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej. Convocatoria de monitorías académicas"
                    required
                    minLength={5}
                    maxLength={180}
                  />

                  <span className={styles.fieldHint}>
                    Un título claro ayuda a identificar tu publicación.
                  </span>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Categoría *</span>

                  <select
                    className={styles.select}
                    name="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <span className={styles.fieldHint}>
                    Elige el tema principal.
                  </span>
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Contenido *</span>

                <textarea
                  className={styles.textarea}
                  name="content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    "Cuéntanos de qué se trata.\n\n" +
                    "Incluye fechas, requisitos, lugar y medios de contacto " +
                    "cuando corresponda."
                  }
                  required
                  minLength={20}
                  maxLength={20000}
                  rows={8}
                  aria-describedby="post-content-hint"
                />

                <span
                  id="post-content-hint"
                  className={styles.fieldFooter}
                >
                  <span>Mínimo 20 caracteres.</span>
                  <span>{content.length.toLocaleString("es-CO")} / 20.000</span>
                </span>
              </label>

              <section
                className={styles.imageSection}
                aria-labelledby="post-image-title"
              >
                <div>
                  <h3
                    id="post-image-title"
                    className={styles.imageSectionTitle}
                  >
                    Fotografía
                    <span className={styles.optional}>Opcional</span>
                  </h3>

                  <p id="post-image-hint" className={styles.fieldHint}>
                    JPEG, PNG o WebP. Máximo 5 MB y 20 megapíxeles.
                  </p>
                </div>

                <label className={styles.uploadArea}>
                  <span className={styles.uploadTitle}>
                    {image ? "Cambiar fotografía" : "Seleccionar fotografía"}
                  </span>

                  <span className={styles.uploadDescription}>
                    Elige un archivo desde tu dispositivo.
                  </span>

                  <input
                    ref={fileInputRef}
                    className={styles.fileInput}
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    aria-describedby="post-image-hint"
                  />
                </label>

                {imageError && (
                  <p className={styles.errorMessage} role="alert">
                    {imageError}
                  </p>
                )}

                {image && (
                  <div className={styles.imageDetails}>
                    {imagePreview && (
                      <figure className={styles.preview}>
                        <img
                          src={imagePreview}
                          alt={imageAlt.trim() || "Vista previa de la imagen"}
                          onLoad={(event) => {
                            const { naturalWidth, naturalHeight } =
                              event.currentTarget;

                            if (
                              naturalWidth * naturalHeight >
                              MAX_IMAGE_PIXELS
                            ) {
                              setImageError(
                                "La imagen supera los 20 megapíxeles. Selecciona una de menor resolución."
                              );
                            }
                          }}
                          onError={() => {
                            setImageError(
                              "No se pudo leer la imagen. Selecciona otro archivo."
                            );
                          }}
                        />
                      </figure>
                    )}

                    <div className={styles.fileSummary}>
                      <div>
                        <p className={styles.fileName}>{image.name}</p>

                        <p className={styles.fieldHint}>
                          {(image.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={clearImage}
                      >
                        Quitar imagen
                      </button>
                    </div>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        Descripción de la imagen *
                      </span>

                      <input
                        className={styles.input}
                        name="image_alt"
                        value={imageAlt}
                        onChange={(event) =>
                          setImageAlt(event.target.value)
                        }
                        placeholder="Ej. Estudiantes presentando su proyecto de software"
                        maxLength={300}
                        required
                      />

                      <span className={styles.fieldHint}>
                        Describe brevemente lo que aparece en la fotografía.
                      </span>
                    </label>

                    <label className={styles.checkboxField}>
                      <input
                        type="checkbox"
                        name="image_authorized"
                        checked={imageAuthorized}
                        onChange={(event) =>
                          setImageAuthorized(event.target.checked)
                        }
                        required
                      />

                      <span>
                        Confirmo que tengo autorización para compartir esta
                        imagen y, cuando corresponde, el consentimiento de
                        las personas que aparecen en ella.
                      </span>
                    </label>
                  </div>
                )}
              </section>

              <div className={styles.formActions}>
                <p className={styles.submitHint}>
                  Se enviará a revisión para la sección{" "}
                  <span>{SECTION_LABELS[section]}</span>.
                </p>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || Boolean(imageError)}
                >
                  {isSubmitting ? "Enviando..." : "Enviar a revisión"}
                </button>
              </div>
            </fieldset>

            {submitError && (
              <p className={styles.errorMessage} role="alert">
                {submitError}
              </p>
            )}

            {message && (
              <p className={styles.successMessage} role="status">
                {message}
              </p>
            )}
          </form>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section
          className={styles.myPosts}
          aria-labelledby="my-posts-title"
          aria-busy={isLoading}
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="my-posts-title" className={styles.sectionTitle}>
                Mis publicaciones
              </h2>

              <p className={styles.sectionDescription}>
                Consulta el estado de tus envíos y las observaciones
                del equipo de moderación.
              </p>
            </div>

            <button
              type="button"
              className={styles.refreshButton}
              disabled={isLoading}
              onClick={() => setReloadKey((value) => value + 1)}
            >
              {isLoading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {loadError && (
            <p className={styles.errorMessage} role="alert">
              {loadError}
            </p>
          )}

          {isLoading ? (
            <p className={styles.loadingState} role="status">
              Cargando tus publicaciones...
            </p>
          ) : posts.length === 0 ? (
            !loadError && (
              <div className={styles.emptyState}>
                <h3>Tu primera publicación empieza aquí</h3>
                <p>
                  Completa el formulario para compartir algo con la comunidad.
                </p>
              </div>
            )
          ) : (
            <div className={styles.postsList}>
              {posts.map((post) => (
                <article key={post.id} className={styles.postCard}>
                  <PostImage
                    src={post.image_url}
                    alt={post.image_alt}
                  />

                  <div className={styles.postBody}>
                    <div className={styles.postHeader}>
                      <div className={styles.postTags}>
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

                    <h3 className={styles.postTitle}>{post.title}</h3>

                    {post.created_at && (
                      <p className={styles.postDate}>
                        Enviada el {formatDate(post.created_at)}
                      </p>
                    )}

                    <p className={styles.postContent}>{post.content}</p>

                    {post.admin_note && (
                      <div className={styles.adminNote}>
                        <h4>
                          {post.status === "rejected"
                            ? "Motivo del rechazo"
                            : "Nota del equipo de moderación"}
                        </h4>

                        <p>{post.admin_note}</p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>
    </section>
  );
}