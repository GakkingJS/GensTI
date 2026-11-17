--
-- PostgreSQL database dump
--

\restrict z8vNNIKTRcBlFDUtIr6U3r8Dp6qZHS4a68EANmK9m7iAdRT9JS7RpkfmqrycXuo

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
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.permissions (id, code) VALUES (1, 'news.view');
INSERT INTO public.permissions (id, code) VALUES (2, 'news.create');
INSERT INTO public.permissions (id, code) VALUES (3, 'news.edit');
INSERT INTO public.permissions (id, code) VALUES (4, 'news.delete');
INSERT INTO public.permissions (id, code) VALUES (5, 'events.view');
INSERT INTO public.permissions (id, code) VALUES (6, 'events.create');
INSERT INTO public.permissions (id, code) VALUES (7, 'events.edit');
INSERT INTO public.permissions (id, code) VALUES (8, 'events.delete');
INSERT INTO public.permissions (id, code) VALUES (9, 'events.register');
INSERT INTO public.permissions (id, code) VALUES (10, 'posts.create');
INSERT INTO public.permissions (id, code) VALUES (11, 'posts.moderate');
INSERT INTO public.permissions (id, code) VALUES (12, 'posts.delete');
INSERT INTO public.permissions (id, code) VALUES (13, 'pqr.create');
INSERT INTO public.permissions (id, code) VALUES (14, 'pqr.manage');
INSERT INTO public.permissions (id, code) VALUES (15, 'ai.use');
INSERT INTO public.permissions (id, code) VALUES (16, 'users.manage');
INSERT INTO public.permissions (id, code) VALUES (17, 'roles.manage');
INSERT INTO public.permissions (id, code) VALUES (18, 'calendar.view');
INSERT INTO public.permissions (id, code) VALUES (19, 'calendar.manage');
INSERT INTO public.permissions (id, code) VALUES (20, 'calendar.publish');
INSERT INTO public.permissions (id, code) VALUES (21, 'events.manage');
INSERT INTO public.permissions (id, code) VALUES (22, 'community_posts.create');
INSERT INTO public.permissions (id, code) VALUES (23, 'community_posts.moderate');
INSERT INTO public.permissions (id, code) VALUES (24, 'tbog.manage');
INSERT INTO public.permissions (id, code) VALUES (25, 'community_highlights.manage');
INSERT INTO public.permissions (id, code) VALUES (26, 'users.delete');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.roles (id, name) VALUES (1, 'student');
INSERT INTO public.roles (id, name) VALUES (2, 'professor');
INSERT INTO public.roles (id, name) VALUES (3, 'admin');
INSERT INTO public.roles (id, name) VALUES (4, 'superadmin');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: gensti_user
--

INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 1);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 1);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 1);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 1);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 2);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 2);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 2);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 3);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 3);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 3);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 4);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 4);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 5);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 5);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 5);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 5);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 6);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 6);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 6);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 7);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 7);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 7);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 8);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 8);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 11);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 11);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 11);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 12);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 12);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 14);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 14);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (2, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 16);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 16);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 17);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 17);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 18);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 19);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 20);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 21);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 22);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 23);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 23);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 24);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 24);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 25);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 25);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 26);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gensti_user
--

SELECT pg_catalog.setval('public.permissions_id_seq', 26, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gensti_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict z8vNNIKTRcBlFDUtIr6U3r8Dp6qZHS4a68EANmK9m7iAdRT9JS7RpkfmqrycXuo


