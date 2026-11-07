import { useMemo, useState } from "react";
import { campusInfo, departments } from "../data/directorio";
import styles from "../styles/DirectoryPage.module.css";

const filters = [
  "Todas",
  "Académico",
  "Atención y servicios",
  "Dirección y administración",
  "Biblioteca y aprendizaje",
  "Bienestar universitario",
  "Tecnología",
];

function Contact({ contact }) {
  return (
    <div className="directory-contact">
      <div className="directory-avatar" aria-hidden="true">
        {contact.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()}
      </div>

      <div className="directory-contact-info">
        <strong>{contact.name}</strong>
        <span>{contact.role}</span>

        <div className="directory-contact-actions">
          {contact.email && (
            <a href={`mailto:${contact.email}`} title="Enviar correo">
              <span aria-hidden="true">✉</span> {contact.email}
            </a>
          )}

          {contact.extension && (
            <span>
              <span aria-hidden="true">☎</span> Ext. {contact.extension}
            </span>
          )}
        </div>
      </div>

      {contact.email && (
        <button
          type="button"
          className="directory-copy"
          title="Copiar correo"
          aria-label={`Copiar correo de ${contact.name}`}
          onClick={() => {
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(contact.email);
            }
          }}
        >
          Copiar correo
        </button>
      )}
    </div>
  );
}

function Hours({ hours }) {
  if (!hours?.length) return null;

  return (
    <div className="directory-hours">
      <h4>
        <span aria-hidden="true">◷</span> Horario de atención
      </h4>

      {hours.map((item) => (
        <div className="directory-hours-row" key={item.days}>
          <strong>{item.days}</strong>

          <span>
            {item.fullDay
              ? item.fullDay
              : `${item.morning}${
                  item.afternoon ? ` · ${item.afternoon}` : ""
                }`}
          </span>
        </div>
      ))}
    </div>
  );
}

