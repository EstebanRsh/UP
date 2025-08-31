---

# docs/PAGOS.md (nuevo, acorde al documento acordado)

```md
# Pagos — Diseño funcional/técnico (MVP)

## Objetivo

Registrar **pagos en efectivo y transferencias**, adjuntar **comprobantes** (solo transferencias) y emitir **recibos PDF** al **confirmar**.  
Cliente: puede ver/descargar **sus** pagos/recibos.  
Operador/Gerente: registran, revisan, confirman; **Gerente** puede **anular** confirmados y **regenerar PDF** (opcional).

## Estados y flujo

- Estados: `pendiente → (transferencia: en_revision) → confirmado → anulado`.
- Efectivo: **se confirma al registrar** ⇒ genera `recibo_num` y PDF.
- Transferencia: registrar (+comprobante) ⇒ `en_revision` ⇒ confirmar ⇒ PDF.
- Anulación:
  - Requiere **motivo**.
  - Confirmados: **solo Gerente**.

## Datos mínimos

- `cliente_id`, `fecha` (default now), `monto` (>0, ARS), `metodo` (`efectivo|transferencia`),
- `periodo_year`, `periodo_month` (YYYY-MM), `es_adelantado` (sí a períodos futuros),
- `concepto` (obligatorio), `descripcion` (opcional).
- Transferencia: `comprobante` (PDF/JPG/PNG, máx **10 MB**).

## Recibo PDF

- Se emite **al confirmar**: `REC-YYYY-######` (reinicia por año).
- Plantilla HTML (Jinja) → PDF (wkhtmltopdf/Chromium headless por defecto).
- Guardado en `uploads/recibos/<año>/<mes>/REC-...__<apellido>-<nombre>__YYYY-MM.pdf`.
- Persistir `recibo_snapshot_json` para consistencia histórica.
- **Regenerar (solo Gerente)**: vuelve a renderizar desde snapshot.

## Archivos

- **Comprobantes**: `uploads/comprobantes/<cliente_id>/<año>/<hash>.<ext>`  
  (Guardar nombre original como metadato para UI).
- **Recibos**: ver arriba. Descarga **autenticada**.

## Validaciones

- `monto > 0`, `periodo_month ∈ [1..12]`.
- Transferencia **requiere** `comprobante`.
- Confirmar solo desde `pendiente` (efectivo) o `en_revision` (transferencia).
- Editar:
  - Antes de confirmar: permitido (monto, período, concepto, método, etc.).
  - Confirmado: **solo `descripcion`**.

## Endpoints (borrador de contrato de interfaz)

- `POST /pagos/`
  - Efectivo: JSON (confirma en el acto, retorna `recibo_num` + `recibo_pdf_url`).
  - Transferencia: `multipart/form-data` con `comprobante` (queda `en_revision`).
- `PUT /pagos/{id}/confirmar` → asigna `recibo_num`, genera PDF.
- `PUT /pagos/{id}` → actualizar (reglas según estado).
- `DELETE /pagos/{id}` → anular con `motivo`.
- `GET /pagos/{id}` → detalle (links autenticados a comprobante/recibo).
- `POST /pagos/search` → paginación/filtros (fecha, estado, método, cliente, monto).
- `GET /pagos/{id}/recibo.pdf` → descarga autenticada.
- `GET /pagos/{id}/comprobante` → descarga autenticada.
- (Opcional) `POST /pagos/{id}/comprobante` → subida por cliente si `en_revision`.

## Seguridad

- `require_roles` para operador/gerente (gestión completa).
- `cliente` solo ve/descarga **sus** pagos/recibos.
- Rutas de archivos **no públicas**.

## .env
```
