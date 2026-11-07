import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import styles from "../styles/NewsPage.module.css";

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

function NewsFormPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const isEditing = Boolean(newsId);
  const canEditNews = hasPermission("news.edit");

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setForm(emptyForm);
      return;
    }

    let cancelled = false;

    async function loadNews() {
      try {
        const response = await fetch(`/news/${newsId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

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
          setError("No fue posible cargar la noticia.");
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

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    if (!form.excerpt.trim()) {
      setError("El resumen es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        isEditing ? `/news/${newsId}` : "/news",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      navigate("/noticias", { replace: true });
    } catch (submitError) {
      setError(
        isEditing
          ? "No fue posible actualizar la noticia."
          : "No fue posible crear la noticia."
      );
    } finally {
      setSaving(false);
    }
  }

  if (isEditing && !canEditNews) {
    return (
      <section className="admin-form-page">
        <p className="news-empty-state">
          No tienes permiso para editar noticias.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="admin-form-page">
        <p className="news-empty-state">Cargando noticia...</p>
      </section>
    );
  }

  return (
    <section className="admin-form-page">
      <header className="admin-form-header">
        <span className="section-label">
          {isEditing ? "EDITAR NOTICIA" : "NUEVA NOTICIA"}
        </span>

        <h1>
          {isEditing
            ? "Editar publicación"
            : "Publicar una noticia"}
        </h1>

        <Link to="/noticias" className="admin-form-back">
          ← Volver a noticias
        </Link>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="title">Título</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="excerpt">Resumen</label>
          <input
            id="excerpt"
            name="excerpt"
            type="text"
            value={form.excerpt}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="content">Contenido</label>
          <textarea
            id="content"
            name="content"
            rows={8}
            value={form.content}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="Anuncios">Anuncios</option>
              <option value="Eventos">Eventos</option>
              <option value="Académico">Académico</option>
              <option value="Comunidad">Comunidad</option>
              <option value="Tecnología">Tecnología</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="author_name">Autor</label>
            <input
              id="author_name"
              name="author_name"
              type="text"
              value={form.author_name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="status">Estado</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="published">Publicada</option>
            <option value="draft">Borrador</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="image_url">URL de imagen</label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={form.image_url}
            onChange={handleChange}
          />
        </div>

        <label className="form-checkbox">
          <input
            type="checkbox"
            name="is_featured"
            checked={form.is_featured}
            onChange={handleChange}
          />

          <span>Marcar como noticia destacada</span>
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Publicar noticia"}
          </button>

          <Link to="/noticias" className="secondary-btn">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}

export default NewsFormPage;