function DepartmentCard({ department }) {
  const [expanded, setExpanded] = useState(false);
  const contacts = department.contacts ?? [];
  const locations = department.locations ?? [];

  return (
    <article className="directory-department">
      <button
        className="directory-department-heading"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="directory-department-icon" aria-hidden="true">
          {department.category === "Tecnología"
            ? "⌘"
            : department.category === "Académico"
              ? "▤"
              : department.category === "Bienestar universitario"
                ? "♡"
                : department.category === "Biblioteca y aprendizaje"
                  ? "▥"
                  : "◈"}
        </span>

        <span className="directory-department-title">
          <strong>{department.name}</strong>

          {department.fullName && <small>{department.fullName}</small>}

          <small>
            {contacts.length}{" "}
            {contacts.length === 1 ? "contacto" : "contactos"}
            {department.location ? ` · ${department.location}` : ""}
          </small>
        </span>

        <span className={`directory-chevron ${expanded ? "is-open" : ""}`}>
          ↓
        </span>
      </button>

      {expanded && (
        <div className="directory-department-body">
          {department.email && (
            <p className="directory-general-email">
              Correo de atención:{" "}
              <a href={`mailto:${department.email}`}>{department.email}</a>
            </p>
          )}

          {department.address && (
            <p className="directory-location">
              <span aria-hidden="true">⌖</span>
              {department.location} · {department.address}
            </p>
          )}

          {locations.map((location) => (
            <div
              className="directory-library-location"
              key={location.name}
            >
              <h4>{location.name}</h4>
              <p>{location.address}</p>

              <Hours hours={location.hours} />
            </div>
          ))}

          <Hours hours={department.hours} />

          {contacts.map((contact) => (
            <Contact
              key={contact.email ?? contact.name}
              contact={contact}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function DirectorioPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");

  const unclassifiedContacts = useMemo(() => {
    return departments
      .filter((department) => !department.category)
      .flatMap((department) => department.contacts ?? []);
  }, []);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");

    return departments.filter((department) => {
      const matchesFilter =
        activeFilter === "Todas" ||
        department.category === activeFilter;

      const searchable = [
        department.name,
        department.fullName,
        department.category,
        department.email,
        department.location,
        department.address,
        ...(department.contacts ?? []).flatMap((contact) => [
          contact.name,
          contact.role,
          contact.email,
          contact.extension,
        ]),
        ...(department.locations ?? []).flatMap((location) => [
          location.name,
          location.address,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [search, activeFilter]);

  const visibleUnclassified = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");

    return unclassifiedContacts.filter((contact) => {
      const searchable = [
        contact.name,
        contact.role,
        contact.email,
        contact.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      return (
        activeFilter === "Todas" &&
        (!query || searchable.includes(query))
      );
    });
  }, [unclassifiedContacts, search, activeFilter]);

  const totalContacts = departments.reduce(
    (total, department) =>
      total + (department.contacts?.length ?? 0),
    0
  );

  return (
    <main className="directory-page">
      <section className="directory-hero">
        <div className="directory-hero-content">
          <span className="directory-eyebrow">
            gensTI / UNIVERSIDAD COOPERATIVA DE COLOMBIA
          </span>

          <h1>
            Las personas correctas.
            <br />
            <span>La información que necesitas.</span>
          </h1>

          <p>
            Encuentra dependencias, profesores y contactos del campus
            Ibagué. Todo organizado para que sepas a quién acudir.
          </p>

          <a
            className="directory-hero-link"
            href="#directory-content"
          >
            Explorar directorio{" "}
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div
          className="directory-hero-decoration"
          aria-hidden="true"
        >
          <span className="directory-orbit orbit-one" />
          <span className="directory-orbit orbit-two" />
          <span className="directory-orbit orbit-three" />
          <span className="directory-orbit-center">G</span>

          <span className="directory-decoration-label">
            CONECTA · CONSULTA · AVANZA
          </span>
        </div>
      </section>

      <section className="directory-campus">
        <div className="directory-campus-intro">
          <span
            className="directory-campus-pin"
            aria-hidden="true"
          >
            ⌖
          </span>

          <div>
            <span className="directory-campus-label">
              SEDE UNIVERSITARIA
            </span>

            <h2>{campusInfo.name}</h2>
            <p>{campusInfo.address}</p>
          </div>
        </div>

        <div className="directory-campus-details">
          <a
            href={`tel:${campusInfo.phone.replace(/\s/g, "")}`}
          >
            <span aria-hidden="true">☎</span>

            <span>
              <small>PBX</small>
              <strong>{campusInfo.phone}</strong>
            </span>
          </a>

          {campusInfo.whatsapp.map((number) => (
            <a
              href={`https://wa.me/57${number}`}
              target="_blank"
              rel="noreferrer"
              key={number}
            >
              <span aria-hidden="true">◉</span>

              <span>
                <small>WhatsApp</small>
                <strong>{number}</strong>
              </span>
            </a>
          ))}
        </div>

        <Hours hours={campusInfo.hours} />
      </section>

      <section
        className="directory-content"
        id="directory-content"
      >
        <div className="directory-section-heading">
          <div>
            <span className="directory-kicker">
              DIRECTORIO INSTITUCIONAL
            </span>

            <h2>¿A quién necesitas encontrar?</h2>

            <p>
              Busca por nombre, cargo, correo, extensión o
              dependencia.
            </p>
          </div>

          <div className="directory-stat">
            <strong>{departments.length}</strong>
            <span>dependencias</span>

            <strong>{totalContacts}</strong>
            <span>contactos registrados</span>
          </div>
        </div>

        <label className="directory-search">
          <span
            className="directory-search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Ej. Dennis Martínez, Biblioteca, 8050..."
            aria-label="Buscar en el directorio"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
            >
              Limpiar
            </button>
          )}
        </label>

        <div
          className="directory-filters"
          aria-label="Filtrar por categoría"
        >
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={
                activeFilter === filter ? "active" : ""
              }
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="directory-results-heading">
          <h3>Dependencias y contactos</h3>
          <span>{filteredDepartments.length} resultados</span>
        </div>

        <div className="directory-departments">
          {filteredDepartments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
            />
          ))}
        </div>

        {visibleUnclassified.length > 0 && (
          <section className="directory-pending">
            <h3>Contactos pendientes de clasificación</h3>

            <p>
              La información recibida no identifica con certeza
              la dependencia de estas personas.
            </p>

            {visibleUnclassified.map((contact) => (
              <Contact
                key={contact.email ?? contact.name}
                contact={contact}
              />
            ))}
          </section>
        )}

        {filteredDepartments.length === 0 &&
          visibleUnclassified.length === 0 && (
            <div
              className="directory-empty"
              role="status"
            >
              <span aria-hidden="true">⌕</span>

              <h3>No encontramos resultados</h3>

              <p>
                Prueba con otro nombre, correo, extensión o
                categoría.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("Todas");
                }}
              >
                Mostrar todo el directorio
              </button>
            </div>
          )}
      </section>
    </main>
  );
}

export default DirectorioPage;