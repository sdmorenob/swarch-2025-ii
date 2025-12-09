"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_API_URL}/login/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // El error puede ser un string o un objeto con más detalles
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : "Credenciales incorrectas o no tienes permiso de administrador.";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Guardamos el token en localStorage. En producción, es más seguro usar cookies HttpOnly.
      localStorage.setItem("admin_token", data.access_token);
      
      // Redirigimos al dashboard de admin
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <Logo className="mx-auto h-10 w-10 text-blue-600" />
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Ingresa tus credenciales de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Iniciar Sesión</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
