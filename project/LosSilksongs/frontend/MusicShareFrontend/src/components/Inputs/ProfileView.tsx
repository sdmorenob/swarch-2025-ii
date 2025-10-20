import React from "react";
import { useNavigate } from "react-router-dom";

interface ProfileViewProps {
  profileImage: string;
  description: string;
  posts: { id: number; imageUrl: string }[];
  numPosts: number;
  numFriends: number;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profileImage,
  description,
  posts,
  numPosts,
  numFriends,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 🔹 Espacio reservado para componente lateral */}
      <aside className="w-1/6 border-r border-gray-300 bg-white">
        {/* Aquí podrás insertar tu componente de menú o navegación */}
      </aside>

      {/*  Contenido principal */}
      <main className="flex-1 p-6">
        {/* Sección superior del perfil */}
        <div className="flex items-center justify-between border-b border-gray-300 pb-4">
          {/* Foto y descripción */}
          <div className="flex items-center space-x-6">
            <img
              src={profileImage}
              alt="Foto de perfil"
              className="w-28 h-28 rounded-full border-2 border-gray-300 object-cover"
            />

            <div>
              <p className="text-sm text-gray-700 max-w-md">{description}</p>
            </div>
          </div>

          {/* Datos a la derecha */}
          <div className="flex items-center space-x-10">
            <div className="text-center">
              <p className="text-2xl font-semibold">{numPosts}</p>
              <p className="text-sm text-gray-500">Publicaciones</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{numFriends}</p>
              <p className="text-sm text-gray-500">Amigos</p>
            </div>
            <button
              onClick={() => navigate("/editar-perfil")}
              className="border border-gray-400 px-4 py-1 rounded-md hover:bg-gray-100 transition"
            >
              Editar perfil
            </button>
          </div>
        </div>

        {/* Galería de publicaciones */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/publicacion/${post.id}`)}
              className="cursor-pointer overflow-hidden rounded-lg border border-gray-300 hover:opacity-90 transition"
            >
              <img
                src={post.imageUrl}
                alt={`Publicación ${post.id}`}
                className="w-full h-48 object-cover"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProfileView;
