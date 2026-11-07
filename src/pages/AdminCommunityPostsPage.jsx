import { useEffect, useState } from "react";

import ScrollReveal from "../components/ScrollReveal";
import styles from "../styles/AdminCommunityPostsPage.module.css";


const STATUS_LABELS = {
  pending: "Pendiente",
  published: "Publicada",
  rejected: "Rechazada",
};


function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState(null);


  async function loadPosts() {
    try {
      const query = statusFilter
        ? `?status_filter=${statusFilter}`
        : "";


      const response = await fetch(`/community-posts/${query}`, {
        credentials: "include",
      });


      if (!response.ok) {
        throw new Error("No se pudieron cargar las publicaciones.");
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
  }, [statusFilter]);


  async function reviewPost(postId, newStatus) {
    setError("");


    try {
      const response = await fetch(`/community-posts/${postId}/review`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          admin_note: notes[postId] || null,
        }),
      });


      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "No se pudo revisar la publicación.");
      }


      await loadPosts();
    } catch (reviewError) {
      setError(reviewError.message);
    }
  }


  async function deletePost(postId) {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta publicación?"
    );


    if (!confirmed) return;


    setError("");
    setDeletingId(postId);


    try {
      const response = await fetch(`/community-posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });


      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.detail || "No se pudo eliminar la publicación.");
      }


      await loadPosts();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  }


  return (
    <main className={styles.page}>
      <ScrollReveal className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Moderación</p>


          <h1 className={styles.title}>
            Publicaciones de la comunidad
          </h1>


          <p className={styles.description}>
            Revisa las publicaciones enviadas por los estudiantes antes de
            que aparezcan públicamente.
          </p>
        </div>


        <select
          className={styles.filter}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="published">Publicadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </ScrollReveal>


      {error && (
        <p className={styles.errorMessage}>
          {error}
        </p>
      )}


      {isLoading ? (
        <p>Cargando publicaciones...</p>
      ) : posts.length === 0 ? (
        <div className={styles.emptyState}>
          No hay publicaciones para mostrar.
        </div>
      ) : (
        <div className={styles.list}>
          {posts.map((post) => (
            <ScrollReveal key={post.id}>
              <article className={styles.card}>
                <div className={styles.cardHeader}>
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


                {post.status === "pending" && (
                  <div className={styles.reviewActions}>
                    <textarea
                      className={styles.noteTextarea}
                      placeholder="Nota opcional para el estudiante"
                      value={notes[post.id] || ""}
                      onChange={(event) =>
                        setNotes({
                          ...notes,
                          [post.id]: event.target.value,
                        })
                      }
                      rows={3}
                    />


                    <div className={styles.reviewButtons}>
                      <button
                        className={styles.approveButton}
                        onClick={() => reviewPost(post.id, "published")}
                      >
                        Publicar
                      </button>


                      <button
                        className={styles.rejectButton}
                        onClick={() => reviewPost(post.id, "rejected")}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}


                <button
                  className={styles.deleteButton}
                  disabled={deletingId === post.id}
                  onClick={() => deletePost(post.id)}
                >
                  {deletingId === post.id
                    ? "Eliminando..."
                    : "Eliminar"}
                </button>
              </article>
            </ScrollReveal>
          ))}
        </div>
      )}
    </main>
  );
}


export default AdminCommunityPostsPage;