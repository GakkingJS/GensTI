import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImageOff, Loader2, Upload, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import styles from "../styles/NewsFormPage.module.css";

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "Anuncios",
  author_name: "",
  image_url: "",
  status: "published",
  is_featured: false,
};

const CATEGORIES = [
  "Anuncios",
  "Eventos",
  "Académico",
  "Comunidad",
  "Tecnología",
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

export default function NewsFormPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const isEditing = Boolean(newsId);
  const canCreateNews = hasPermission("news.create");
  const canEditNews = hasPermission("news.edit");

  const [form, setForm] = useState(emptyForm);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setForm(emptyForm);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadNews() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/news/${newsId}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            await getResponseError(
              response,
              "No fue posible cargar la noticia"
            )
          );
        }

        const data = await response.json();

        if (cancelled) return;

        setForm({
          title: data.title ?? "",
          excerpt: data.excerpt ?? "",
          content: data.content ?? "",
          category: data.category ?? "Anuncios",
          author_name: data.author_name ?? "",
          image_url: data.image_url ?? "",
          status: data.status ?? "published",
          is_featured: Boolean(data.is_featured),
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      cancelled = true;
    };
  }, [isEditing, newsId]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function handleChange(event) {
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

      const response = await fetch("/news-images/upload", {
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

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const title = form.title.trim();
    const excerpt = form.excerpt.trim();
    const content = form.content.trim();
    const authorName = form.author_name.trim();

    if (title.length < 5 || title.length > 180) {
      setError("El título debe tener entre 5 y 180 caracteres.");
      return;
    }

    if (excerpt.length < 10 || excerpt.length > 300) {
      setError(
        "El resumen debe tener entre 10 y 300 caracteres."
      );
      return;
    }

    if (content && content.length > 20000) {
      setError("El contenido no puede superar 20.000 caracteres.");
      return;
    }

    if (imageError) {
      setError(
        "Corrige el problema de la imagen o quítala antes de guardar."
      );
      return;
    }

    setSaving(true);

    try {
      let imageUrl = form.image_url.trim();

      if (imageFile) {
        const uploadedUrl = await uploadImage();

        if (!uploadedUrl) {
          setError(
            imageError ||
              "No fue posible subir la imagen. Revisa el archivo e inténtalo de nuevo."
          );
          return;
        }

        imageUrl = uploadedUrl;
      }

      const payload = {
        title,
        excerpt,
        content,
        category: form.category,
        author_name: authorName,
        image_url: imageUrl,
        status: form.status,
        is_featured: form.is_featured,
      };

      const response = await fetch(
        isEditing ? `/news/${newsId}` : "/news",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            isEditing
              ? "No fue posible actualizar la noticia"
              : "No fue posible crear la noticia"
          )
        );
      }

      setMessage(
        isEditing
          ? "Noticia actualizada correctamente."
          : "Noticia creada correctamente."
      );

      navigate("/noticias", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  if (isEditing && !canEditNews) {
    return (
      <section className={styles.page}>
        <p className={styles.notice}>
          No tienes permiso para editar noticias.
        </p>
      </section>
    );
  }

  if (!isEditing && !canCreateNews) {
    return (
      <section className={styles.page}>
        <p className={styles.notice}>
          No tienes permiso para crear noticias.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <p className={styles.loadingState}>
          Cargando noticia...
        </p>
      </section>
    );
  }

  const isBusy = saving || isUploadingImage;
  const previewUrl = imagePreview || form.image_url;

  return (
    <section
      className={styles.page}
      aria-labelledby="news-form-title"
    >
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          {isEditing ? "Editar noticia" : "Nueva noticia"}
        </span>

        <h1 id="news-form-title" className={styles.title}>
          {isEditing
            ? "Editar publicación"
            : "Publicar una noticia"}
        </h1>

        <p className={styles.description}>
          Crea o actualiza una noticia institucional para
          informar a la comunidad de Ingeniería de Sistemas.
        </p>

        <Link to="/noticias" className={styles.backLink}>
          ← Volver a noticias
        </Link>
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

      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset
          className={styles.fields}
          disabled={isBusy}
        >
          <legend className={styles.srOnly}>
            Datos de la noticia
          </legend>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              Título <span aria-hidden="true">*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              className={styles.input}
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Convocatoria de monitorías académicas"
              required
              minLength={5}
              maxLength={180}
            />

            <p className={styles.hint}>
              Entre 5 y 180 caracteres.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="excerpt">
              Resumen <span aria-hidden="true">*</span>
            </label>

            <input
              id="excerpt"
              name="excerpt"
              type="text"
              className={styles.input}
              value={form.excerpt}
              onChange={handleChange}
              placeholder="Resume la noticia en una frase clara."
              required
              minLength={10}
              maxLength={300}
            />

            <p className={styles.hint}>
              Entre 10 y 300 caracteres. Aparecerá en la tarjeta de la noticia.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="content">
              Contenido
            </label>

            <textarea
              id="content"
              name="content"
              rows={10}
              className={styles.textarea}
              value={form.content}
              onChange={handleChange}
              placeholder="Escribe el contenido completo de la noticia."
              maxLength={20000}
            />

            <p className={styles.counter}>
              {form.content.length.toLocaleString("es-CO")} / 20.000 caracteres
            </p>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="category">
                Categoría
              </label>

              <select
                id="category"
                name="category"
                className={styles.select}
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="author_name">
                Autor
              </label>

              <input
                id="author_name"
                name="author_name"
                type="text"
                className={styles.input}
                value={form.author_name}
                onChange={handleChange}
                placeholder="Ej. Equipo GENSTI"
                maxLength={120}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="status">
                Estado
              </label>

              <select
                id="status"
                name="status"
                className={styles.select}
                value={form.status}
                onChange={handleChange}
              >
                <option value="published">Publicada</option>
                <option value="draft">Borrador</option>
              </select>

              <p className={styles.hint}>
                Las noticias en borrador no aparecen en el listado público.
              </p>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                Noticia destacada
              </span>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                />

                <span>
                  Mostrar esta noticia como destacada
                </span>
              </label>
            </div>
          </div>

          <section
            className={styles.imageSection}
            aria-labelledby="news-image-title"
          >
            <div className={styles.imageIntro}>
              <h2
                id="news-image-title"
                className={styles.imageTitle}
              >
                Imagen de portada
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
                <span className={styles.uploadIcon} aria-hidden="true">
                  <Upload size={21} strokeWidth={1.8} />
                </span>

                <span className={styles.uploadTitle}>
                  {imageFile ? "Cambiar imagen" : "Seleccionar imagen"}
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
                <label className={styles.label} htmlFor="image_url">
                  O pega una URL de imagen
                </label>

                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  className={styles.input}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={form.image_url}
                  onChange={handleChange}
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
                  alt="Vista previa de la imagen de portada"
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
                <span>Sin imagen de portada</span>
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

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isBusy}
            >
              {isUploadingImage
                ? "Subiendo imagen..."
                : saving
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Publicar noticia"}
            </button>

            <Link to="/noticias" className={styles.secondaryButton}>
              Cancelar
            </Link>
          </div>
        </fieldset>
      </form>
    </section>
  );
}