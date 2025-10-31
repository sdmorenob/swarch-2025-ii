"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/admin-api";
import { Users, CalendarDays, Loader2 } from "lucide-react";

interface Stats {
  total_users: number;
  total_challenges: number;
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido de nuevo!</h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen rápido del estado de la plataforma.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="md:col-span-2 lg:col-span-4 flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-red-500 md:col-span-2 lg:col-span-4">{error}</p>
        ) : (
          <>
            <StatCard title="Usuarios Totales" value={stats?.total_users ?? 0} icon={Users} />
            <StatCard title="Retos Creados" value={stats?.total_challenges ?? 0} icon={CalendarDays} />
          </>
        )}
      </div>

      {/* Aquí podrías añadir más componentes en el futuro, como gráficos, etc. */}
    </div>
  );
}