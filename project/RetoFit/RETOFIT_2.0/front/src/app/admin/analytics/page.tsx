'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AnalyticsData {
  gender_distribution: Record<string, number>;
  fitness_level_distribution: Record<string, number>;
  average_stats: {
    age: number;
    weight: number;
    height: number;
  };
  top_sports: Record<string, number>;
}


const StatCard = ({ title, value, unit = '' }: { title: string; value: string | number; unit?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </div>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics/users');
        if (!response.ok) {
          throw new Error('No se pudieron cargar las analíticas.');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Ocurrió un error desconocido.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Cargando analíticas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="text-center">No se encontraron datos de analíticas.</div>;
  }

  const genderData = Object.entries(analytics.gender_distribution).map(([name, value]) => ({ name, value }));
  const fitnessData = Object.entries(analytics.fitness_level_distribution).map(([name, value]) => ({ name, value }));
  const sportsData = Object.entries(analytics.top_sports).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-headline">Analíticas de Usuarios</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Edad Promedio" value={analytics.average_stats.age} unit="años" />
        <StatCard title="Peso Promedio" value={analytics.average_stats.weight} unit="kg" />
        <StatCard title="Altura Promedio" value={analytics.average_stats.height} unit="m" />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Género</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nivel de Condición Física</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fitnessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Usuarios" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Deportes Favoritos</CardTitle>
          <CardDescription>
            Basado en las actividades más mencionadas por los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <ResponsiveContainer width="100%" height={300}>
              <BarChart layout="vertical" data={sportsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Menciones" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}