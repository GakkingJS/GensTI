import { Fragment, useEffect, useRef, useState } from "react";
import {
  Check,
  LifeBuoy,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  SendHorizontal,
  X,
} from "lucide-react";
import "./Chatbot.css";

/* ==========================================================================
   CONFIGURACIÓN
   ========================================================================== */

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE}/faq/chat`;

const STORAGE_KEY = "gensti-chatbot-v1";
const REQUEST_TIMEOUT_MS = 25000;
const MAX_RELATED = 3;

const SUPPORT_WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=573124689345";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hola 👋 Soy el asistente de GensTI. Pregúntame sobre matrículas, pagos, inscripción de cursos, situación académica o las asesorías del Parche GensTI.\n\nTambién puedes consultar por las materias, los horarios, el lugar y los líderes del Parche.",
  },
];

/* ==========================================================================
   SUGERENCIAS Y PREGUNTAS RELACIONADAS
   ========================================================================== */

const PARCHE_RELATED_QUESTIONS = [
  "¿Qué es el Parche GensTI?",
  "¿Cuáles son los horarios del Parche GensTI?",
  "¿Qué materias se asesoran en el Parche GensTI?",
  "¿Dónde son las asesorías del Parche GensTI?",
  "¿Quiénes lideran las asesorías del Parche GensTI?",
  "¿Cuándo son las asesorías de programación del Parche GensTI?",
  "¿Cuándo son las asesorías de matemáticas y física del Parche GensTI?",
  "¿Necesito inscripción para asistir al Parche GensTI?",
];

const SUGGESTIONS = [
  "¿Qué materias se asesoran en el Parche GensTI?",
  "¿Dónde y cómo puedo pagar mi matrícula?",
  "¿Cuándo puedo realizar la inscripción de cursos?",
  "¿Cómo selecciono el número de créditos a inscribir?",
  "¿Cuánto es el valor de mi semestre?",
  "¿Cómo realizo la cancelación de cursos?",
];

const DEFAULT_RELATED_QUESTIONS = [
  "¿Cómo realizo mi matrícula?",
  "¿Dónde y cómo puedo pagar mi matrícula?",
  "¿Cuándo puedo realizar la inscripción de cursos?",
];

const SITUACION_RELATED = [
  "¿Cómo selecciono el número de créditos a inscribir?",
  "¿Cuándo puedo realizar la inscripción de cursos?",
  "¿Cómo realizo la cancelación de cursos?",
];

const RELATED_QUESTIONS = {
  "¿Cómo realizo mi matrícula?": [
    "¿Dónde y cómo puedo pagar mi matrícula?",
    "¿Cuándo puedo realizar la inscripción de cursos?",
    "¿Cuánto es el valor de mi semestre?",
  ],

  "¿Dónde y cómo puedo pagar mi matrícula?": [
    "¿Cuánto es el valor de mi semestre?",
    "¿Cómo realizo mi matrícula?",
    "¿Cuándo puedo realizar la inscripción de cursos?",
  ],

  "¿Cuándo puedo realizar la inscripción de cursos?": [
    "¿Cómo conozco mi situación académica?",
    "¿Cómo selecciono el número de créditos a inscribir?",
    "¿Cómo realizo mi matrícula?",
  ],

  "¿Cómo conozco mi situación académica?": SITUACION_RELATED,

  "¿Cómo conozco mi situación académica en la Universidad?":
    SITUACION_RELATED,

  "¿Cómo selecciono el número de créditos a inscribir?": [
    "¿Cuándo puedo realizar la inscripción de cursos?",
    "¿Cómo conozco mi situación académica?",
    "¿Cómo realizo la cancelación de cursos?",
  ],

  "¿Cuánto es el valor de mi semestre?": [
    "¿Dónde y cómo puedo pagar mi matrícula?",
    "¿Cómo realizo mi matrícula?",
    "¿Cuándo puedo realizar la inscripción de cursos?",
  ],

  "¿Cómo realizo la cancelación de cursos?": [
    "¿Cuándo puedo realizar la inscripción de cursos?",
    "¿Cómo conozco mi situación académica?",
    "¿Cómo selecciono el número de créditos a inscribir?",
  ],

  "¿Qué es el Parche GensTI?": [
    "¿Qué materias se asesoran en el Parche GensTI?",
    "¿Cuáles son los horarios del Parche GensTI?",
    "¿Dónde son las asesorías del Parche GensTI?",
  ],

  "¿Cuáles son los horarios del Parche GensTI?": [
    "¿Dónde son las asesorías del Parche GensTI?",
    "¿Quiénes lideran las asesorías del Parche GensTI?",
    "¿Necesito inscripción para asistir al Parche GensTI?",
  ],

  "¿Qué materias se asesoran en el Parche GensTI?": [
    "¿Cuándo son las asesorías de programación del Parche GensTI?",
    "¿Cuándo son las asesorías de matemáticas y física del Parche GensTI?",
    "¿Dónde son las asesorías del Parche GensTI?",
  ],

  "¿Dónde son las asesorías del Parche GensTI?": [
    "¿Cuáles son los horarios del Parche GensTI?",
    "¿Quiénes lideran las asesorías del Parche GensTI?",
    "¿Necesito inscripción para asistir al Parche GensTI?",
  ],

  "¿Quiénes lideran las asesorías del Parche GensTI?": [
    "¿Cuándo son las asesorías de programación del Parche GensTI?",
    "¿Cuándo son las asesorías de matemáticas y física del Parche GensTI?",
    "¿Dónde son las asesorías del Parche GensTI?",
  ],

  "¿Cuándo son las asesorías de programación del Parche GensTI?": [
    "¿Dónde son las asesorías del Parche GensTI?",
    "¿Qué materias se asesoran en el Parche GensTI?",
    "¿Necesito inscripción para asistir al Parche GensTI?",
  ],

  "¿Cuándo son las asesorías de matemáticas y física del Parche GensTI?": [
    "¿Dónde son las asesorías del Parche GensTI?",
    "¿Quiénes lideran las asesorías del Parche GensTI?",
    "¿Necesito inscripción para asistir al Parche GensTI?",
  ],

  "¿Necesito inscripción para asistir al Parche GensTI?": [
    "¿Cuáles son los horarios del Parche GensTI?",
    "¿Dónde son las asesorías del Parche GensTI?",
    "¿Qué materias se asesoran en el Parche GensTI?",
  ],
};

/* ==========================================================================
   UTILIDADES
   ========================================================================== */

function normalize(text = "") {
  return String(text ?? "").trim().toLowerCase();
}

function normalizeSearch(text = "") {
  return normalize(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isParcheTopic(text = "") {
  const normalized = normalizeSearch(text);

  return (
    /\bparche\b/.test(normalized) ||
    /\basesorias?\b/.test(normalized)
  );
}

function findRelatedQuestions(question = "") {
  const normalized = normalizeSearch(question);

  const entry = Object.entries(RELATED_QUESTIONS).find(
    ([key]) => normalizeSearch(key) === normalized
  );

  return entry?.[1];
}

/*
 * No repite preguntas ya realizadas.
 * En consultas del Parche mantiene las sugerencias dentro de ese tema.
 */
function buildRelated(matchedQuestion, messages) {
  const asked = new Set(
    messages
      .filter((message) => message.role === "user")
      .map((message) => normalizeSearch(message.content))
  );

  const lastUserQuestion = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.content;

  const isParche =
    isParcheTopic(matchedQuestion) ||
    isParcheTopic(lastUserQuestion);

  const exactRelated =
    findRelatedQuestions(matchedQuestion) ??
    findRelatedQuestions(lastUserQuestion);

  const source =
    exactRelated ??
    (isParche
      ? PARCHE_RELATED_QUESTIONS
      : DEFAULT_RELATED_QUESTIONS);

  const pool = isParche
    ? [...source, ...PARCHE_RELATED_QUESTIONS]
    : [
        ...source,
        ...DEFAULT_RELATED_QUESTIONS,
        ...SUGGESTIONS,
      ];

  const seen = new Set();

  return pool
    .filter((question) => {
      const normalized = normalizeSearch(question);

      if (
        seen.has(normalized) ||
        asked.has(normalized) ||
        normalized === normalizeSearch(matchedQuestion)
      ) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, MAX_RELATED);
}

/* WhatsApp con la última pregunta escrita. */
function getSupportUrl(messages, index) {
  const lastQuestion = messages
    .slice(0, index)
    .reverse()
    .find((message) => message.role === "user")?.content;

  const text = lastQuestion
    ? `Hola, necesito ayuda con esta consulta: ${lastQuestion}`
    : "Hola, necesito ayuda del asistente GensTI.";

  return `${SUPPORT_WHATSAPP_URL}&text=${encodeURIComponent(text)}`;
}

function prefersReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

/* Restaurar la conversación de esta pestaña. */
function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw);

    if (
      !Array.isArray(data.messages) ||
      data.messages.length === 0
    ) {
      return null;
    }

    const validMessages = data.messages.every(
      (message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
    );

    if (!validMessages) return null;

    const messages = [...data.messages];

    while (
      messages.length > 1 &&
      messages[messages.length - 1].role === "user"
    ) {
      messages.pop();
    }

    const resolved =
      data.resolved &&
      typeof data.resolved === "object" &&
      !Array.isArray(data.resolved)
        ? data.resolved
        : {};

    return { messages, resolved };
  } catch {
    return null;
  }
}

/* ==========================================================================
   TEXTO CON FORMATO
   **negrita**, enlaces HTTP/HTTPS y listas
   ========================================================================== */

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const BULLET_RE = /^\s*[-•*]\s+(.*)$/;

function renderBold(segment, keyBase) {
  const nodes = [];
  let position = 0;
  let index = 0;

  for (const match of segment.matchAll(BOLD_RE)) {
    if (match.index > position) {
      nodes.push(segment.slice(position, match.index));
    }

    nodes.push(
      <strong key={`${keyBase}-b${index++}`}>
        {match[1]}
      </strong>
    );

    position = match.index + match[0].length;
  }

  if (position < segment.length) {
    nodes.push(segment.slice(position));
  }

  return nodes;
}

function renderInline(text, keyBase) {
  const nodes = [];
  let position = 0;
  let index = 0;

  for (const match of text.matchAll(LINK_RE)) {
    if (match.index > position) {
      nodes.push(
        ...renderBold(
          text.slice(position, match.index),
          `${keyBase}-t${index}`
        )
      );
    }

    nodes.push(
      <a
        key={`${keyBase}-a${index}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="chatbot-link"
      >
        {match[1]}
      </a>
    );

    position = match.index + match[0].length;
    index++;
  }

  if (position < text.length) {
    nodes.push(
      ...renderBold(
        text.slice(position),
        `${keyBase}-t${index}`
      )
    );
  }

  return nodes;
}

