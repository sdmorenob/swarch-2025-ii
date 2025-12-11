import {
  Home,
  Search,
  MessageCircle,
  PlusCircle,
  User,
  Menu,
  Music2,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

type MainContextType = {
  user: any;
};

type Props = {
  setTheme: (theme: "cupcake" | "dark") => void;
};


interface Notification {
  type: string;
  message: string;
  from_user?: string;
}

export default function IndexLayout({ setTheme }: Props) {
  const { user } = useOutletContext<MainContextType>();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("inicio");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentTheme, setCurrentTheme] = useState<"cupcake" | "dark">(
    "cupcake"
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "cupcake"
      | "dark"
      | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "cupcake" : "dark";
    setCurrentTheme(newTheme);
    setTheme(newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const menuItems = [
    { id: "inicio", icon: Home, label: "Inicio" },
    { id: "buscar", icon: Search, label: "Buscar" },
    {
      id: "mensajes",
      icon: MessageCircle,
      label: "Mensajes",
      notification: true,
    },
    { id: "crear", icon: PlusCircle, label: "Subir Música" },
    { id: "perfil", icon: User, label: "Mi Perfil" },
  ];

  const unreadMessagesCount = notifications.length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base-100">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-base-300 flex flex-col px-4 py-6 bg-base-200 overflow-hidden">
        {/* Logo */}
        <div className="px-3 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center rotate-12 shadow-lg">
            <Music2
              size={24}
              className="text-primary-content -rotate-12"
              strokeWidth={2.5}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MusicShare
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id);
                  if (item.id === "perfil") {
                    navigate("/perfil");
                  }
                  if (item.id === "crear") {
                    // Compatibilidad con la ruta esperada por el gateway (/upload)
                    // y con la ruta interna previa (/upload-music)
                    navigate("/upload");
                  }
                  if (item.id === "mensajes") {
                    setNotifications([]);
                  }
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${
                  isActive
                    ? "bg-primary text-primary-content shadow-lg scale-[1.02]"
                    : "hover:bg-base-300 text-base-content"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-transform ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  />
                  {item.notification && unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs font-bold text-error-content animate-pulse">
                      {unreadMessagesCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-base truncate ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Botones inferiores */}
        <div className="space-y-1 flex-shrink-0 mt-4">
          <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-base-300 transition-all text-base-content">
            <Menu size={24} className="flex-shrink-0" />
            <span className="text-base font-medium truncate">Más opciones</span>
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-base-300 transition-all text-base-content"
          >
            {currentTheme === "dark" ? (
              <Sun size={24} className="flex-shrink-0" />
            ) : (
              <Moon size={24} className="flex-shrink-0" />
            )}
            <span className="text-base font-medium truncate">
              {currentTheme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-error hover:text-error-content transition-all text-base-content border-t border-base-300 pt-4 mt-2"
          >
            <LogOut size={24} className="flex-shrink-0" />
            <span className="text-base font-medium truncate">
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Área de contenido */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-base-100">
        <div className="p-8 min-w-0">
          <Outlet context={{ theme: currentTheme, user }} />
        </div>
      </main>
    </div>
  );
}
