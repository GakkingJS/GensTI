-- GENSTI: usuarios y permisos iniciales
-- Este script se ejecuta solo durante la primera inicialización del volumen.

CREATE ROLE gensti_user LOGIN PASSWORD '8C0PIfJnPhb/IPIK92kfW2HdrzamabYQfK9wjLr6nhI=';
CREATE ROLE gensti_app LOGIN PASSWORD 'GNxFUoPm7oYjbyu3Hzmi3aerrZGogGzEYExA93AQnHk=';

GRANT CONNECT ON DATABASE gensti TO gensti_user;
GRANT CONNECT ON DATABASE gensti TO gensti_app;

ALTER DATABASE gensti OWNER TO gensti_user;

GRANT USAGE ON SCHEMA public TO gensti_user;
GRANT USAGE ON SCHEMA public TO gensti_app;

ALTER SCHEMA public OWNER TO gensti_user;
