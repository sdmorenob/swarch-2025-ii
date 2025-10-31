'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/icons';
import { Eye, EyeOff } from 'lucide-react';
// --- Firebase Imports ---
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '@/lib/firebase';
// --- API Imports ---
import { registerUser, socialLogin } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Renombrado para coincidir con el backend
    name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationInput, setVerificationInput] = useState(''); // Código que el usuario ingresa
  const [userEmail, setUserEmail] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    setError('');

    if (!formData.name || !formData.last_name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, completa todos los campos');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un email válido');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (!passwordRegex.test(formData.password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');
      return false;
    }

    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // 1. Verificar si el email ya existe
        const emailCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        });

        if (!emailCheckResponse.ok) {
          const errorData = await emailCheckResponse.json();
          throw new Error(errorData.detail || 'Error al verificar el correo electrónico');
        }

        const emailCheckData = await emailCheckResponse.json();
        if (emailCheckData.exists) {
          setError('Este correo electrónico ya está registrado');
          return;
        }

        // 2. Generar código y enviarlo al backend para que lo mande por email
        const code = generateVerificationCode();
        const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/send-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, code: code }),
        });

        if (!verificationResponse.ok) {
          const errorData = await verificationResponse.json();
          throw new Error(errorData.detail || 'No se pudo enviar el código de verificación.');
        }

        setUserEmail(formData.email);
        setShowVerificationModal(true);
        setSuccess('Código de verificación enviado a tu correo.');

      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Ocurrió un error desconocido al enviar el código de verificación');
        }
        console.error('Error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleVerifyCode = async () => {
    setError('');
    setSuccess('');
    try {
      setIsSubmittingCode(true);
      // 3. Verificar el código ingresado por el usuario
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, code: verificationInput })
      });

      if (response.ok) {
        setSuccess('Código de verificación correcto. Registrando...');
        setShowVerificationModal(false);
        // 4. Si el código es correcto, registrar al usuario
        await handleRegister();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Código de verificación incorrecto o expirado');
      }
    } catch (error: any) {
      setError(error.message || 'Error al verificar el código');
      console.error('Error:', error);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Esta función ahora usa la API centralizada
  const handleRegister = async () => {
    try {
      await registerUser({
        name: formData.name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        provider: 'email'
      });
      setSuccess('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setTimeout(() => router.push('/login'), 2000); // Pequeña demora para que el usuario vea el mensaje
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
      console.error('Error al registrar el usuario:', error);
      throw error;
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    setError('');
    try {
      // 1. Iniciar sesión con el popup de Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Enviar los datos al backend para registrar/loguear
      const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ["", ""];
      const apiResponse = await socialLogin({
        name: firstName,
        email: user.email!,
        provider: 'google',
        provider_id: user.uid,
      });

      // 3. Guardar el token de nuestro backend y redirigir
      localStorage.setItem('accessToken', apiResponse.access_token);
      router.push('/dashboard');

    } catch (error: any) {
      setError(error.message || 'Error al autenticar con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-headline">Reto-Fit</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Crea una cuenta para comenzar tu viaje de fitness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nombres"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Apellidos"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="aceptaTerminos"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, aceptaTerminos: checked as boolean }))
                }
              />
              <Label htmlFor="aceptaTerminos" className="text-sm">
                Acepto los{' '}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2"
                  onClick={() => setShowTermsModal(true)}
                >
                  términos y condiciones
                </button>
              </Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Continuar'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Regístrate con Google'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-primary underline underline-offset-2">
              Iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Modal de verificación */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Verifica tu correo</CardTitle>
              <CardDescription>
                Enviamos un código de verificación a: {userEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Input
                placeholder="* * * * * *"
                maxLength={6}
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-widest"
                disabled={isSubmittingCode}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowVerificationModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerifyCode}
                  disabled={isSubmittingCode}
                >
                  {isSubmittingCode ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de términos y condiciones */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Términos y condiciones</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                Reto-Fites una plataforma enfocada en el bienestar y la superación personal, 
                donde los usuarios pueden participar en retos, registrar su progreso y compartir logros 
                relacionados con la actividad física y hábitos saludables.
              </p>
              <p>
                Cada usuario es responsable del contenido que publica, así como de su participación en 
                los retos. Reto-Fit no se hace responsable de lesiones, daños o perjuicios que 
                puedan derivarse del uso inadecuado de la aplicación o de la realización de actividades 
                físicas sin la debida precaución o supervisión profesional.
              </p>
              <p>
                Reto-Fit está diseñada para motivar y acompañar el progreso personal, no para 
                sustituir asesorías médicas o entrenamientos profesionales. Se recomienda a los usuarios 
                consultar con un especialista antes de iniciar cualquier programa de ejercicio.
              </p>
              <p>
                La plataforma y sus contenidos son propiedad de Reto-Fit. Cualquier uso no 
                autorizado, copia o distribución de los materiales está estrictamente prohibido. 
                Reto-Fit se reserva el derecho de modificar los servicios o los términos 
                de uso en cualquier momento, notificando a los usuarios registrados.
              </p>
            </div>
            <Button onClick={() => setShowTermsModal(false)}>
              Cerrar
            </Button>
          </CardContent>

          </Card>
        </div>
      )}
    </div>
  );
}