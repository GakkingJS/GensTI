import { useEffect, useState } from "react";

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


const STATUS_LABELS = {
  pending: "Pendiente",
  published: "Publicada",
  rejected: "Rechazada",
};


function CommunityPostsPage() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  async function loadPosts() {
    try {
      const response = await fetch("/community-posts/mine", {
        credentials: "include",
      });


      if (!response.ok) {
        throw new Error("No se pudieron cargar tus publicaciones.");
      }


      setPosts(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    loadPosts();
  }, []);


  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);


    try {
      const response = await fetch("/community-posts/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      });


      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "No se pudo crear la publicación.");
      }


      setMessage("Publicación enviada. Quedará pendiente de revisión.");
      setTitle("");
      setContent("");
      setCategory("General");


      await loadPosts();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className={styles.page}>
      <ScrollReveal className={styles.intro}>
        <p className={styles.eyebrow}>Comunidad GENSTI</p>


        <h1 className={styles.title}>
          Comparte con la comunidad
        </h1>


        <p className={styles.description}>
          Publica convocatorias, logros, actividades, oportunidades o
          información útil para los estudiantes de Ingeniería de Sistemas.
          Tu publicación será revisada antes de aparecer públicamente.
        </p>
      </ScrollReveal>


      <ScrollReveal className={styles.formSection}>
        <h2 className={styles.formTitle}>
          Crear publicación
        </h2>


        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Título


            <input
              className={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Convocatoria de monitorías"
              required
              minLength={5}
              maxLength={180}
            />
          </label>


          <label className={styles.field}>
            Categoría


            <select
              className={styles.select}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>


          <label className={styles.field}>
            Contenido


            <textarea
              className={styles.textarea}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escribe tu publicación para la comunidad..."
              required
              minLength={20}
              rows={6}
            />
          </label>


          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar publicación"}
          </button>
        </form>


        {message && (
          <p className={styles.successMessage}>
            {message}
          </p>
        )}


        {error && (
          <p className={styles.errorMessage}>
            {error}
          </p>
        )}
      </ScrollReveal>


      <ScrollReveal className={styles.myPosts}>
        <h2 className={styles.sectionTitle}>
          Mis publicaciones
        </h2>


        {isLoading ? (
          <p>Cargando publicaciones...</p>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            Todavía no has creado publicaciones.
          </div>
        ) : (
          <div className={styles.postsList}>
            {posts.map((post) => (
              <article
                key={post.id}
                className={styles.postCard}
              >
                <div className={styles.postHeader}>
                  <span className={styles.category}>
                    {post.category}
                  </span>


                  <span
                    className={`${styles.statusBadge} ${styles[post.status]}`}
                  >
                    {STATUS_LABELS[post.status] || post.status}
                  </span>
                </div>


                <h3 className={styles.postTitle}>
                  {post.title}
                </h3>


                <p className={styles.postContent}>
                  {post.content}
                </p>


                {post.status === "rejected" && post.admin_note && (
                  <div className={styles.adminNote}>
                    <strong>Motivo del rechazo</strong>


                    <p>{post.admin_note}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </ScrollReveal>
    </main>
  );
}


export default CommunityPostsPage;