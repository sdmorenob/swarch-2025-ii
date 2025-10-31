"use client";

import AdminUsersPanel from "@/app/admin/components/AdminUsersPanel";

/**
 * Página para mostrar el panel de administración de usuarios.
 * La protección de esta ruta es manejada por el `AdminLayout`.
 */
export default function AdminUsersPage() {
  // Simplemente renderizamos el panel. El layout ya ha verificado el acceso.
  return (
    <AdminUsersPanel />
  );
}