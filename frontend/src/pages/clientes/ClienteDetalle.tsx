// src/pages/clientes/ClienteDetalle.tsx
/**
 * Detalle de Cliente + Editar
 * - Acciones únicas abajo (evita duplicados).
 * - Al guardar: si email/telefono quedan vacíos → manda `null` para limpiar.
 * - El resto de campos vacíos se omiten (no se tocan).
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCliente,
  updateCliente,
  type ClienteDetail,
  type ClienteEstado,
} from "../../lib/clientes";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Save,
  X,
  User,
  Mail,
  Phone,
  IdCard,
  MapPin,
  BadgeCheck,
} from "lucide-react";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

function Label({ children }: { children: string }) {
  return (
    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {children}
    </span>
  );
}

export default function ClienteDetalle() {
  const { id } = useParams();
  const cid = Number(id || "0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ClienteDetail | null>(null);
  const [edit, setEdit] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState<ClienteEstado>("activo");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const c = await getCliente(cid);
        if (!alive) return;
        setData(c);
        setNombre(c.nombre || "");
        setApellido(c.apellido || "");
        setDocumento(c.documento || "");
        setEmail(c.email || "");
        setTelefono(c.telefono || "");
        setDireccion(c.direccion || "");
        setEstado(c.estado || "activo");
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar el cliente");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cid]);

  const titulo = useMemo(
    () =>
      data
        ? data.apellido
          ? `${data.apellido}, ${data.nombre}`
          : data.nombre
        : "Cliente",
    [data]
  );

  function resetForm() {
    if (!data) return;
    setNombre(data.nombre || "");
    setApellido(data.apellido || "");
    setDocumento(data.documento || "");
    setEmail(data.email || "");
    setTelefono(data.telefono || "");
    setDireccion(data.direccion || "");
    setEstado(data.estado || "activo");
  }

  function validar(): string | null {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!apellido.trim()) return "El apellido es obligatorio.";
    if (documento && !/^\d{6,11}$/.test(documento))
      return "El documento debe tener 6 a 11 dígitos.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return "El email no es válido.";
    return null;
  }

  // arma body: vacíos omitidos, pero email/telefono vacíos → null para limpiar
  function buildBody() {
    const b: Record<string, unknown> = {};
    const n = nombre.trim();
    const a = apellido.trim();
    const d = documento.trim();
    const e = email.trim();
    const t = telefono.trim();
    const dir = direccion.trim();

    if (n) b.nombre = n;
    if (a) b.apellido = a;
    if (d) b.documento = d;
    if (email === "") b.email = null;
    else if (e) b.email = e;
    if (telefono === "") b.telefono = null;
    else if (t) b.telefono = t;
    if (dir) b.direccion = dir;
    if (estado) b.estado = estado;
    return b;
  }

  async function onGuardar() {
    const err = validar();
    if (err) {
      toast.warn(err);
      return;
    }
    try {
      setSaving(true);
      await updateCliente(cid, buildBody());
      toast.success("Cliente actualizado");
      const c = await getCliente(cid);
      setData(c);
      setEdit(false);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={-1 as any}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-lg font-bold">{titulo}</h1>
          {data?.nro_cliente && (
            <span className="rounded-md border px-2 py-0.5 text-xs dark:border-slate-700">
              #{data.nro_cliente}
            </span>
          )}
          {data?.estado && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                data.estado === "activo"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
              }`}
            >
              <BadgeCheck className="h-3.5 w-3.5" /> {data.estado}
            </span>
          )}
        </div>

        {!edit && (
          <button
            onClick={() => setEdit(true)}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"
            title="Editar"
          >
            <Pencil className="h-4 w-4" /> Editar
          </button>
        )}
      </div>

      {/* Card principal */}
      <div
        className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTopWidth: 4, borderTopColor: CEL }}
      >
        {loading && (
          <div className="grid h-40 place-items-center">
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 dark:text-slate-200">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          </div>
        )}

        {!loading && data && !edit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Nombre</Label>
              <div className="mt-1 inline-flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span>{data.nombre}</span>
              </div>
            </div>
            <div>
              <Label>Apellido</Label>
              <div className="mt-1">{data.apellido || "-"}</div>
            </div>
            <div>
              <Label>Documento</Label>
              <div className="mt-1 inline-flex items-center gap-2">
                <IdCard className="h-4 w-4 text-slate-400" />
                <span>{data.documento || "-"}</span>
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="mt-1 inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{data.email || "-"}</span>
              </div>
            </div>
            <div>
              <Label>Teléfono</Label>
              <div className="mt-1 inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{data.telefono || "-"}</span>
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Dirección</Label>
              <div className="mt-1 inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{data.direccion || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {!loading && data && edit && (
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              onGuardar();
            }}
          >
            <div>
              <Label>Nombre *</Label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
                required
              />
            </div>
            <div>
              <Label>Apellido *</Label>
              <input
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
                required
              />
            </div>
            <div>
              <Label>Documento (solo dígitos)</Label>
              <input
                value={documento}
                onChange={(e) =>
                  setDocumento(e.target.value.replace(/[^\d]/g, ""))
                }
                maxLength={11}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Dirección</Label>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as ClienteEstado)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            {/* Acciones únicas */}
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="mt-2 inline-flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setEdit(false);
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white shadow-sm disabled:opacity-60"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
                  }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
