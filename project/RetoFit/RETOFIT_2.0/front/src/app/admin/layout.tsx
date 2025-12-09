"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BarChart3, Home, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons";
import AdminHeader from "@/app/admin/components/header"; // Header del admin

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else {
      setIsVerified(true);
    }
  }, [pathname, router]);

  // Si estamos en la página de login, no mostramos el layout del dashboard
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isVerified) {
    return <div>Verificando acceso...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="hidden border-r bg-white md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4 lg:px-6">
              <Link
                href="/admin"
                className="flex items-center gap-2 font-semibold"
              >
                <Logo className="h-6 w-6 text-blue-600" />
                <span className="text-gray-800">Admin Panel</span>
              </Link>
            </div>

            {/* Menú lateral */}
            <div className="flex-1 py-4">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-600 ${
                    pathname === "/admin"
                      ? "bg-gray-100 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  href="/admin/users"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-600 ${
                    pathname === "/admin/users"
                      ? "bg-gray-100 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Usuarios
                </Link>

                <Link
                  href="/admin/analytics"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-600 ${
                    pathname === "/admin/analytics"
                      ? "bg-gray-100 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analíticas
                </Link>

                {/* NUEVA SECCIÓN: Eventos */}
                <Link
                  href="/admin/events"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-600 ${
                    pathname === "/admin/events"
                      ? "bg-gray-100 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  Retos
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col">
          <AdminHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pt-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
