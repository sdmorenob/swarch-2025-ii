import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, setUser } from "../lib/auth";
import { apiFetch } from "../lib/api";

type UserDTO = {
  user_id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  bio?: string;
};
console.log("editProfile loaded");
export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState<UserDTO | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
    //   const navigate = useNavigate();
//   const stored = getUser<UserDTO>();
//   const [user, setLocalUser] = useState<UserDTO | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
// console.log("Fetch de usuario para editar perfil:", res);
//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await apiFetch("/users/me");
//         console.log("Fetch de usuario para editar perfil:", res);
//         if (res.ok) {
//           const data = await res.json();
//           setLocalUser(data);
//           console.log("Usuario cargado para editar perfil:", data);
//         } else if (res.status === 401) {
//           console.log("Token inválido o expirado");
//           navigate("/login");
//         } else {
//           setError("No se pudo cargar el usuario");
//         }
//       } catch {
//         setError("Error de red");
//       }
//     }

//     // si hay user almacenado en localStorage, úsalo mientras carga
//     if (stored) setLocalUser(stored);
//     load();
//   }, [navigate, stored]);
  useEffect(() => {
    async function loadUser() {
      try {
        const stored = getUser<UserDTO>();
        if (stored) {
          setLocalUser(stored); // Use stored data first
        }

        const res = await apiFetch("/users/me");
        if (res.ok) {
          const data = await res.json();
          setLocalUser(data); // Update with fresh data
          setUser(data); // Update localStorage
        } else if (res.status === 401) {
          navigate("/login");
        }
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Error al cargar usuario");
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);
  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  // Show error state
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="p-6">Cargando...</div>;
  }

  const handleChange = (k: keyof UserDTO, v: string) => {
    setLocalUser({ ...user, [k]: v });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
        bio: user.bio,
      };
      const res = await apiFetch("/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
        navigate("/profile");
      } else {
        setError(data.detail || "Error al actualizar perfil");
      }
    } catch {
      setError("Error de red");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Editar perfil</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm">Nombre</label>
          <input
            value={user.first_name || ""}
            onChange={(e) => handleChange("first_name", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Apellido</label>
          <input
            value={user.last_name || ""}
            onChange={(e) => handleChange("last_name", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Usuario</label>
          <input
            value={user.username || ""}
            onChange={(e) => handleChange("username", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            value={user.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Biografía</label>
          <textarea
            value={user.bio || ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="textarea textarea-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Imagen (URL)</label>
          <input
            value={user.profile_picture_url || ""}
            onChange={(e) => handleChange("profile_picture_url", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <button type="submit" className="btn btn-warning" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}