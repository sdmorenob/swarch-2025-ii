"use client";

import { useState, useEffect } from 'react';
import { getAdminUsersData, updateUserStatus, deleteAdminUser, createAdminUser } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';

// Tipos para los datos que esperamos de la API
interface UserActionLinks {
  view_details: string;
  suspend?: string | null;
  reactivate?: string | null;
  delete: string;
}

interface User {
  id: number;
  email: string;
  status: 'active' | 'suspended';
  created_at: string; // Cambiado de last_login a created_at para coincidir con la API
  _actions: UserActionLinks;
}

interface UserStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
}

interface AdminUserData {
  stats: UserStats;
  users: User[];
}

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-gray-800 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-400">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default function AdminUsersPanel() {
  const [data, setData] = useState<AdminUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        const result = await getAdminUsersData();
        console.log(result)
        setData(result);
      } catch (err: any) {
        console.log("Error: ", err)
        setError(err.message || 'Error al cargar los datos de usuarios.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetchData = async () => {
    try {
      setLoading(true);
      const result = await getAdminUsersData();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al recargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: 'active' | 'suspended') => {
    try {
      await updateUserStatus(userId, newStatus);
      // Actualizar el estado localmente para reflejar el cambio instantáneamente
      setData(prevData => {
        if (!prevData) return null;
        const updatedUsers = prevData.users.map(user => 
          user.id === userId ? { ...user, status: newStatus, _actions: {
            ...user._actions,
            suspend: newStatus === 'suspended' ? null : user._actions.suspend,
            reactivate: newStatus === 'active' ? null : user._actions.reactivate,
          } } : user
        );
        // Recalcular estadísticas
        const active_users = updatedUsers.filter(u => u.status === 'active').length;
        const suspended_users = updatedUsers.filter(u => u.status === 'suspended').length;
        return { ...prevData, users: updatedUsers, stats: { ...prevData.stats, active_users, suspended_users } };
      });
    } catch (err: any) {
      setActionError(`Error al cambiar el estado: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    try {
      await deleteAdminUser(userId);
      // Actualizar el estado localmente
      setData(prevData => {
        if (!prevData) return null;
        const updatedUsers = prevData.users.filter(user => user.id !== userId);
        const active_users = updatedUsers.filter(u => u.status === 'active').length;
        const suspended_users = updatedUsers.filter(u => u.status === 'suspended').length;
        return { ...prevData, users: updatedUsers, stats: { ...prevData.stats, total_users: prevData.stats.total_users - 1, active_users, suspended_users } };
      });
    } catch (err: any) {
      setActionError(`Error al eliminar el usuario: ${err.message}`);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget) as any;
    const formDataObject = Object.fromEntries(formData.entries()) as { email: string, password?: string };
    // Derivamos un 'name' a partir del email, ya que el backend lo requiere.
    const nameFromEmail = formDataObject.email.split('@')[0];
    const newUser = { ...formDataObject, name: nameFromEmail };

    try {
      await createAdminUser(newUser);
      setCreateUserOpen(false); // Cierra el modal
      refetchData(); // Recarga todos los datos para ver el nuevo usuario
    } catch (err: any) {
      setActionError(`Error al crear usuario: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p>No se encontraron datos.</p>;

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <CreateUserDialog isOpen={isCreateUserOpen} onOpenChange={setCreateUserOpen} onSubmit={handleCreateUser} />
      </div>

      {/* Sección de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total de Usuarios" value={data.stats.total_users} />
        <StatCard title="Usuarios Activos" value={data.stats.active_users} />
        <StatCard title="Usuarios Suspendidos" value={data.stats.suspended_users} />
      </div>

      {actionError && <p className="text-red-500 mb-4">{actionError}</p>}

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Registrado</th>
              <th className="py-2 px-4 text-left">Estado</th>
              <th className="py-2 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700">
                <td className="py-2 px-4 text-blue-400">{user.email || '—'}</td>
                <td className="py-2 px-4 text-gray-400 text-sm">{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-2 px-4 space-x-2">
                  {user.status === 'active' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">Suspender</Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Seguro que quieres suspender a {user.email}?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleStatusChange(user.id, 'suspended')}>Suspender</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  )}
                  {user.status === 'suspended' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-black">Reactivar</Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Seguro que quieres reactivar a {user.email}?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleStatusChange(user.id, 'active')}>Reactivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Eliminar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar a este usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción es irreversible y eliminará permanentemente al usuario <span className="font-bold">{user.email}</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.email)}>Eliminar Usuario</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente para el modal de creación de usuario
function CreateUserDialog({ isOpen, onOpenChange, onSubmit }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Crear Usuario</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" name="email" type="email" className="col-span-3 bg-gray-700 border-gray-600" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Contraseña</Label>
            <Input id="password" name="password" type="password" className="col-span-3 bg-gray-700 border-gray-600" required />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Crear Usuario</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}