function parseBlocks(text = "") {
  const blocks = [];
  let current = null;

  function flush() {
    if (current) blocks.push(current);
    current = null;
  }

  for (const line of text.split("\n")) {
    const ordered = line.match(ORDERED_RE);
    const bullet = ordered ? null : line.match(BULLET_RE);

    if (ordered || bullet) {
      const type = ordered ? "ol" : "ul";

      if (current?.type !== type) {
        flush();
        current = { type, items: [] };
      }

      current.items.push((ordered || bullet)[1]);
    } else if (line.trim() === "") {
      flush();
    } else {
      if (current?.type !== "p") {
        flush();
        current = { type: "p", lines: [] };
      }

      current.lines.push(line);
    }
  }

  flush();
  return blocks;
}

function FormattedText({ text }) {
  const blocks = parseBlocks(text);

  return (
    <div className="chatbot-text">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index}>
              {renderInline(
                block.lines.join("\n"),
                `p${index}`
              )}
            </p>
          );
        }

        const List = block.type;

        return (
          <List key={index} className="chatbot-list">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                {renderInline(
                  item,
                  `l${index}-${itemIndex}`
                )}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  const [session] = useState(() => loadSession());

  const [messages, setMessages] = useState(
    () => session?.messages ?? INITIAL_MESSAGES
  );

  const [resolved, setResolved] = useState(
    () => session?.resolved ?? {}
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);

  const activeRequestRef = useRef(null);
  const requestPendingRef = useRef(false);

  const lastIndex = messages.length - 1;

  /* Guardar conversación. */
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, resolved })
      );
    } catch {
      /* El chat funciona aunque el almacenamiento no esté disponible. */
    }
  }, [messages, resolved]);

  /* Cancelar la petición si se desmonta el componente. */
  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      requestPendingRef.current = false;
    };
  }, []);

  /* Leer una respuesta nueva desde su inicio. */
  useEffect(() => {
    const box = messagesRef.current;

    if (!box) return;

    const behavior = prefersReducedMotion()
      ? "instant"
      : "smooth";

    const last = messages[messages.length - 1];

    if (
      !loading &&
      last?.role === "assistant" &&
      messages.length > 1
    ) {
      const row = box.querySelector(
        `[data-index="${messages.length - 1}"]`
      );

      if (row) {
        const top =
          box.scrollTop +
          row.getBoundingClientRect().top -
          box.getBoundingClientRect().top -
          12;

        box.scrollTo({
          top: Math.max(top, 0),
          behavior,
        });

        return;
      }
    }

    box.scrollTo({
      top: box.scrollHeight,
      behavior,
    });
  }, [messages, loading, open]);

  /* En móvil no abrir automáticamente el teclado. */
  useEffect(() => {
    if (
      open &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  function closePanel() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closePanel();
    }
  }

  async function askBackend(text) {
    if (requestPendingRef.current) return;

    requestPendingRef.current = true;
    setLoading(true);

    const controller = new AbortController();
    activeRequestRef.current = controller;

    const timer = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("No fue posible obtener respuesta.");
      }

      const data = await response.json();

      if (
        typeof data.answer !== "string" ||
        !data.answer.trim()
      ) {
        throw new Error("El servidor devolvió una respuesta vacía.");
      }

      if (activeRequestRef.current !== controller) return;

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
          matchedQuestion:
            typeof data.matched_question === "string"
              ? data.matched_question
              : undefined,
          documents: Array.isArray(data.documents)
            ? data.documents.filter(
                (document) =>
                  document &&
                  typeof document.title === "string" &&
                  typeof document.file_url === "string" &&
                  /^https?:\/\//i.test(document.file_url)
              )
            : [],
        },
      ]);
    } catch {
      if (activeRequestRef.current !== controller) return;

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          error: true,
          retryText: text,
          content: controller.signal.aborted
            ? "La consulta tardó más de lo esperado. Puedes intentarlo de nuevo o escribirle a soporte."
            : "No pude procesar tu consulta en este momento. Puedes intentarlo de nuevo o escribirle a soporte.",
        },
      ]);
    } finally {
      window.clearTimeout(timer);

      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        requestPendingRef.current = false;
        setLoading(false);
      }
    }
  }

  function sendMessage(question) {
    const text = question.trim();

    if (!text || requestPendingRef.current) return;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: text,
      },
    ]);

    setInput("");
    void askBackend(text);
  }

  function retry(index, text) {
    if (requestPendingRef.current || !text) return;

    setMessages((previous) =>
      previous.filter((_, messageIndex) => messageIndex !== index)
    );

    void askBackend(text);
  }

  function resetConversation() {
    if (requestPendingRef.current) return;

    setMessages(INITIAL_MESSAGES);
    setResolved({});
    setInput("");

    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="chatbot-toggle"
        aria-label={
          open ? "Cerrar asistente" : "Abrir asistente"
        }
        aria-expanded={open}
        aria-controls={open ? "chatbot-panel" : undefined}
      >
        {open ? (
          <X key="close" size={26} />
        ) : (
          <MessageCircle key="chat" size={26} />
        )}
      </button>

      {open && (
        <div
          id="chatbot-panel"
          className="chatbot-panel"
          role="dialog"
          aria-label="Asistente GensTI"
          onKeyDown={handleKeyDown}
        >
          {/* CABECERA */}
          <header
            className="chatbot-header"
            data-state={loading ? "thinking" : "idle"}
          >
            <div>
              <p className="chatbot-title">
                Asistente GensTI
              </p>

              <p className="chatbot-subtitle">
                Ingeniería de Sistemas · UCC Ibagué
              </p>
            </div>

            <div className="chatbot-header-actions">
              {messages.length > 1 && (
                <button
                  type="button"
                  className="chatbot-icon-btn"
                  onClick={resetConversation}
                  disabled={loading}
                  aria-label="Nueva conversación"
                  title="Nueva conversación"
                >
                  <RefreshCw size={16} />
                </button>
              )}

              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={closePanel}
                aria-label="Cerrar asistente"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* CONVERSACIÓN */}
          <div
            className="chatbot-messages"
            ref={messagesRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              const previousQuestion =
                messages[index - 1]?.content;

              const showMatched =
                !isUser &&
                message.matchedQuestion &&
                normalizeSearch(message.matchedQuestion) !==
                  normalizeSearch(previousQuestion);

              const showActions =
                !isUser &&
                index > 0 &&
                index === lastIndex &&
                !loading;

              const related =
                showActions && !message.error
                  ? buildRelated(
                      message.matchedQuestion,
                      messages
                    )
                  : [];

              return (
                <Fragment key={index}>
                  <div
                    className={
                      isUser
                        ? "chatbot-row chatbot-row-user"
                        : "chatbot-row"
                    }
                    data-index={index}
                  >
                    <div
                      className={[
                        "chatbot-bubble",
                        isUser && "chatbot-bubble-user",
                        message.error && "chatbot-bubble-error",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {isUser ? (
                        <p>{message.content}</p>
                      ) : (
                        <FormattedText text={message.content} />
                      )}

                      {showMatched && (
                        <p className="chatbot-matched">
                          Entendí tu pregunta como:{" "}
                          <em>{message.matchedQuestion}</em>
                        </p>
                      )}

                      {message.documents?.length > 0 && (
                        <div className="chatbot-documents">
                          <p className="chatbot-documents-title">
                            Documentos
                          </p>

                          {message.documents.map(
                            (document, documentIndex) => (
                              <a
                                key={
                                  document.id ??
                                  `${document.file_url}-${documentIndex}`
                                }
                                href={document.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chatbot-link"
                              >
                                {document.title}
                              </a>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ERROR Y REINTENTO */}
                  {showActions && message.error && (
                    <div className="chatbot-actions">
                      <div className="chatbot-error-actions">
                        <button
                          type="button"
                          onClick={() =>
                            retry(index, message.retryText)
                          }
                        >
                          <RotateCcw size={14} />
                          Reintentar
                        </button>

                        <a
                          href={getSupportUrl(messages, index)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LifeBuoy size={14} />
                          Contactar soporte
                        </a>
                      </div>
                    </div>
                  )}

                  {/* RELACIONADAS Y SEGUIMIENTO */}
                  {showActions && !message.error && (
                    <div className="chatbot-actions">
                      {related.length > 0 && (
                        <>
                          <p className="chatbot-actions-label">
                            Preguntas relacionadas
                          </p>

                          <div className="chatbot-related">
                            {related.map((question) => (
                              <button
                                key={question}
                                type="button"
                                onClick={() =>
                                  sendMessage(question)
                                }
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="chatbot-feedback">
                        {resolved[index] ? (
                          <p
                            className="chatbot-feedback-done"
                            role="status"
                          >
                            <Check size={15} strokeWidth={3} />
                            ¡Gracias por tu respuesta!
                          </p>
                        ) : (
                          <>
                            <p>¿Se resolvió tu inquietud?</p>

                            <div className="chatbot-feedback-buttons">
                              <button
                                type="button"
                                onClick={() =>
                                  setResolved((previous) => ({
                                    ...previous,
                                    [index]: true,
                                  }))
                                }
                              >
                                Sí, se resolvió
                              </button>

                              <a
                                href={getSupportUrl(
                                  messages,
                                  index
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <LifeBuoy size={14} />
                                No, contactar soporte
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}

            {loading && (
              <div className="chatbot-row">
                <div
                  className="chatbot-bubble chatbot-loading"
                  role="status"
                >
                  Escribiendo
                </div>
              </div>
            )}
          </div>

          {/* SUGERENCIAS INICIALES */}
          {messages.length <= 1 && (
            <div className="chatbot-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* ENVIAR PREGUNTA */}
          <form
            onSubmit={handleSubmit}
            className="chatbot-form"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Pregunta por trámites o el Parche..."
              aria-label="Escribe tu pregunta"
              maxLength={300}
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar pregunta"
            >
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}