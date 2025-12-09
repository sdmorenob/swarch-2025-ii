import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Target, TrendingUp, Activity, Award } from 'lucide-react';

// Forzar Server-Side Rendering en cada request
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const teamMembers = [
    {
      name: 'Desarrollador 1',
      role: 'Full Stack Developer',
      photo: '/images/andresfoto.jpeg',
    },
    {
      name: 'Desarrollador 2',
      role: 'Full stack Developer',
      photo: '/images/fotoyo.jpeg',
    },
    {
      name: 'Desarrollador 3',
      role: 'Full stack Developer',
      photo: '/images/daniel.jpeg',
    },
    {
      name: 'Desarrollador 4',
      role: 'Full stack Developer',
      photo: '/images/cristianfoto.jpeg',
    },
    {
      name: 'Desarrollador 5',
      role: 'Full stack Developer',
      photo: '/images/andersonMFoto.jpeg',
    },
    {
      name: 'Desarrollador 6',
      role: 'Full stack Developer',
      photo: '/images/andersonFoto.jpeg',
    },
  ];

  const features = [
    {
      icon: Trophy,
      title: 'Desafíos Personalizados',
      description: 'Crea y participa en retos de fitness adaptados a tus objetivos personales.',
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Conéctate con otros usuarios, comparte tu progreso y motiva a la comunidad.',
    },
    {
      icon: Target,
      title: 'Seguimiento de Metas',
      description: 'Monitorea tu progreso en tiempo real y alcanza tus objetivos de fitness.',
    },
    {
      icon: TrendingUp,
      title: 'Estadísticas Detalladas',
      description: 'Analiza tu rendimiento con gráficos y métricas personalizadas.',
    },
    {
      icon: Activity,
      title: 'Registro de Actividades',
      description: 'Registra tus entrenamientos, carreras y actividades físicas diarias.',
    },
    {
      icon: Award,
      title: 'Sistema de Logros',
      description: 'Gana puntos y desbloquea logros conforme avanzas en tus retos.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">Reto-Fit</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#features" className="text-sm font-medium hover:text-orange-500 transition-colors">
              Funcionalidades
            </a>
            <a href="#team" className="text-sm font-medium hover:text-orange-500 transition-colors">
              Equipo
            </a>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-orange-500 hover:bg-orange-600">Comenzar</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-20 md:px-6 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Transforma tu Estilo de Vida con{' '}
            <span className="text-orange-500">Reto-Fit</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 md:text-xl">
            La plataforma definitiva para crear retos de fitness, compartir tu progreso 
            y alcanzar tus metas junto a una comunidad activa y motivada.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                Únete Ahora
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Conoce Más
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              ¿Qué es Reto-Fit?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Una plataforma integral que te ayuda a mantenerte activo, alcanzar tus metas 
              y conectar con personas que comparten tu pasión por el fitness.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-orange-500 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-orange-100 p-3">
                        <Icon className="h-6 w-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="bg-gray-50 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Nuestro Equipo
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Conoce a las personas detrás de Reto-Fit
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative h-64 w-full">
                      <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="font-bold text-lg">{member.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{member.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-20 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            ¿Listo para Comenzar tu Transformación?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Únete a miles de usuarios que ya están alcanzando sus metas con Reto-Fit
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 bg-orange-500 hover:bg-orange-600">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6 text-orange-500" />
              <span className="font-bold">Reto-Fit</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 Reto-Fit. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
