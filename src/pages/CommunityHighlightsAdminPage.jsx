import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Save,
} from "lucide-react";

import styles from "../styles/CommunityHighlightsAdminPage.module.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "Comunidad",
  sort_order: 0,
  image_alt: "",
  image_position: "center",
  status: "draft",
  publication_authorized: false,
};

const STATUS_LABELS = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

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
    let message = `No se pudo completar la solicitud (${response.status}).`;

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => item.msg)
        .join(" ");
    }

    throw new Error(message);
  }

  return data;
}

function CommunityHighlightsAdminPage() {
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

  const editorRef = useRef(null);
  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEntries() {
      try {
        const data = await apiRequest(
          "/community-highlights/admin/entries",
          { signal: controller.signal }
        );

        if (!Array.isArray(data)) {
          throw new Error(
            "El servidor devolvió un listado inesperado."
          );
        }

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
      const data = await apiRequest(
        "/community-highlights/admin/entries"
      );

      if (!Array.isArray(data)) {
        throw new Error(
          "El servidor devolvió un listado inesperado."
        );
      }

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

  function focusEditor() {
    editorRef.current?.scrollIntoView({
      block: "start",
    });

    titleInputRef.current?.focus({
      preventScroll: true,
    });
  }

  function startNew() {
    resetForm();
    setNotice("");
    focusEditor();
  }

  function editEntry(entry) {
    setEditingId(entry.id);
    setCurrentImage(entry.image ?? "");

    setForm({
      title: entry.title,
      description: entry.description,
      category: entry.category,
      sort_order: entry.sort_order,
      image_alt: entry.image_alt ?? "",
      image_position: entry.image_position ?? "center",
      status: entry.status,
      publication_authorized: entry.publication_authorized,
    });

    clearFile();
    setFormError("");
    setNotice("");
    focusEditor();
  }

  function selectImage(event) {
    const file = event.target.files?.[0];

    setFormError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      event.target.value = "";
      setImageFile(null);
      setFormError(
        "Selecciona una fotografía JPEG, PNG o WebP."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setImageFile(null);
      setFormError(
        "La fotografía no puede superar 5 MB."
      );
      return;
    }

    setImageFile(file);

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

    const sortOrder = Number(form.sort_order);

    if (
      form.sort_order === "" ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 1_000_000
    ) {
      setFormError(
        "El orden debe ser un entero entre 0 y 1000000."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      sort_order: sortOrder,
      image_alt: form.image_alt.trim(),
      image_position: form.image_position,
      status: form.status,
      publication_authorized: form.publication_authorized,
    };

    if (
      payload.title.length < 3 ||
      payload.description.length < 10 ||
      payload.category.length < 2
    ) {
      setFormError(
        "Revisa el título, la descripción interna y la categoría."
      );
      return;
    }

    if (payload.status === "published") {
      if (!imageFile && !currentImage) {
        setFormError(
          "Selecciona una fotografía antes de publicar."
        );
        return;
      }

      if (!payload.image_alt) {
        setFormError(
          "Completa el texto alternativo de la fotografía."
        );
        return;
      }

      if (!payload.publication_authorized) {
        setFormError(
          "Confirma la verificación y autorización para publicar."
        );
        return;
      }
    }

    setSaving(true);

    let id = editingId;
    let intermediateSaved = false;

    try {
      // Primero crea un borrador para obtener el ID.
      if (!id) {
        const created = await apiRequest(
          "/community-highlights/admin/entries",
          {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              status: "draft",
              publication_authorized: false,
            }),
          }
        );

        id = created.id;
        setEditingId(id);
        intermediateSaved = true;
      }

      // Subir o reemplazar una fotografía la deja en borrador.
      if (imageFile) {
        const body = new FormData();
        body.append("file", imageFile);

        const uploaded = await apiRequest(
          `/community-highlights/admin/entries/${id}/image`,
          {
            method: "POST",
            body,
          }
        );

        setCurrentImage(uploaded.image ?? "");
        clearFile();
        intermediateSaved = true;
      }

      // Confirma los datos y el estado seleccionado.
      await apiRequest(
        `/community-highlights/admin/entries/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      resetForm();

      setNotice(
        payload.status === "published"
          ? "Fotografía publicada correctamente."
          : payload.status === "archived"
          ? "Fotografía archivada correctamente."
          : "Borrador guardado correctamente."
      );

      await refreshEntries();
    } catch (error) {
      setFormError(
        intermediateSaved
          ? `${error.message} Hay cambios parciales guardados. Puedes corregir y volver a guardar sin crear otro registro.`
          : error.message
      );

      await refreshEntries();
    } finally {
      setSaving(false);
    }
  }

  const previewImage = localPreview || currentImage;

  const firstPublishedId = entries.find(
    (entry) => entry.status === "published"
  )?.id;

  return (
    <section
      className={styles.page}
      aria-labelledby="community-admin-title"
    >
      <div className={styles.container}>
        <Link to="/admin" className={styles.backLink}>
          <ArrowLeft size={18} />
          Volver al panel
        </Link>

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.headerIcon}>
              <Images size={30} />
            </span>

            <div>
              <span className={styles.eyebrow}>
                COMUNIDAD · MOMENTOS
              </span>

              <h1 id="community-admin-title">
                Fotos de la comunidad
              </h1>

              <p>
                Administra las fotografías que aparecen en el
                inicio de GENSTI.
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
            Nueva fotografía
          </button>
        </header>

        {notice && (
          <p className={styles.success} role="status">
            {notice}
          </p>
        )}

        <div className={styles.layout}>
          <section
            ref={editorRef}
            className={styles.panel}
            aria-labelledby="community-form-title"
          >
            <div className={styles.panelHeading}>
              <h2 id="community-form-title">
                {editingId
                  ? "Editar fotografía"
                  : "Nueva fotografía"}
              </h2>

              <p>
                En la página pública se mostrarán únicamente
                la fotografía y el título.
              </p>
            </div>

            <form
              className={styles.form}
              onSubmit={saveEntry}
            >
              <fieldset
                className={styles.fieldset}
                disabled={saving}
              >
                <label className={styles.field}>
                  Título visible
                  <input
                    ref={titleInputRef}
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    minLength={3}
                    maxLength={200}
                    required
                    placeholder="Un momento que merece recordarse"
                  />
                </label>

                <div className={styles.twoColumns}>
                  <label className={styles.field}>
                    Orden de aparición
                    <input
                      type="number"
                      name="sort_order"
                      value={form.sort_order}
                      onChange={updateField}
                      min={0}
                      max={1000000}
                      step={1}
                      required
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

                <p className={styles.help}>
                  La fotografía publicada con menor número será
                  la principal. Puedes usar 0, 10 y 20 para
                  facilitar cambios posteriores.
                </p>

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
                    aria-describedby="community-upload-help"
                  />
                </label>

                <p
                  id="community-upload-help"
                  className={styles.help}
                >
                  JPEG, PNG o WebP. Máximo 5 MB y 20 megapíxeles.
                  Al editar, deja este campo vacío para conservar
                  la fotografía actual.
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

                <label className={styles.field}>
                  Texto alternativo
                  <input
                    name="image_alt"
                    value={form.image_alt}
                    onChange={updateField}
                    maxLength={300}
                    required={form.status === "published"}
                    placeholder="Describe brevemente lo que se ve"
                  />
                </label>

                <p className={styles.help}>
                  Ayuda a comprender la fotografía cuando no
                  puede verse. No aparece como descripción
                  sobre la imagen.
                </p>

                <label className={styles.field}>
                  Categoría interna
                  <input
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    minLength={2}
                    maxLength={80}
                    required
                    placeholder="Viajes, talleres, encuentros..."
                  />
                </label>

                <label className={styles.field}>
                  Descripción interna
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    minLength={10}
                    maxLength={20000}
                    rows={4}
                    required
                    placeholder="Contexto de la fotografía para su administración."
                  />
                </label>

                <p className={styles.help}>
                  La categoría y descripción se guardan para
                  administrar el contenido. No se muestran en
                  la galería del inicio.
                </p>

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
                    cuento con la autorización correspondiente
                    para publicar esta fotografía.
                  </span>
                </label>

                <p className={styles.help}>
                  Solo las fotografías publicadas aparecen en el
                  inicio. Al pulsarlas, los visitantes irán a TBOG.
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
                    : "Guardar fotografía"}
                </button>
              </div>

              <span className={styles.help} role="status">
                {saving
                  ? "Guardando fotografía y datos. Espera a que termine."
                  : ""}
              </span>
            </form>
          </section>

          <aside
            className={styles.preview}
            aria-labelledby="community-preview-title"
          >
            <span className={styles.eyebrow}>
              VISTA PREVIA
            </span>

            <h2 id="community-preview-title">
              Fotografía y título
            </h2>

            <article className={styles.previewCard}>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={
                    form.image_alt ||
                    "Vista previa de la fotografía seleccionada"
                  }
                  className={styles.previewImage}
                  style={{
                    objectPosition: form.image_position,
                  }}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <ImagePlus size={36} />
                  <span>Selecciona una fotografía</span>
                </div>
              )}

              <div className={styles.previewBody}>
                <h3>
                  {form.title ||
                    "Un momento de nuestra comunidad"}
                </h3>
              </div>
            </article>

            <p className={styles.help}>
              Esta vista permite comprobar la foto y el título.
              En el inicio se utilizará el diseño de la galería,
              con el título sobre la imagen.
            </p>

            <p className={styles.help}>
              Destino de las fotografías: TBOG, en /botg.
            </p>
          </aside>
        </div>

        <section
          className={styles.panel}
          aria-labelledby="community-list-title"
        >
          <div className={styles.listHeading}>
            <div>
              <h2 id="community-list-title">
                Fotografías registradas
              </h2>

              <p>
                {loading
                  ? "Consultando fotografías..."
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
              Cargando fotografías...
            </p>
          ) : entries.length === 0 ? (
            <p className={styles.empty}>
              Todavía no hay fotografías. Crea la primera
              publicación para la comunidad.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  Fotografías de la comunidad ordenadas por
                  posición de aparición
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Fotografía</th>
                    <th scope="col">Orden</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div className={styles.entrySummary}>
                          {entry.image && (
                            <img
                              src={entry.image}
                              alt=""
                              loading="lazy"
                              className={styles.thumbnail}
                            />
                          )}

                          <div>
                            <span className={styles.entryTitle}>
                              {entry.title}
                            </span>

                            {entry.id === firstPublishedId && (
                              <small>
                                Principal en el inicio
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{entry.sort_order}</td>

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

export default CommunityHighlightsAdminPage;