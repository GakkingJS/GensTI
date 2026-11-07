import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import styles from "../styles/PqrsPage.module.css";


const STATUS_LABELS = {
  open: "Abierta",
  in_progress: "En proceso",
  resolved: "Resuelta",
  closed: "Cerrada",
};


const EMPTY_FORM = {
  subject: "",
  description: "",
};


function PqrsPage() {
  const { user } = useAuth();

  const [pqrsList, setPqrsList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const loadPqrs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/pqrs/mine", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar tus PQRS.");
      }

      const data = await response.json();
      setPqrsList(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    loadPqrs();
  }, [loadPqrs]);


  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("/pqrs", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ?? "No se pudo enviar la PQRS.",
        );
      }

      setMessage("Tu PQRS fue enviada correctamente.");
      setForm(EMPTY_FORM);

      await loadPqrs();
    } catch (submitError) {
      setError(submitError.message);
    }
  }


  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.sectionLabel}>PQRS</span>

        <h1>Peticiones, quejas, reclamos y sugerencias</h1>

        <p>
          Hola, {user?.email}. Envía una solicitud y sigue su estado desde
          esta página.
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Nueva PQRS</h2>

        <label className={styles.field}>
          Asunto

          <input
            name="subject"
            value={form.subject}
            onChange={handleInputChange}
            required
            minLength={5}
            maxLength={200}
          />
        </label>

        <label className={styles.field}>
          Descripción

          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={5}
            required
            minLength={20}
          />
        </label>

        <button type="submit" disabled={isLoading}>
          Enviar PQRS
        </button>
      </form>

      <h2>Mis PQRS</h2>

      {pqrsList.length === 0 ? (
        <p className={styles.emptyState}>
          Todavía no has enviado ninguna PQRS.
        </p>
      ) : (
        <ul className={styles.pqrsList}>
          {pqrsList.map((pqrs) => (
            <li key={pqrs.id} className={styles.pqrsCard}>
              <div className={styles.pqrsHeading}>
                <h3>{pqrs.subject}</h3>

                <span
                  className={`${styles.status} ${
                    styles[`status_${pqrs.status}`] ?? ""
                  }`}
                >
                  {STATUS_LABELS[pqrs.status] ?? pqrs.status}
                </span>
              </div>

              <p>{pqrs.description}</p>

              {pqrs.admin_response && (
                <div className={styles.response}>
                  <strong>Respuesta del equipo gensTI</strong>

                  <p>{pqrs.admin_response}</p>
                </div>
              )}

              <small>
                Enviada el{" "}
                {new Date(pqrs.created_at).toLocaleString("es-CO")}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


export default PqrsPage;