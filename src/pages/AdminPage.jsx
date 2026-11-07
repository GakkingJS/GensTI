
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Newspaper,
  CalendarDays,
  CalendarCheck,
  MessageSquareText,
  ClipboardList,
  UsersRound,
  LayoutGrid,
  Sparkles,
  ShieldCheck,
  Waves,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import styles from "../styles/AdminPage.module.css";

const actions = [
  {
    to: "/admin/noticias/crear",
    title: "Noticias",
    description: "Publica novedades y mantén informada a la comunidad.",
    permission: "news.create",
    icon: Newspaper,
    category: "CONTENIDO",
    number: "01",
    color: "cyan",
  },
  {
    to: "/admin/eventos",
    title: "Eventos",
    description: "Organiza actividades, encuentros y eventos institucionales.",
    permission: "events.create",
    icon: CalendarDays,
    category: "COMUNIDAD",
    number: "02",
    color: "aqua",
  },
  {
    to: "/admin/calendario",
    title: "Calendario académico",
    description: "Gestiona matrículas, pagos e inscripciones.",
    permission: "calendar.manage",
    icon: CalendarCheck,
    category: "ACADÉMICO",
    number: "03",
    color: "blue",
  },
  {
    to: "/admin/publicaciones",
    title: "Publicaciones",
    description: "Cuida la calidad de lo que comparte la comunidad.",
    permission: "posts.moderate",
    icon: MessageSquareText,
    category: "COMUNIDAD",
    number: "04",
    color: "mint",
  },
  {
    to: "/admin/pqrs",
    title: "PQRS",
    description: "Consulta y gestiona solicitudes de los usuarios.",
    permission: "pqr.manage",
    icon: ClipboardList,
    category: "GESTIÓN",
    number: "05",
    color: "sky",
  },
  {
    to: "/admin/usuarios",
    title: "Usuarios y roles",
    description: "Administra las cuentas y sus permisos de acceso.",
    permission: "users.manage",
    icon: UsersRound,
    category: "SEGURIDAD",
    number: "06",
    color: "violet",
  },
];

function AdminPage() {
  const { user, hasPermission } = useAuth();

  const availableActions = actions.filter((action) =>
    hasPermission(action.permission)
  );

  return (
    <main className={styles.adminPage}>
      <div className={styles.ambientLight} aria-hidden="true" />
      <div className={styles.gridTexture} aria-hidden="true" />

      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <span className={styles.statusDot} />
            ESPACIO DE ADMINISTRACIÓN
          </div>

          <h1 className={styles.heroTitle}>
            Todo bajo
            <br />
            <span>control.</span>
          </h1>

          <p className={styles.heroDescription}>
            Gestiona GENSTI, conecta con la comunidad y mantén
            la vida académica en movimiento.
          </p>

          <div className={styles.sessionBadge}>
            <span className={styles.sessionIcon}>
              <ShieldCheck size={17} />
            </span>

            <span className={styles.sessionText}>
              <small>SESIÓN ACTIVA</small>
              <strong>{user?.email ?? "Usuario autenticado"}</strong>
            </span>

            <span className={styles.onlineDot} />
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
         <div className={`${styles.orbit} ${styles.orbitOne}`} />
          <div className={`${styles.orbit} ${styles.orbitTwo}`} />
          <div className={`${styles.orbit} ${styles.orbitThree}`} />
          <div className={styles.visualCore}>
            <Waves size={54} strokeWidth={1.25} />
          </div>

          <div className={`${styles.floatIcon} ${styles.floatIconOne}`}>
            <LayoutGrid size={23} />
          </div>

          <div className={`${styles.floatIcon} ${styles.floatIconTwo}`}>
            <Sparkles size={21} />
          </div>

          <div className={styles.visualCaption}>
            <span>GENSTI</span>
            <small>Conectando ideas</small>
          </div>
        </div>
      </header>

      <section className={styles.modulesSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.headingLeft}>
            <div className={styles.headingIcon}>
              <LayoutGrid size={21} />
            </div>

            <div>
              <span className={styles.sectionKicker}>TU ESPACIO DE TRABAJO</span>
              <h2>Accesos de gestión</h2>
              <p>Elige un módulo para comenzar.</p>
            </div>
          </div>

          <div className={styles.moduleCount}>
            <span />
            {availableActions.length}{" "}
            {availableActions.length === 1 ? "módulo" : "módulos"} disponibles
          </div>
        </div>

        {availableActions.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldCheck size={32} />
            <h2>Acceso restringido</h2>
            <p>
              Tu cuenta no tiene permisos administrativos disponibles.
              Si crees que es un error, contacta con el administrador.
            </p>
          </div>
        ) : (
          <div className={styles.adminActions}>
            {availableActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`${styles.adminActionCard} ${styles[action.color]}`}
                  style={{ "--card-index": index }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardNumber}>
                      {action.number}
                    </span>

                    <span className={styles.cardCategory}>
                      {action.category}
                    </span>
                  </div>

                  <div className={styles.cardIcon}>
                    <Icon size={29} strokeWidth={1.7} />
                  </div>

                  <div className={styles.cardCopy}>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>

                  <div className={styles.cardBottom}>
                    <span className={styles.permissionTag}>
                      <ShieldCheck size={13} />
                      {action.permission}
                    </span>

                    <span className={styles.cardArrow}>
                      <ArrowUpRight size={21} />
                    </span>
                  </div>

                  <span className={styles.cardGlow} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className={styles.adminFooter}>
        <div className={styles.footerBrand}>
          <Waves size={19} />
          <strong>GENSTI</strong>
          <span>Ingeniería de Sistemas</span>
        </div>

        <span className={styles.footerMessage}>
          Ideas que conectan. Tecnología que transforma.
        </span>
      </footer>
    </main>
  );
}

export default AdminPage;
