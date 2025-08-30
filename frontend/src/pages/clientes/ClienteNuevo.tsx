// src/pages/clientes/ClienteNuevo.tsx
/**
 * Alta de Cliente
 * - Validaciones básicas (requeridos: nombre, apellido, documento, dirección)
 * - Documento solo dígitos (6–11)
 * - Email opcional (formato válido si se completa)
 * - Spinner de guardado + toasts de éxito/error
 * - Tras crear: navega al detalle del cliente
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createCliente, type ClienteCreateBody } from "../../lib/clientes";
import {
  ArrowLeft,
  Loader2,
  Save,
  UserPlus,
  IdCard,
  Mail,
  Phone,
  MapPin,
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

export default function ClienteNuevo() {
  const nav = useNavigate();

  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  function validar(): string | null {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!apellido.trim()) return "El apellido es obligatorio.";
    if (!/^\d{6,11}$/.test(documento.trim()))
      return "El documento debe tener 6 a 11 dígitos.";
    if (!direccion.trim()) return "La dirección es obligatoria.";
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim()))
      return "El email no es válido.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    if (err) {
      toast.warn(err);
      return;
    }
    try {
      setSaving(true);
      const body: ClienteCreateBody = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento: documento.trim(),
        direccion: direccion.trim(),
      };
      if (email.trim()) body.email = email.trim();
      if (telefono.trim()) body.telefono = telefono.trim();

      const nuevo = await createCliente(body);
      toast.success("Cliente creado");
      nav(`/clientes/${nuevo.id}`);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo crear el cliente");
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
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <h1 className="text-lg font-bold">Nuevo cliente</h1>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTopWidth: 4, borderTopColor: CEL }}
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={onSubmit}
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
            <Label>Documento (solo dígitos) *</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IdCard className="h-4 w-4" />
              </span>
              <input
                value={documento}
                onChange={(e) =>
                  setDocumento(e.target.value.replace(/[^\d]/g, ""))
                }
                maxLength={11}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
                required
              />
            </div>
          </div>

          <div>
            <Label>Email (opcional)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
                placeholder="nombre@dominio.com"
              />
            </div>
          </div>

          <div>
            <Label>Teléfono (opcional)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="h-4 w-4" />
              </span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Dirección *</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950/50"
                required
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="mt-2 inline-flex gap-2">
              <button
                type="button"
                onClick={() => nav(-1)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancelar
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
                Crear cliente
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tip: política de datos / UX */}
      <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <div className="mb-1 inline-flex items-center gap-2 font-medium">
          <UserPlus className="h-4 w-4" />
          Sugerencia
        </div>
        Evitá duplicar clientes: si el documento ya está registrado, el sistema
        lo indicará.
      </div>
    </div>
  );
}
