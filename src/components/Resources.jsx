import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Resources() {
  const { user, loading, hasRole } = useAuth();

  const isStudent = hasRole("student");

  if (loading) {
    return (
      <section className="section resources" id="recursos">
        <div className="section-header">
          <div>
            <span className="section-label">CENTRO DE RECURSOS</span>
            <h2>Todo en un solo lugar</h2>
          </div>
        </div>

        <p className="section-loading">Cargando recursos...</p>
      </section>
    );
  }

  if (!user || !isStudent) {
    return null;
  }

  return (
    <section className="section resources" id="recursos">
      <div className="section-header">
        <div>
          <span className="section-label">CENTRO DE RECURSOS</span>
          <h2>Todo en un solo lugar</h2>
        </div>
      </div>

      <div className="resources-grid">
        <div className="resource">
          <span className="resource-number">01</span>
          <h3>Información académica</h3>
          <p>
            Materias, códigos, procesos de matrícula e
            información importante de la carrera.
          </p>
          <Link to="/academico">Explorar →</Link>
        </div>

        <div className="resource">
          <span className="resource-number">02</span>
          <h3>Documentos</h3>
          <p>
            Accede fácilmente a documentos y recursos
            compartidos por la comunidad.
          </p>
          <Link to="/recursos">Explorar →</Link>
        </div>

        <div className="resource">
          <span className="resource-number">03</span>
          <h3>Calendario</h3>
          <p>
            Consulta reuniones, conferencias, talleres
            y otros eventos de GENSTI.
          </p>
          <Link to="/eventos">Explorar →</Link>
        </div>
      </div>
    </section>
  );
}

export default Resources;