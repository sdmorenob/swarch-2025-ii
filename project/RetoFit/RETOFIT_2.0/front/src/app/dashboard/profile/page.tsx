'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Edit, X } from 'lucide-react';
import { loginUser } from '@/lib/api';


// 1. Interfaz actualizada para usar los mismos nombres que el backend
interface UserProfile {
  nombre: string;
  apellido: string | null;
  email: string;
  edad: number | null;
  peso: number | null;
  altura: number | null;
  genero: string | null;
  nivel_condicion_fisica: string | null;
  deportes_favoritos: string | null;
  foto_perfil_url: string | null;
  
}

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [initialProfile, setInitialProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.detail || 'No se pudo cargar tu perfil.');
        }
        const data = await response.json();
        console.log("Datos recibidos del backend:", data);

        const fotoUrl = data.foto_perfil_url
          ? (data.foto_perfil_url.startsWith('http')
              ? data.foto_perfil_url
              : `${process.env.NEXT_PUBLIC_USER_API_URL}${data.foto_perfil_url}`)
          : null;
          
        // 2. Mapeamos los datos de la API a nuestro nuevo estado
        const initialData = {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.correo,
          edad: data.edad,
          peso: data.peso,
          altura: data.altura,
          genero: data.genero,
          nivel_condicion_fisica: data. nivel_condicion_fisica,
          deportes_favoritos: data.deportes_favoritos,
          foto_perfil_url: fotoUrl, // ✅ ahora seguro
          
        };
        
        setProfile(initialData);
        setInitialProfile(initialData);
      } catch (err: any) {
        if (err.message.includes('Token')) {
            localStorage.removeItem('accessToken');
            router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? null : parseFloat(value)) : value;
    setProfile(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/upload-profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir la imagen.');
      const data = await response.json();
      
      setProfile(prev => ({ ...prev, foto_perfil_url: data.file_url }));
      toast({ title: 'Éxito', description: 'Tu foto de perfil ha sido actualizada.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setImagePreview(null);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('accessToken');
    
    // 3. ¡Ahora podemos enviar el objeto 'profile' directamente!
    //    Solo quitamos los campos que no se deben editar, como el email.
    const { email, ...payload } = profile;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('No se pudo guardar tu perfil.');
      
      const result = await response.json();

      setInitialProfile(profile); // Actualizamos el estado inicial con los nuevos datos guardados
      toast({
        title: '¡Éxito!',
        description: 'Tu perfil ha sido actualizado correctamente.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      setImagePreview(null); // Salir del modo edición
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Cargando tu perfil...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">Tu Perfil</h1>
        {!isEditing && (
          <Button onClick={() => { setInitialProfile(profile); setIsEditing(true); }}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        )}
      </div>

      {isEditing ? (
        // --- MODO EDICIÓN ---
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Realiza los cambios que desees y luego guárdalos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={imagePreview || profile.foto_perfil_url || '/avatars/01.png'} alt={profile.nombre} />
                  <AvatarFallback>{profile.nombre?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                <Button type="button" variant="outline" onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir foto
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* 4. Actualizamos el 'name' de los inputs */}
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" value={profile.nombre || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" name="apellido" value={profile.apellido || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email || ''} disabled />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deportes_favoritos">Mis Deportes / Actividades Favoritas</Label>
                <Textarea id="deportes_favoritos" name="deportes_favoritos" placeholder="Ej: Correr en la montaña, levantar pesas, yoga..." value={profile.deportes_favoritos || ''} onChange={handleInputChange} className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Datos Físicos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="edad">Edad</Label>
                <Input id="edad" name="edad" type="number" value={profile.edad || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input id="peso" name="peso" type="number" step="0.1" value={profile.peso || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="altura">Altura (m)</Label>
                <Input id="altura" name="altura" type="number" step="0.01" value={profile.altura || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="genero">Género</Label>
                <Input id="genero" name="genero" value={profile.genero || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="nivel_condicion_fisica">Nivel de Condición Física</Label>
                <Input id="nivel_condicion_fisica" name="nivel_condicion_fisica" placeholder="Ej: Principiante, Intermedio, Avanzado" value={profile.nivel_condicion_fisica || ''} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setProfile(initialProfile); setIsEditing(false);setImagePreview(null); }}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      ) : (
        // --- MODO VISUALIZACIÓN ---
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-6">
                 <Avatar className="h-24 w-24">
                   <AvatarImage src={profile.foto_perfil_url || '/avatars/01.png'} alt={profile.nombre} />
                   <AvatarFallback>{profile.nombre?.charAt(0).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <div>
                   <CardTitle className="text-3xl">{profile.nombre} {profile.apellido}</CardTitle>
                   <CardDescription>{profile.email}</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
               {profile.deportes_favoritos && (
                <div className="mt-4">
                  <h4 className="font-semibold">Deportes Favoritos</h4>
                  <p className="text-sm text-muted-foreground">{profile.deportes_favoritos}</p>
                </div>
               )}
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
               <CardTitle>Datos Físicos</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderInfo("Edad", profile.edad)}
                {renderInfo("Peso", profile.peso ? `${profile.peso} kg` : null)}
                {renderInfo("Altura", profile.altura ? `${profile.altura} m` : null)}
                {renderInfo("Género", profile.genero)}
                {renderInfo("Nivel Físico", profile.nivel_condicion_fisica, "md:col-span-2")}
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function renderInfo(label: string, value: string | number | null | undefined, className?: string) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={className}>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    )
}