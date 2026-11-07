import { useCallback, useEffect, useState } from "react";

import styles from "../styles/PqrsAdminPage.module.css";


const STATUS_LABELS = {
  open: "Abierta",
  in_progress: "En proceso",
  resolved: "Resuelta",
  closed: "Cerrada",
};


const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "open", label: "Abiertas" },
  { value: "in_progress", label: "En proceso" },
  { value: "resolved", label: "Resueltas" },
  { value: "closed", label: "Cerradas" },
];


function PqrsAdminPage() {
  const [pqrsList, setPqrsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedPqrsId, setSelectedPqrsId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [nextStatus, setNextStatus] = useState("in_progress");


  const loadPqrs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const query = statusFilter
        ? `?status=${statusFilter}`
        : "";

      const response = await fetch(`/pqrs/admin${query}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar las PQRS.");
      }

      const data = await response.json();
      setPqrsList(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);


  useEffect(() => {
    loadPqrs();
  }, [loadPqrs]);


  function selectPqrs(pqrs) {
    setSelectedPqrsId(pqrs.id);
    setResponseText(pqrs.admin_response ?? "");
    setNextStatus(
      pqrs.status === "open" ? "in_progress" : pqrs.status,
    );
    setMessage("");
    setError("");
  }


  function cancelSelection() {
    setSelectedPqrsId(null);
    setResponseText("");
    setNextStatus("in_progress");
  }


  async function handleRespond(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedPqrsId) return;

    try {
      const response = await fetch(
        `/pqrs/${selectedPqrsId}/respond`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_response: responseText,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ?? "No se pudo responder la PQRS.",
        );
      }

      setMessage("Respuesta guardada correctamente.");
      await loadPqrs();
    } catch (respondError) {
      setError(respondError.message);
    }
  }


  async function handleStatusChange(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedPqrsId) return;

    try {
      const response = await fetch(
        `/pqrs/${selectedPqrsId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ?? "No se pudo actualizar el estado.",
        );
      }

      setMessage("Estado actualizado correctamente.");
      await loadPqrs();
    } catch (statusError) {
      setError(statusError.message);
    }
  }


  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.sectionLabel}>ADMINISTRACIÓN</span>

        <h1>Gestión de PQRS</h1>

        <p>
          Revisa las solicitudes de los estudiantes, responde y actualiza su
          estado.
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <div className={styles.filters}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`${styles.filterButton} ${
              statusFilter === filter.value ? styles.isActive : ""
            }`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {pqrsList.length === 0 ? (
        <p className={styles.emptyState}>
          No hay PQRS para mostrar con este filtro.
        </p>
      ) : (
        <div className={styles.layout}>
          <ul className={styles.pqrsList}>
            {pqrsList.map((pqrs) => (
              <li key={pqrs.id}>
                <button
                  type="button"
                  className={`${styles.pqrsCard} ${
                    selectedPqrsId === pqrs.id ? styles.isSelected : ""
                  }`}
                  onClick={() => selectPqrs(pqrs)}
                >
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

                  <small>
                    {new Date(pqrs.created_at).toLocaleString("es-CO")}
                  </small>
                </button>
              </li>
            ))}
          </ul>

          {selectedPqrsId && (
            <aside className={styles.detailPanel}>
              <h2>Gestionar PQRS</h2>

              <form onSubmit={handleRespond} className={styles.form}>
                <label className={styles.field}>
                  Respuesta para el estudiante

                  <textarea
                    value={responseText}
                    onChange={(event) =>
                      setResponseText(event.target.value)
                    }
                    rows={6}
                    required
                    minLength={5}
                  />
                </label>

                <button type="submit" disabled={isLoading}>
                  Guardar respuesta
                </button>
              </form>

              <form onSubmit={handleStatusChange} className={styles.form}>
                <label className={styles.field}>
                  Cambiar estado

                  <select
                    value={nextStatus}
                    onChange={(event) =>
                      setNextStatus(event.target.value)
                    }
                  >
                    <option value="open">Abierta</option>
                    <option value="in_progress">En proceso</option>
                    <option value="resolved">Resuelta</option>
                    <option value="closed">Cerrada</option>
                  </select>
                </label>

                <button type="submit" disabled={isLoading}>
                  Actualizar estado
                </button>
              </form>

              <button
                type="button"
                className={styles.cancelButton}
                onClick={cancelSelection}
              >
                Cerrar panel
              </button>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}


export default PqrsAdminPage;