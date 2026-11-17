--
-- PostgreSQL database dump
--

\restrict Gy89QhMXN6eiCfAKK5VWcPSoRq6KAnNzXS0JKnqpVhiEYYhgbBufLjMefc7UdvP

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: academic_periods; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.academic_periods (id, code, name, campus, starts_at, ends_at, created_at, updated_at) VALUES ('aee31447-0ec3-4ae0-b8e9-ce8cee1543bc', '2026-2', 'Periodo académico 2026-2', 'Ibagué', '2026-08-01 00:00:00+00', '2026-12-18 23:59:59+00', '2026-10-24 03:50:46.995102+00', '2026-10-24 03:50:46.995102+00');


--
-- Data for Name: academic_calendar_events; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.academic_calendar_events (id, period_id, title, description, starts_at, ends_at, campus, audience, source_url, source_label, status, created_by_id, published_at, created_at, updated_at) VALUES ('c0a4cb52-eb00-4ec9-b56b-1dae0b921a1a', 'aee31447-0ec3-4ae0-b8e9-ce8cee1543bc', 'Inscripción de cursos', 'Día de inicio', '2026-12-22 11:11:00+00', '2026-12-31 11:11:00+00', 'Ibagué', 'Estudiantes de Ingeniería de Sistemas', NULL, NULL, 'draft', '1905b0c5-67e5-4bb1-a9ef-f7556e741e46', NULL, '2026-10-24 04:17:44.038994+00', '2026-10-24 04:17:44.038994+00');
INSERT INTO public.academic_calendar_events (id, period_id, title, description, starts_at, ends_at, campus, audience, source_url, source_label, status, created_by_id, published_at, created_at, updated_at) VALUES ('6b864bd1-1ee4-40ad-9213-da9d2a4ced6f', 'aee31447-0ec3-4ae0-b8e9-ce8cee1543bc', 'Pago de matrícula ordinaria', 'Plazo para realizar el pago de matrícula ordinaria.', '2026-06-30 00:00:00+00', '2026-08-07 18:59:00+00', 'Ibagué', 'Estudiantes de Ingeniería de Sistemas', NULL, NULL, 'published', '1905b0c5-67e5-4bb1-a9ef-f7556e741e46', '2026-10-24 03:53:39.787008+00', '2026-10-24 03:52:06.282304+00', '2026-10-25 01:27:08.717805+00');


