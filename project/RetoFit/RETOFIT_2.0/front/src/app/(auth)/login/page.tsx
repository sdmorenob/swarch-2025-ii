// En firefront/src/app/(auth)/login/page.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons'; 
import { Loader2 } from 'lucide-react';
import { loginUser, socialLogin } from '@/lib/api';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Usamos la función centralizada para hacer la llamada a la API
      const data = await loginUser(email, password);

      // 2. Si es exitosa, guardamos el token y redirigimos
      if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
        router.push('/dashboard');
      }

    } catch (err: any) {
      // El error que viene de la API ya está formateado
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setIsLoading(true);

    if (!forgotPasswordEmail) {
      setForgotPasswordError('Por favor, ingresa tu correo electrónico.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      // Por seguridad, no revelamos si el correo existe.
      // El backend debería manejar el error 401 sin enviarlo al front.
      // Asumimos que la petición se procesó.
      setForgotPasswordSuccess('Si existe una cuenta, recibirás un enlace para restablecer tu contraseña.');
      setForgotPasswordEmail('');
      setTimeout(() => setShowForgotPasswordModal(false), 3000);

    } catch (err: any) {
      // Este error es para problemas de red, no para "usuario no encontrado"
      setForgotPasswordError(err.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Iniciar sesión con el popup de Google
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Enviar los datos al backend para registrar/loguear usando la función centralizada
      const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ["", ""];
      const apiResponse = await socialLogin({
        name: firstName,
        email: user.email!,
        provider: 'google',
        provider_id: user.uid, // <-- AÑADE ESTA LÍNEA
      });

      // 3. Guardar el token de nuestro backend y redirigir
      localStorage.setItem('accessToken', apiResponse.access_token);
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error durante el inicio de sesión con Google.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Botón centrado encima del card */}
        <div className="mb-4 text-center">
          <Link href="/">
            <Button 
              variant="outline" 
              className="shadow-md hover:shadow-lg transition-all border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              ¿Qué es Reto-Fit?
            </Button>
          </Link>
        </div>

        <Card className="mx-auto w-full">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Logo className="h-8 w-8 text-orange-500" />
              <CardTitle className="text-2xl font-headline">Reto-Fit</CardTitle>
            </div>
            <CardDescription>
              Ingresa tu correo para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="ml-auto inline-block text-sm underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              Iniciar con Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Modal para Olvidé mi Contraseña */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Restablecer Contraseña</CardTitle>
              <CardDescription>
                Ingresa el correo electrónico asociado a tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Correo electrónico</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="m@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                />
              </div>
              {forgotPasswordError && <p className="text-sm text-red-500">{forgotPasswordError}</p>}
              {forgotPasswordSuccess && <p className="text-sm text-green-500">{forgotPasswordSuccess}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setShowForgotPasswordModal(false)}>
                  Cancelar
                </Button>
                <Button className="w-full" onClick={handleForgotPassword} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Enlace'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}