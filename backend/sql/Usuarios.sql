BEGIN;

-- (Opcional) Ver el tipo enum si querés confirmar:
-- SELECT t.typname, e.enumlabel
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname = 'role_enum'
-- ORDER BY e.enumsortorder;

-- 1) Gerente y Operador (password: 'secret')
INSERT INTO usuario (documento, email, password_hash, role, activo, creado_en)
VALUES
  ('20000000000', 'gerente@gmail.com',  'secret', 'gerente'::role_enum,  TRUE, NOW()),
  ('20000000001', 'operador@gmail.com', 'secret', 'operador'::role_enum, TRUE, NOW())
ON CONFLICT DO NOTHING;  -- idempotente

-- 2) 9.998 usuarios con rol "cliente" (password: 'secret')
-- documentos: 30000000001..30000009998 (11 dígitos)
-- emails: cliente00001@gmail.com .. cliente09998@gmail.com
INSERT INTO usuario (documento, email, password_hash, role, activo, creado_en)
SELECT
  (30000000000 + g)::text                                 AS documento,
  format('cliente%s@gmail.com', lpad(g::text, 5, '0'))    AS email,
  'secret'                                                AS password_hash,
  'cliente'::role_enum                                    AS role,
  TRUE                                                    AS activo,
  NOW() - ((g % 365)) * INTERVAL '1 day'                  AS creado_en
FROM generate_series(1, 9998) AS g
ON CONFLICT DO NOTHING;

-- Checks
-- SELECT role, COUNT(*) FROM usuario GROUP BY role ORDER BY role;

COMMIT;
