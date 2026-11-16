import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  ImagePlus,
  Pencil,
  Plus,
  Save,
} from "lucide-react";

import styles from "../styles/TbogAdminPage.module.css";

const EMPTY_FORM = {
  content_type: "recognition",
  student_name: "",
  title: "",
  description: "",
  category: "excelencia",
  period: "",
  image_alt: "",
  image_position: "center",
  featured: false,
  status: "draft",
  publication_authorized: false,
};

const CATEGORIES = [
  ["semilleros", "Semilleros"],
  ["saber-pro", "Saber Pro"],
  ["proyectos", "Proyectos"],
  ["excelencia", "Excelencia académica"],
];

const STATUS_LABELS = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

async function apiRequest(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (options.method && options.method !== "GET") {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  if (options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = `Error de solicitud (${response.status}).`;

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((item) => item.msg).join(" ");
    }

    throw new Error(message);
  }

  return data;
}

function TbogAdminPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEntries() {
      try {
        const data = await apiRequest("/tbog/admin/entries", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setEntries(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setListError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEntries();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setLocalPreview("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setLocalPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function refreshEntries() {
    setLoading(true);
    setListError("");

    try {
      const data = await apiRequest("/tbog/admin/entries");
      setEntries(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function clearFile() {
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setCurrentImage("");
    setFormError("");
    clearFile();
  }

  function startNew() {
    resetForm();
    setNotice("");
    formRef.current?.scrollIntoView({ block: "start" });
    formRef.current?.querySelector("select")?.focus({
      preventScroll: true,
    });
  }

  function editEntry(entry) {
    setEditingId(entry.id);
    setCurrentImage(entry.image_url ?? "");

    setForm({
      content_type: entry.content_type,
      student_name: entry.student_name ?? "",
      title: entry.title,
      description: entry.description,
      category: entry.category,
      period: entry.period ?? "",
      image_alt: entry.image_alt ?? "",
      image_position: entry.image_position ?? "center",
      featured: entry.featured,
      status: entry.status,
      publication_authorized: entry.publication_authorized,
    });

    clearFile();
    setFormError("");
    setNotice("");

    formRef.current?.scrollIntoView({ block: "start" });
    formRef.current?.querySelector("select")?.focus({
      preventScroll: true,
    });
  }

  function selectImage(event) {
    const file = event.target.files?.[0];

    setFormError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      event.target.value = "";
      setImageFile(null);
      setFormError("Selecciona una imagen JPEG, PNG o WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setImageFile(null);
      setFormError("La fotografía no puede superar 5 MB.");
      return;
    }

    setImageFile(file);

    // Una fotografía nueva requiere confirmar de nuevo su autorización.
    setForm((previous) => ({
      ...previous,
      publication_authorized: false,
    }));
  }

  async function saveEntry(event) {
    event.preventDefault();

    if (saving) return;

    setFormError("");
    setNotice("");

    if (
      form.status === "published" &&
      !imageFile &&
      !currentImage
    ) {
      setFormError("Selecciona una fotografía antes de publicar.");
      return;
    }

    if (
      form.status === "published" &&
      (!form.publication_authorized || !form.image_alt.trim())
    ) {
      setFormError(
        "Para publicar, completa el texto alternativo y confirma la autorización."
      );
      return;
    }

    const payload = {
      ...form,
      student_name: form.student_name.trim() || null,
      title: form.title.trim(),
      description: form.description.trim(),
      period: form.period.trim(),
      image_alt: form.image_alt.trim(),
      featured:
        form.content_type === "recognition" && form.featured,
    };

    setSaving(true);

    let id = editingId;
    let intermediateSaved = false;

    try {
      // Primero crea un borrador para obtener un ID.
      if (!id) {
        const created = await apiRequest("/tbog/admin/entries", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            status: "draft",
            publication_authorized: false,
          }),
        });

        id = created.id;
        setEditingId(id);
        intermediateSaved = true;
      }

      // La subida deja el registro en borrador en el backend.
      if (imageFile) {
        const body = new FormData();
        body.append("file", imageFile);

        const uploaded = await apiRequest(
          `/tbog/admin/entries/${id}/image`,
          {
            method: "POST",
            body,
          }
        );

        setCurrentImage(uploaded.image_url ?? "");
        clearFile();
        intermediateSaved = true;
      }

      // Guarda todos los datos y el estado solicitado.
      await apiRequest(`/tbog/admin/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      resetForm();

      setNotice(
        payload.status === "published"
          ? "Contenido publicado correctamente."
          : payload.status === "archived"
          ? "Contenido archivado correctamente."
          : "Borrador guardado correctamente."
      );

      await refreshEntries();
    } catch (error) {
      setFormError(
        intermediateSaved
          ? `${error.message} Hay cambios parciales guardados. Puedes corregir y volver a guardar; no se creará otro registro.`
          : error.message
      );

      await refreshEntries();
    } finally {
      setSaving(false);
    }
  }

  const previewImage = localPreview || currentImage;

  return (
    <section
      className={styles.page}
      aria-labelledby="tbog-admin-title"
    >
      <div className={styles.container}>
        <Link to="/admin" className={styles.backLink}>
          <ArrowLeft size={18} />
          Volver al panel
        </Link>

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.headerIcon}>
              <Award size={30} />
            </span>

            <div>
              <span className={styles.eyebrow}>
                EXCELENCIA · COMUNIDAD
              </span>
              <h1 id="tbog-admin-title">Administrar TBOG</h1>
              <p>
                Reconoce el talento y conserva los momentos de GENSTI.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={startNew}
            disabled={saving}
          >
            <Plus size={18} />
            Nuevo contenido
          </button>
        </header>

        {notice && (
          <p className={styles.success} role="status">
            {notice}
          </p>
        )}

        <div className={styles.layout}>
          <section
            className={styles.panel}
            aria-labelledby="tbog-form-title"
            ref={formRef}
          >
            <div className={styles.panelHeading}>
              <h2 id="tbog-form-title">
                {editingId ? "Editar contenido" : "Nuevo contenido"}
              </h2>
              <p>
                Guarda un borrador o publica cuando esté verificado.
              </p>
            </div>

            <form className={styles.form} onSubmit={saveEntry}>
              <fieldset
                className={styles.fieldset}
                disabled={saving}
              >
                <div className={styles.twoColumns}>
                  <label className={styles.field}>
                    Tipo de contenido
                    <select
                      name="content_type"
                      value={form.content_type}
                      onChange={updateField}
                    >
                      <option value="recognition">
                        Reconocimiento
                      </option>
                      <option value="gallery">
                        Fotografía de IMA-GensTI
                      </option>
                    </select>
                  </label>

                  <label className={styles.field}>
                    Categoría
                    <select
                      name="category"
                      value={form.category}
                      onChange={updateField}
                    >
                      {CATEGORIES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className={styles.field}>
                  Estudiante o equipo
                  <input
                    name="student_name"
                    value={form.student_name}
                    onChange={updateField}
                    maxLength={200}
                    placeholder="Nombre público, opcional"
                  />
                </label>

                <label className={styles.field}>
                  Título
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    minLength={3}
                    maxLength={200}
                    required
                    placeholder="¿Qué logro o momento quieres destacar?"
                  />
                </label>

                <label className={styles.field}>
                  Descripción
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    minLength={10}
                    maxLength={20000}
                    rows={6}
                    required
                    placeholder="Cuenta qué ocurrió y por qué merece reconocimiento."
                  />
                </label>

                <label className={styles.field}>
                  Periodo o fecha
                  <input
                    name="period"
                    value={form.period}
                    onChange={updateField}
                    maxLength={120}
                    placeholder="Ejemplo: semestre o fecha del evento"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.inlineLabel}>
                    <ImagePlus size={18} />
                    Fotografía
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selectImage}
                    aria-describedby="tbog-image-help"
                  />
                </label>

                <p
                  id="tbog-image-help"
                  className={styles.help}
                >
                  JPEG, PNG o WebP. Máximo 5 MB y 20 megapíxeles.
                  Seleccionar un archivo reemplaza la fotografía al guardar.
                </p>

                {imageFile && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={clearFile}
                  >
                    Quitar selección de archivo
                  </button>
                )}

                <div className={styles.twoColumns}>
                  <label className={styles.field}>
                    Texto alternativo
                    <input
                      name="image_alt"
                      value={form.image_alt}
                      onChange={updateField}
                      maxLength={300}
                      required={form.status === "published"}
                      placeholder="Describe lo que se ve en la foto"
                    />
                  </label>

                  <label className={styles.field}>
                    Encuadre
                    <select
                      name="image_position"
                      value={form.image_position}
                      onChange={updateField}
                    >
                      <option value="center">Centro</option>
                      <option value="top">Parte superior</option>
                      <option value="bottom">Parte inferior</option>
                    </select>
                  </label>
                </div>

                {form.content_type === "recognition" && (
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={form.featured}
                      onChange={updateField}
                    />
                    <span>
                      Mostrar en “Historias que inspiran”
                    </span>
                  </label>
                )}

                <label className={styles.field}>
                  Estado
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </label>

                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="publication_authorized"
                    checked={form.publication_authorized}
                    onChange={updateField}
                    required={form.status === "published"}
                  />
                  <span>
                    Confirmo que la información fue verificada y
                    cuento con la autorización correspondiente para
                    publicar los nombres y la fotografía.
                  </span>
                </label>

                <p className={styles.help}>
                  Los borradores y archivados no aparecen en la
                  consulta pública. Reemplazar una fotografía la
                  devuelve a borrador hasta completar la publicación.
                </p>
              </fieldset>

              {formError && (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={resetForm}
                  disabled={saving}
                >
                  {editingId ? "Cancelar edición" : "Limpiar"}
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving
                    ? "Guardando..."
                    : form.status === "published"
                    ? "Guardar y publicar"
                    : "Guardar contenido"}
                </button>
              </div>

              <span role="status" className={styles.help}>
                {saving
                  ? "Guardando datos y fotografía. Espera a que termine."
                  : ""}
              </span>
            </form>
          </section>

          <aside
            className={styles.preview}
            aria-labelledby="tbog-preview-title"
          >
            <span className={styles.eyebrow}>VISTA PREVIA</span>
            <h2 id="tbog-preview-title">
              Así se verá tu contenido
            </h2>

            <article className={styles.previewCard}>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={form.image_alt || "Vista previa de la fotografía"}
                  className={styles.previewImage}
                  style={{ objectPosition: form.image_position }}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <ImagePlus size={36} />
                  <span>Selecciona una fotografía</span>
                </div>
              )}

              <div className={styles.previewBody}>
                <span className={styles.category}>
                  {form.content_type === "gallery"
                    ? "IMA-GENSTI"
                    : CATEGORIES.find(
                        ([value]) => value === form.category
                      )?.[1]}
                </span>

                <h3>{form.title || "El próximo logro de GENSTI"}</h3>

                {form.student_name && (
                  <p className={styles.studentName}>
                    {form.student_name}
                  </p>
                )}

                <p className={styles.description}>
                  {form.description ||
                    "Aquí aparecerá la historia que quieres compartir."}
                </p>

                <small>{form.period || "Periodo o fecha"}</small>
              </div>
            </article>

            <p className={styles.help}>
              Vista orientativa. Conservaremos el diseño de tu
              página pública al conectarla.
            </p>
          </aside>
        </div>

        <section
          className={styles.panel}
          aria-labelledby="tbog-list-title"
        >
          <div className={styles.listHeading}>
            <div>
              <h2 id="tbog-list-title">Contenido registrado</h2>
              <p>
                {loading
                  ? "Consultando contenido..."
                  : `${entries.length} registros`}
              </p>
            </div>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={refreshEntries}
              disabled={loading || saving}
            >
              Actualizar
            </button>
          </div>

          {listError ? (
            <p className={styles.error} role="alert">
              {listError}
            </p>
          ) : loading ? (
            <p className={styles.empty} role="status">
              Cargando contenido...
            </p>
          ) : entries.length === 0 ? (
            <p className={styles.empty}>
              Todavía no hay contenido. Crea el primer reconocimiento.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  Reconocimientos y fotografías de TBOG
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Contenido</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div className={styles.entrySummary}>
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt=""
                              loading="lazy"
                              className={styles.thumbnail}
                            />
                          )}
                          <div>
                            <span className={styles.entryTitle}>
                              {entry.title}
                            </span>
                            <small>{entry.student_name}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {entry.content_type === "gallery"
                          ? "Galería IMA"
                          : "Reconocimiento"}
                      </td>

                      <td>
                        <span
                          className={`${styles.status} ${
                            styles[entry.status]
                          }`}
                        >
                          {STATUS_LABELS[entry.status]}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => editEntry(entry)}
                          disabled={saving}
                          aria-label={`Editar ${entry.title}`}
                        >
                          <Pencil size={15} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default TbogAdminPage;