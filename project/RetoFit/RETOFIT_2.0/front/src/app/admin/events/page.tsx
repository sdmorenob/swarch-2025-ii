"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createAdminChallenge, getAdminChallenges, updateAdminChallenge, deleteAdminChallenge } from "@/lib/admin-api";
import { Loader2, PlusCircle, List, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = 'list' | 'create' | 'edit';

// --- CAMBIO 1: Añadir image_url a la interfaz ---
interface Challenge {
  id: number;
  name: string;
  description: string;
  type: string;
  target: number;
  unit: string;
  start_date: string;
  end_date: string;
  image_url: string; // <-- AÑADIDO
}

// --- CAMBIO 2: Añadir image_url al estado inicial ---
const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  type: "",
  target: 0,
  unit: "",
  start_date: "",
  end_date: "",
  image_url: "", // <-- AÑADIDO
};

export default function AdminEventsPage() {
  const { toast } = useToast();
  const [view, setView] = useState<View>('list');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setListIsLoading] = useState(true);

  useEffect(() => {
    if (view === 'list') {
      fetchChallenges();
    }
  }, [view]);

  const fetchChallenges = async () => {
    setListIsLoading(true);
    try {
      const data = await getAdminChallenges();
      setChallenges(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setListIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.type || formData.target <= 0) {
      toast({ title: "Error de validación", description: "Nombre, tipo y objetivo (mayor a 0) son obligatorios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      if (view === 'edit' && currentChallenge) {
        await updateAdminChallenge(currentChallenge.id, { ...formData, target: Number(formData.target) });
        toast({ title: "Éxito", description: "Reto actualizado exitosamente." });
      } else {
        await createAdminChallenge({ ...formData, target: Number(formData.target) });
        toast({ title: "Éxito", description: "Reto creado exitosamente." });
      }
      setFormData(INITIAL_FORM_STATE);
      setView('list');
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Ocurrió un error.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- CAMBIO 3: Añadir image_url al editar ---
  const handleEditClick = (challenge: Challenge) => {
    setCurrentChallenge(challenge);
    setFormData({
      name: challenge.name,
      description: challenge.description || "",
      type: challenge.type,
      target: challenge.target,
      unit: challenge.unit || "",
      start_date: challenge.start_date ? challenge.start_date.split('T')[0] : "",
      end_date: challenge.end_date ? challenge.end_date.split('T')[0] : "",
      image_url: challenge.image_url || "", // <-- AÑADIDO
    });
    setView('edit');
  };

  const handleDeleteClick = async (challengeId: number) => {
    try {
      await deleteAdminChallenge(challengeId);
      toast({ title: "Éxito", description: "Reto eliminado." });
      fetchChallenges();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (view === 'create' || view === 'edit') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{view === 'create' ? 'Crear Nuevo Reto' : 'Editar Reto'}</CardTitle>
            <CardDescription>Completa los detalles para {view === 'create' ? 'añadir un nuevo' : 'actualizar el'} reto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Reto</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              {/* --- CAMBIO 4: Añadir campo de imagen al formulario --- */}
              <div className="grid gap-2">
                <Label htmlFor="image_url">URL de la Imagen</Label>
                <Input id="image_url" name="image_url" placeholder="https://ejemplo.com/imagen.png" value={formData.image_url} onChange={handleChange} />
              </div>
              {/* --- FIN DEL CAMBIO --- */}

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Reto</Label>
                  <Select name="type" onValueChange={(value) => handleSelectChange("type", value)} value={formData.type} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps">Pasos</SelectItem>
                      <SelectItem value="distance">Distancia</SelectItem>
                      <SelectItem value="time">Tiempo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target">Objetivo (Numérico)</Label>
                  <Input id="target" name="target" type="number" value={formData.target} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input id="unit" name="unit" placeholder="Ej: pasos, km, minutos" value={formData.unit} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">Fecha de Fin</Label>
                  <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setView('list')}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {view === 'create' ? 'Crear Reto' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    }

    // Default view: list
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Retos</CardTitle>
          <CardDescription>Aquí puedes ver, editar o eliminar los retos existentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isListLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">{challenge.name}</TableCell>
                    <TableCell>{challenge.type}</TableCell>
                    <TableCell>{challenge.target} {challenge.unit}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditClick(challenge)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el reto.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(challenge.id)}>Continuar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {challenges.length === 0 && !isListLoading && (
            <p className="text-center text-muted-foreground py-8">No se encontraron retos.</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gestión de Retos</h1>
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setView('list')} variant={view === 'list' ? 'default' : 'outline'}>
          <List className="mr-2 h-4 w-4" />
          Ver Retos
        </Button>
        <Button onClick={() => { setFormData(INITIAL_FORM_STATE); setView('create'); }} variant={view === 'create' ? 'default' : 'outline'}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Reto
        </Button>
      </div>
      {renderContent()}
    </div>
  );
}