--
-- Data for Name: community_events; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.community_events (id, title, type, short_description, description, start_date, end_date, "time", location, image_url, external_url, featured, status, created_by_id, created_at, updated_at) VALUES ('dfa57cf9-029a-41c7-a393-642acbe03f72', 'CONFE', 'CONFERENCIA', 'CONFE', 'CONFE DE IA', '2026-11-24', '2026-11-24', '2:00 p.m ', 'SEDE CENTRO', NULL, NULL, false, 'published', '1905b0c5-67e5-4bb1-a9ef-f7556e741e46', '2026-10-26 03:49:48.330172+00', '2026-10-26 03:50:59.778325+00');
INSERT INTO public.community_events (id, title, type, short_description, description, start_date, end_date, "time", location, image_url, external_url, featured, status, created_by_id, created_at, updated_at) VALUES ('a6324f24-8402-4e43-b47b-9724300a5cb0', 'BIENAL 2026', 'INGENIERÍA', 'VII BIENAL INTERNACIONAL DE INGENIERIA', NULL, '2026-10-28', '2026-10-30', '8:00 a.m', 'Campus Ibagué', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaMJHe2vvuFcGt07mw4gp1MPIHyp4jPwkb26Tgb2zJ8T1SVZlM2_pxzowl&s=10', NULL, true, 'published', '1905b0c5-67e5-4bb1-a9ef-f7556e741e46', '2026-10-26 03:59:14.272824+00', '2026-10-26 04:00:13.678592+00');


--
-- Data for Name: faq_items; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('9949daac-8f29-484b-ac15-7af5988d7c63', 'matricula_procedimiento', 'Matrícula y pagos', '¿Cómo realizo mi matrícula?', 'Para quedar matriculado debes completar dos pasos:

1. Pagar los derechos pecuniarios por concepto de matrícula.
2. Inscribir tus cursos en el sistema académico.

Si no finalizas la inscripción de cursos, la Universidad te considerará **no matriculado**.

Los estudiantes admitidos por primera vez no seleccionan cursos manualmente: la Universidad los inscribe automáticamente después de que realizan el pago de matrícula.

Si no completas todo el proceso, no se reconocen derechos exigibles frente a la Universidad.', '["¿Cómo me matriculo?", "¿Qué debo hacer para matricularme?", "¿Cuáles son los pasos para matricularme?", "¿Qué pasa si no inscribo cursos?", "¿La matrícula incluye inscripción de cursos?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-21', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 00:39:26.930108', '2026-10-27 04:03:41.620998');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('a35058e3-fdd3-4109-ba68-6752749bbac8', 'pago_matricula', 'Matrícula y pagos', '¿Dónde y cómo puedo pagar mi matrícula?', 'Para realizar el pago de matrícula puedes:

- Imprimir el recibo de pago y dirigirte a las entidades bancarias autorizadas por la Universidad.
- Realizar el pago en línea a través del sistema académico.

Consulta las guías oficiales:

- [Realizar pago en línea](https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Realizar-pago-en-linea.pdf)
- [Imprimir recibo de pago](https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Imprimir-recibo-de-pago.pdf)', '["¿Dónde pago el semestre?", "¿Cómo pago mi matrícula?", "¿Puedo pagar mi matrícula en línea?", "¿Cuánto debo pagar de matrícula?", "¿Cómo genero el recibo de pago?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-66', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 00:39:26.934018', '2026-10-27 04:03:41.68347');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('ed8c851c-eec3-4c00-8df0-816a1cb92269', 'inscripcion_materias', 'Inscripción académica', '¿Cuándo puedo realizar la inscripción de cursos?', 'La inscripción de cursos es el proceso mediante el cual los estudiantes regulares registran en el sistema académico las asignaturas que cursarán durante el semestre.

Para poder inscribirte debes cumplir estos requisitos:

- Haber pagado la matrícula completa.
- No tener deudas ni pendientes con Tesorería, Biblioteca, Bienestar o la Facultad.
- Tener asignada la fecha de inscripción; el sistema la envía al correo institucional después del pago.
- Tener definida tu situación académica.

Al finalizar, verifica que todos los cursos seleccionados aparezcan con estado **inscrito** en tu horario.

Consulta la guía oficial: [Realizar la inscripción de clases](https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Realizar-la-inscripcion-de-clases.pdf)', '["¿Cómo realizo la inscripción de materias?", "¿Cómo me inscribo en materias?", "¿Cuándo puedo meter materias?", "¿Cómo realizo la inscripción de cursos?", "¿Qué requisitos necesito para inscribir cursos?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-17', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 00:39:26.935521', '2026-10-27 04:03:41.723362');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('ac31f8cf-786f-4f89-ad7e-e3c7aea26493', 'situacion_academica', 'Inscripción académica', '¿Cómo conozco mi situación académica en la Universidad?', 'Tu situación académica se define según tu rendimiento al finalizar cada semestre y se aplica en el semestre siguiente.

Puede ser:

- **Matrícula normal:** puedes inscribir todos tus créditos sin restricciones.
- **Primera matrícula especial:** debes inscribir primero los cursos reprobados; luego puedes completar el rango mínimo con cursos no reprobados.
- **Segunda matrícula especial:** estás en riesgo de perder la condición de estudiante y aplican las mismas reglas de inscripción que en la primera matrícula especial.
- **Pérdida de condición de estudiante:** no puedes continuar en el programa académico.

Consulta el [Reglamento estudiantil](https://ucc.edu.co/estudiante/Paginas/reglamento-academico.aspx) y la guía oficial: [Consultar situación académica](https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Consultar-situacion-academica.pdf)', '["¿Qué es la situación académica?", "¿Cómo sé mi situación académica?", "¿Qué significa matrícula especial?", "¿Qué pasa si repruebo materias?", "¿Puedo perder la condición de estudiante?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-17', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 04:03:41.730528', '2026-10-27 04:03:41.730534');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('278f688b-e61a-475a-8de4-dda970873f45', 'cancelacion_cursos', 'Inscripción académica', '¿Cómo realizo la cancelación de cursos?', 'La cancelación de cursos debe realizarse dentro de los plazos establecidos en el calendario académico.

Antes de cancelar, revisa:

- La fecha límite de cancelación publicada en el calendario.
- El impacto en tu carga académica y en tu situación académica.
- Si debes conservar el número mínimo de créditos exigido por tu programa.

Para confirmar el procedimiento y los plazos vigentes, consulta el calendario académico o contacta a la coordinación de tu programa.', '["¿Cómo cancelo una materia?", "¿Cómo cancelo un curso?", "¿Puedo cancelar una asignatura?", "¿Hasta cuándo puedo cancelar materias?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-26', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 00:39:26.938019', '2026-10-27 04:03:41.778544');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('ff6af0cb-67c2-4d54-86da-1218ffd1edd2', 'creditos_inscripcion', 'Inscripción académica', '¿Cómo selecciono el número de créditos a inscribir?', 'El cambio de carga académica te permite aumentar o disminuir el número de créditos a inscribir, dentro del rango mínimo establecido para tu programa.

El sistema sugiere un número inicial de créditos según tu nivel o semestre. Puedes modificarlo antes del pago o durante la inscripción de cursos, cuantas veces sea necesario dentro del periodo habilitado.

Consulta la guía oficial: [Seleccionar el número de créditos a inscribir](https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Seleccionar-el-numero-de-creditos-a-inscribir.pdf)', '["¿Cuántos créditos puedo inscribir?", "¿Cómo elijo mis créditos?", "¿Cómo cambio mi carga académica?", "¿Cómo aumento los créditos?", "¿Cómo reduzco los créditos?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-24', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 00:39:26.936762', '2026-10-27 04:03:41.737853');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('4a80119b-48da-49ad-906f-f42056c6d061', 'valor_semestre', 'Matrícula y pagos', '¿Cuánto es el valor de mi semestre?', 'El valor de tu semestre depende de tu programa académico, del número de créditos inscritos y de la resolución vigente de derechos pecuniarios.

Puedes consultar los valores oficiales en el documento de la Universidad: [Resolución de derechos pecuniarios e incremento de matrícula — Ibagué](https://ucc.edu.co/tarifas-y-financiacion/Derechos%20Pecunarios%202024/Resolucion%20Rectoral-138-2025-Incremento%20valor%20derechos%20matricula%20y%20otros%20pecuniarios_Ibague.pdf)

Para conocer el valor exacto de tu matrícula, genera o consulta tu recibo de pago en el sistema académico.', '["¿Cuánto cuesta el semestre?", "¿Cuál es el valor de la matrícula?", "¿Dónde veo el valor de mi semestre?", "¿Cómo sé cuánto debo pagar?"]', 'https://ucc.edu.co/preguntas-frecuentes#collapser-66', 'Preguntas frecuentes UCC', NULL, 'approved', '2026-10-27 04:03:41.773592', '2026-10-27 04:03:41.773597');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('7affc20e-9526-4f44-b3fc-157fc6a3eca4', 'parche_presentacion', 'Parche GensTI', '¿Qué es el Parche GensTI?', 'Las **Asesorías del Parche GensTI** son un espacio de la comunidad estudiantil de Ingeniería de Sistemas de la Universidad Cooperativa de Colombia, en Ibagué.

La información compartida incluye asesorías en dos áreas:

- **Programación:** estructuras de datos y programación orientada a objetos.
- **Matemáticas y física:** cálculo diferencial, cálculo integral, física mecánica, álgebra lineal, lógica matemática y análisis numérico.

Los encuentros del horario compartido se realizan los **martes y viernes**, en la **Sala cómputo 3**.

El horario compartido no especifica fechas de inicio, finalización ni vigencia semestral. Confirma su disponibilidad actual con la organización antes de asistir.', '["¿Qué es el parche?", "¿De qué trata el Parche GensTI?", "¿Qué son las asesorías del Parche GensTI?", "¿Para qué sirve el Parche GensTI?", "Quiero información del Parche GensTI", "Cuéntame sobre el Parche GensTI"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.263874', '2026-11-02 23:45:30.263876');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('d348bc36-1a91-43fe-a307-8bbd5a344821', 'parche_horarios', 'Parche GensTI', '¿Cuáles son los horarios del Parche GensTI?', 'El horario compartido de las **Asesorías del Parche GensTI** es:

**Martes**

- **9:00 a. m.:** estructuras de datos y programación orientada a objetos. Líderes: Walter Alturo y Johan Reyes.
- **4:00 p. m.:** cálculo diferencial, cálculo integral, física mecánica, álgebra lineal, lógica matemática y análisis numérico. Líderes: Juan P. Gómez Zapata y Daniel E. Aristizábal.

**Viernes**

- **9:00 a. m.:** cálculo diferencial, cálculo integral, física mecánica, álgebra lineal, lógica matemática y análisis numérico. Líder: Daniel E. Aristizábal.
- **4:00 p. m.:** estructuras de datos y programación orientada a objetos. Líderes: Walter Alturo y Johan Reyes.

Todos estos encuentros tienen como lugar la **Sala cómputo 3**.

El horario compartido no especifica fechas de inicio, finalización ni vigencia semestral. Confirma su disponibilidad actual con la organización antes de asistir.', '["¿Qué horarios tiene el Parche GensTI?", "¿Cuándo son las asesorías del parche?", "¿Qué días funciona el Parche GensTI?", "¿A qué horas son las asesorías del Parche GensTI?", "Muéstrame el horario del parche", "¿Cuándo puedo asistir al Parche GensTI?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.297307', '2026-11-02 23:45:30.29731');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('e5d413ce-f9c6-4eee-bbb6-3f2d4342a3ef', 'parche_materias', 'Parche GensTI', '¿Qué materias se asesoran en el Parche GensTI?', 'Las materias incluidas en la información compartida del **Parche GensTI** son:

**Programación**

- Estructuras de datos.
- Programación orientada a objetos.

**Matemáticas y física**

- Cálculo diferencial.
- Cálculo integral.
- Física mecánica.
- Álgebra lineal.
- Lógica matemática.
- Análisis numérico.

Estas son las materias reportadas. La información recibida no confirma asesorías para otras asignaturas.', '["¿Qué temas trabajan en el Parche GensTI?", "¿Qué cursos cubren las asesorías del parche?", "¿En qué materias me ayuda el Parche GensTI?", "¿Hay asesorías de cálculo en el parche?", "¿Hay asesorías de física en el parche?", "¿Hay asesorías de programación en el parche?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.299419', '2026-11-02 23:45:30.299424');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('a9cff330-43ad-46cf-8b51-cfc142b8335d', 'parche_lugar', 'Parche GensTI', '¿Dónde son las asesorías del Parche GensTI?', 'Los cuatro encuentros del horario compartido de las **Asesorías del Parche GensTI** tienen como lugar la **Sala cómputo 3**, en el contexto de la comunidad de Ingeniería de Sistemas de la UCC en Ibagué.

La información recibida no especifica edificio, piso ni dirección adicional. Confirma estos detalles con la organización si necesitas orientación para llegar.', '["¿Dónde queda el Parche GensTI?", "¿En qué salón son las asesorías del parche?", "¿En qué sala se reúne el Parche GensTI?", "¿Dónde se realizan las asesorías del parche?", "¿Cuál es el lugar de las asesorías del Parche GensTI?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.303035', '2026-11-02 23:45:30.303038');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('93036deb-7d3f-47aa-b00c-b3c78a1a0e93', 'parche_lideres', 'Parche GensTI', '¿Quiénes lideran las asesorías del Parche GensTI?', 'Los líderes indicados para las asesorías del **Parche GensTI** son:

**Programación**

- Walter Alturo.
- Johan Reyes.
- Ambos aparecen en las sesiones del martes a las 9:00 a. m. y del viernes a las 4:00 p. m.

**Matemáticas y física**

- Martes a las 4:00 p. m.: Juan P. Gómez Zapata y Daniel E. Aristizábal.
- Viernes a las 9:00 a. m.: Daniel E. Aristizábal.

La información compartida los identifica como líderes de estos espacios; no especifica sus cargos ni proporciona datos de contacto.', '["¿Quiénes son los líderes del parche?", "¿Quién da las asesorías del Parche GensTI?", "¿Quién me ayuda en las asesorías del parche?", "¿Quiénes orientan las asesorías del Parche GensTI?", "¿Quiénes están a cargo del Parche GensTI?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.305442', '2026-11-02 23:45:30.305445');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('f1e92927-8a78-4aa6-8c0e-fb7cdfaa5cab', 'parche_programacion', 'Parche GensTI', '¿Cuándo son las asesorías de programación del Parche GensTI?', 'Las asesorías de **programación del Parche GensTI** aparecen en estos horarios:

- **Martes a las 9:00 a. m.**
- **Viernes a las 4:00 p. m.**

**Materias**

- Estructuras de datos.
- Programación orientada a objetos.

**Líderes en ambos horarios**

- Walter Alturo.
- Johan Reyes.

**Lugar:** Sala cómputo 3.

El horario compartido no especifica fechas de inicio, finalización ni vigencia semestral. Confirma su disponibilidad actual con la organización antes de asistir.', '["¿Qué horario tiene programación en el parche?", "¿Cuándo hay asesorías de estructuras de datos?", "¿Cuándo hay asesorías de programación orientada a objetos?", "¿Cuándo hay asesorías de POO?", "¿Quién ayuda con estructuras de datos en el parche?", "¿Cuándo están Walter Alturo y Johan Reyes en el parche?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.30731', '2026-11-02 23:45:30.307313');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('c5c8d8ae-9bd9-42de-8efe-698ad84b46df', 'parche_matematicas_fisica', 'Parche GensTI', '¿Cuándo son las asesorías de matemáticas y física del Parche GensTI?', 'Las asesorías de **matemáticas y física del Parche GensTI** aparecen en estos horarios:

- **Martes a las 4:00 p. m.**, con Juan P. Gómez Zapata y Daniel E. Aristizábal.
- **Viernes a las 9:00 a. m.**, con Daniel E. Aristizábal.

**Materias**

- Cálculo diferencial.
- Cálculo integral.
- Física mecánica.
- Álgebra lineal.
- Lógica matemática.
- Análisis numérico.

**Lugar:** Sala cómputo 3.

El horario compartido no especifica fechas de inicio, finalización ni vigencia semestral. Confirma su disponibilidad actual con la organización antes de asistir.', '["¿Qué horario tiene matemáticas en el parche?", "¿Cuándo hay asesorías de cálculo diferencial?", "¿Cuándo hay asesorías de cálculo integral?", "¿Cuándo hay asesorías de física mecánica?", "¿Cuándo hay asesorías de álgebra lineal?", "¿Cuándo hay asesorías de lógica matemática?", "¿Cuándo hay asesorías de análisis numérico?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.309585', '2026-11-02 23:45:30.309587');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('13986157-3d29-4473-acac-8d621753d999', 'parche_inscripcion', 'Parche GensTI', '¿Necesito inscripción para asistir al Parche GensTI?', 'La información compartida del **Parche GensTI** no especifica si se requiere inscripción, reserva de cupo o algún requisito de asistencia.

Confirma estos detalles con la organización antes de asistir.

No se proporcionó un formulario de inscripción ni un canal de contacto específico del Parche.', '["¿Cómo me inscribo al Parche GensTI?", "¿Debo registrarme para las asesorías del parche?", "¿Necesito reservar un cupo en el Parche GensTI?", "¿Hay formulario de inscripción para el parche?", "¿Qué requisitos hay para asistir al Parche GensTI?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.311487', '2026-11-02 23:45:30.31149');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('b62f2b86-aaf8-4349-90bb-633630c1ac12', 'parche_costo', 'Parche GensTI', '¿Las asesorías del Parche GensTI tienen costo?', 'La información compartida no indica si las asesorías del **Parche GensTI** tienen costo.

No puedo confirmar que sean gratuitas ni indicar una tarifa. Consulta este detalle con la organización.', '["¿Cuánto cuesta asistir al Parche GensTI?", "¿El Parche GensTI es gratis?", "¿Hay que pagar las asesorías del parche?", "¿Cuál es el precio de las asesorías del Parche GensTI?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.313255', '2026-11-02 23:45:30.313258');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('a9476bb8-a381-4d71-932a-01ba765feae7', 'parche_vigencia', 'Parche GensTI', '¿Está vigente el horario del Parche GensTI?', 'El horario compartido no especifica fechas de inicio, finalización ni vigencia semestral. Confirma su disponibilidad actual con la organización antes de asistir.

El horario recibido contempla encuentros los martes y viernes, pero eso no confirma que haya una sesión en una fecha específica, durante festivos o en semanas de receso.', '["¿Todavía funciona el Parche GensTI?", "¿Hasta cuándo son las asesorías del parche?", "¿Cuándo empiezan las asesorías del Parche GensTI?", "¿Hoy hay asesorías del Parche GensTI?", "¿Mañana hay asesorías del Parche GensTI?", "¿Esta semana hay asesorías del parche?", "¿El horario del parche aplica este semestre?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.315401', '2026-11-02 23:45:30.315404');
INSERT INTO public.faq_items (id, code, category, question, answer, alternative_questions, source_url, source_name, validity_note, status, created_at, updated_at) VALUES ('02837850-880a-44aa-8fd5-aa21b1dbe4ff', 'parche_duracion', 'Parche GensTI', '¿Cuánto duran las asesorías del Parche GensTI?', 'La información recibida del **Parche GensTI** indica las horas de inicio, pero no especifica cuánto dura cada sesión ni su hora de finalización.

Los horarios de inicio compartidos son:

- Martes: 9:00 a. m. y 4:00 p. m.
- Viernes: 9:00 a. m. y 4:00 p. m.

Confirma la duración con la organización.', '["¿A qué hora terminan las asesorías del parche?", "¿Cuánto tiempo dura cada asesoría del Parche GensTI?", "¿Cuál es la duración de las sesiones del parche?"]', '', 'Información del Parche GensTI compartida para la plataforma', NULL, 'approved', '2026-11-02 23:45:30.3176', '2026-11-02 23:45:30.317603');


--
-- Data for Name: faq_documents; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.faq_documents (id, faq_id, title, file_url, created_at) VALUES ('b1febf4a-41b7-44b2-b314-f6602c213ad5', 'a35058e3-fdd3-4109-ba68-6752749bbac8', 'Realizar pago en línea', 'https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Realizar-pago-en-linea.pdf', '2026-11-02 23:45:30.243253');
INSERT INTO public.faq_documents (id, faq_id, title, file_url, created_at) VALUES ('7c3bbdfb-46cd-4600-864e-5b9bc2d58fba', 'a35058e3-fdd3-4109-ba68-6752749bbac8', 'Imprimir recibo de pago', 'https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Imprimir-recibo-de-pago.pdf', '2026-11-02 23:45:30.243261');
INSERT INTO public.faq_documents (id, faq_id, title, file_url, created_at) VALUES ('45abfec0-8497-47ad-ad25-a6c11bd75c48', 'ed8c851c-eec3-4c00-8df0-816a1cb92269', 'Realizar la inscripción de clases', 'https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Realizar-la-inscripcion-de-clases.pdf', '2026-11-02 23:45:30.250538');
INSERT INTO public.faq_documents (id, faq_id, title, file_url, created_at) VALUES ('927bf74a-4b27-43b8-9300-16db72871a90', 'ac31f8cf-786f-4f89-ad7e-e3c7aea26493', 'Consultar situación académica', 'https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Consultar-situacion-academica.pdf', '2026-11-02 23:45:30.254021');
INSERT INTO public.faq_documents (id, faq_id, title, file_url, created_at) VALUES ('c3adbc58-35c0-42fe-aefb-b9253c7692e5', 'ff6af0cb-67c2-4d54-86da-1218ffd1edd2', 'Seleccionar el número de créditos a inscribir', 'https://ucc.edu.co/SiteAssets/Lists/Preguntas%20y%20respuestas/NewForm/Seleccionar-el-numero-de-creditos-a-inscribir.pdf', '2026-11-02 23:45:30.256899');
INSERT INTO public.faq_documents (id, faq_id, title, file_url, created_at) VALUES ('461fdae5-88d1-4625-8901-eab86f78b07f', '4a80119b-48da-49ad-906f-f42056c6d061', 'Resolución de derechos pecuniarios — Ibagué', 'https://ucc.edu.co/tarifas-y-financiacion/Derechos%20Pecunarios%202024/Resolucion%20Rectoral-138-2025-Incremento%20valor%20derechos%20matricula%20y%20otros%20pecuniarios_Ibague.pdf', '2026-11-02 23:45:30.260228');


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.news (id, title, slug, excerpt, content, category, author_id, author_name, image_url, status, is_featured, published_at, created_at, updated_at) VALUES ('625129d2-e205-4b5e-93f4-c7ec76a57e6e', 'Bienvenida al nuevo portal GENSTI', 'bienvenida-al-nuevo-portal-gensti', 'Conoce las nuevas funciones del portal de Ingeniería de Sistemas.', 'El portal GENSTI estrena su módulo de noticias para compartir anuncios, eventos y novedades académicas.', 'Anuncios', '1905b0c5-67e5-4bb1-a9ef-f7556e741e46', 'Administración GENSTI', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c', 'published', true, '2026-10-15 06:17:51.490228+00', '2026-10-15 06:17:51.481355+00', '2026-10-15 06:17:51.481355+00');
INSERT INTO public.news (id, title, slug, excerpt, content, category, author_id, author_name, image_url, status, is_featured, published_at, created_at, updated_at) VALUES ('7246d2ae-7c3e-480f-9dc9-001ba07cb30b', 'Pruebas saber pro', 'pruebas-saber-pro', 'Pruebas Saber Pro Importante', 'Pruebas Saber Pro Importante', 'Anuncios', '1905b0c5-67e5-4bb1-a9ef-f7556e741e46', 'Sebastian', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXUYSDSHbjv5kmrLKULLfiZnyFhYsKyaCoPKUqoxKWNg&s=10', 'published', true, '2026-10-15 06:38:12.258579+00', '2026-10-15 06:32:46.005851+00', '2026-10-15 06:38:12.253486+00');


--
-- PostgreSQL database dump complete
--

\unrestrict Gy89QhMXN6eiCfAKK5VWcPSoRq6KAnNzXS0JKnqpVhiEYYhgbBufLjMefc7UdvP


