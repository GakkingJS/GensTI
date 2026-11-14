import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import styles from "../styles/AdminUsuariosPage.module.css";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `No se pudo completar la solicitud (${response.status}).`
    );
  }

  return data;
}

function AdminUsuariosPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editing, setEditing] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          page_size: String(pageSize),
        });

        const [usersData, rolesData] = await Promise.all([
          request(`/auth/admin/users?${params}`, {
            signal: controller.signal,
          }),
          request("/auth/admin/roles", {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        setUsers(usersData.items);
        setTotal(usersData.total);
        setRoles(rolesData);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [query, page]);

  function handleSearch(event) {
    event.preventDefault();
    setNotice("");
    setPage(1);
    setQuery(search.trim());
  }

  function openEditor(user) {
    setEditing(user);
    setSelectedRoles(user.roles.map((role) => role.id));
    setEditError("");
    setNotice("");
  }

  function toggleRole(roleId) {
    setSelectedRoles((previous) =>
      previous.includes(roleId)
        ? previous.filter((id) => id !== roleId)
        : [...previous, roleId]
    );
  }

  async function saveRoles(event) {
    event.preventDefault();

    if (!editing || saving) return;

    setSaving(true);
    setEditError("");

    try {
      const result = await request(
        `/auth/admin/users/${editing.id}/roles`,
        {
          method: "PUT",
          body: JSON.stringify({
            role_ids: selectedRoles,
          }),
        }
      );

      setUsers((previous) =>
        previous.map((user) =>
          user.id === result.id
            ? { ...user, roles: result.roles }
            : user
        )
      );

      setNotice(`Roles actualizados para ${editing.email}.`);
      setEditing(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={styles.page}
      aria-labelledby="usuarios-title"
    >
      <div className={styles.container}>
        <Link to="/admin" className={styles.backLink}>
          <ArrowLeft size={18} />
          Volver al panel
        </Link>

        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <UsersRound size={30} />
          </div>

          <div>
            <span className={styles.eyebrow}>
              ADMINISTRACIÓN · SEGURIDAD
            </span>
            <h1 id="usuarios-title">Usuarios y roles</h1>
            <p>Gestiona los roles de las cuentas de GENSTI.</p>
          </div>

          <span className={styles.permissionBadge}>
            <ShieldCheck size={16} />
            users.manage
          </span>
        </header>

        {notice && (
          <p className={styles.success} role="status">
            {notice}
          </p>
        )}

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Usuarios registrados</h2>
              <p>
                {loading
                  ? "Consultando cuentas..."
                  : `${total} cuentas encontradas`}
              </p>
            </div>
          </div>

          <form
            className={styles.searchForm}
            onSubmit={handleSearch}
            role="search"
          >
            <label
              className={styles.searchField}
              htmlFor="user-search"
            >
              <Search size={19} aria-hidden="true" />
              <input
                id="user-search"
                type="search"
                aria-label="Buscar usuarios por correo"
                placeholder="Buscar por correo institucional..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              Buscar
            </button>
          </form>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : loading ? (
            <p className={styles.emptyState} role="status">
              Cargando usuarios...
            </p>
          ) : users.length === 0 ? (
            <p className={styles.emptyState}>
              No se encontraron usuarios.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  Usuarios registrados y sus roles
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Cuenta</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Roles</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const isCurrentUser =
                      user.id === currentUser?.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          <span className={styles.email}>
                            {user.email}
                          </span>
                          {isCurrentUser && (
                            <small className={styles.selfLabel}>
                              Tu cuenta
                            </small>
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              user.is_active
                                ? styles.activeBadge
                                : styles.neutralBadge
                            }
                          >
                            {user.is_active
                              ? "Activa"
                              : "Inactiva"}
                          </span>
                        </td>

                        <td>
                          {user.email_verified
                            ? "Verificado"
                            : "Pendiente"}
                        </td>

                        <td>
                          <div className={styles.roleList}>
                            {user.roles.length ? (
                              user.roles.map((role) => (
                                <span
                                  key={role.id}
                                  className={styles.roleBadge}
                                >
                                  {role.name}
                                </span>
                              ))
                            ) : (
                              <span>Sin roles</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            disabled={isCurrentUser}
                            onClick={() => openEditor(user)}
                            aria-label={`Editar roles de ${user.email}`}
                            title={
                              isCurrentUser
                                ? "No puedes editar tus propios roles."
                                : "Editar roles"
                            }
                          >
                            Editar roles
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.pagination}>
            <span>
              Página {page} de {totalPages}
            </span>

            <div className={styles.paginationButtons}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                disabled={loading || page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {editing && (
          <section
            className={styles.editor}
            aria-labelledby="roles-editor-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id="roles-editor-title">Editar roles</h2>
                <p className={styles.email}>{editing.email}</p>
              </div>

              <button
                type="button"
                className={styles.secondaryButton}
                disabled={saving}
                onClick={() => setEditing(null)}
                aria-label="Cerrar editor de roles"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={saveRoles}
              className={styles.editorForm}
            >
              <fieldset
                className={styles.rolesFieldset}
                disabled={saving}
              >
                <legend>Selecciona los roles asignados</legend>

                {roles.length === 0 ? (
                  <p>No hay roles configurados.</p>
                ) : (
                  <div className={styles.roleOptions}>
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className={styles.roleOption}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                        />
                        <span>{role.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <p className={styles.helpText}>
                Guardar reemplaza todos los roles actuales por
                los seleccionados. Los permisos individuales
                no se modifican.
              </p>

              {selectedRoles.length === 0 && (
                <p className={styles.warning}>
                  El usuario quedará sin roles asignados.
                </p>
              )}

              {editError && (
                <p className={styles.error} role="alert">
                  {editError}
                </p>
              )}

              <div className={styles.editorActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving || roles.length === 0}
                >
                  {saving ? "Guardando..." : "Guardar roles"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </section>
  );
}

export default AdminUsuariosPage;