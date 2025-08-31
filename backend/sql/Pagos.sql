BEGIN;

-- CTE: empareja los primeros 10.000 clientes con generate_series 1..10000
WITH cte AS (
  SELECT c.id AS cliente_id,
         ROW_NUMBER() OVER (ORDER BY c.id) AS rn
  FROM cliente c
),
src AS (
  SELECT cte.cliente_id,
         g AS n,
         -- Período de referencia: mes actual - (n % 12) meses
         (date_trunc('month', NOW()) - ((g % 12) * INTERVAL '1 month'))::date AS periodo_date
  FROM cte
  JOIN generate_series(1, 10000) AS g ON g = cte.rn
),
rows AS (
  SELECT
    s.cliente_id,
    -- Fecha del pago es "hoy - (n % 30) días"
    NOW() - ((s.n % 30)) * INTERVAL '1 day'          AS fecha,
    -- Monto base variable para diferenciar
    (15000.00 + (s.n % 6) * 500)::numeric(12,2)      AS monto,
    'ARS'::text                                       AS moneda,
    -- Método
    CASE WHEN (s.n % 2) = 0 THEN 'efectivo' ELSE 'transferencia' END AS metodo,
    -- Estado:
    -- efectivo => confirmado
    -- transferencia => en_revision (algunos anulado/pendiente según n)
    CASE
      WHEN (s.n % 2) = 0 THEN 'confirmado'
      WHEN (s.n % 5) = 0 THEN 'anulado'
      WHEN (s.n % 3) = 0 THEN 'en_revision'
      ELSE 'pendiente'
    END AS estado,
    EXTRACT(YEAR FROM s.periodo_date)::int  AS periodo_year,
    EXTRACT(MONTH FROM s.periodo_date)::int AS periodo_month,
    -- cada 7º es adelantado
    ((s.n % 7) = 0) AS es_adelantado,
    'Servicio de Internet'::text            AS concepto,
    format('Pago demo #%s', s.n)            AS descripcion,
    -- Comprobante solo para transferencias
    CASE
      WHEN (s.n % 2) = 1
      THEN format('uploads/comprobantes/%s/%s/%s.jpg',
                  s.cliente_id,
                  EXTRACT(YEAR FROM NOW())::int,
                  lpad(s.n::text, 8, '0'))
    END AS comprobante_path
  FROM src s
),
ins AS (
  INSERT INTO pago
    (cliente_id, fecha, monto, moneda, metodo, estado,
     periodo_year, periodo_month, es_adelantado,
     concepto, descripcion,
     comprobante_path, recibo_num, recibo_pdf_path, recibo_snapshot_json, creado_en)
  SELECT
    r.cliente_id,
    r.fecha,
    r.monto,
    'ARS',
    r.metodo::metodo_pago_enum,
    r.estado::estado_pago_enum,
    r.periodo_year,
    r.periodo_month,
    r.es_adelantado,
    r.concepto,
    r.descripcion,
    r.comprobante_path,
    -- recibo para confirmados: REC-YYYY-###### (secuencial por año)
    CASE
      WHEN r.estado = 'confirmado' THEN
        format('REC-%s-%s',
               r.periodo_year,
               lpad(ROW_NUMBER() OVER (PARTITION BY r.periodo_year ORDER BY r.cliente_id)::text, 6, '0'))
      ELSE NULL
    END AS recibo_num,
    NULL,  -- recibo_pdf_path (lo generará la API real)
    NULL,  -- recibo_snapshot_json
    NOW()
  FROM rows r
  RETURNING 1
)
SELECT COUNT(*) AS inserted_rows FROM ins;

COMMIT;
