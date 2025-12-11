import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "./Page/SignUp";
import Login from "./Page/Login";
import MainLayout from "./layout/MainLayout";
import IndexLayout from "./layout/IndexLayout";
import ExampleProfile from "./components/ExampleProfile";
import EditProfile from "./Page/EditProfile";
import UploadMusic from "./layout/UploadMusic";
import { ProfileFeed } from "./components/ProfileFeed";

function App() {
  const [theme, setTheme] = useState<"cupcake" | "dark">("cupcake");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "cupcake"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div data-theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignUp theme={theme} />} />
          <Route path="/login" element={<Login theme={theme} />} />
          <Route path="/" element={<MainLayout/>}>
            <Route element={<IndexLayout setTheme={setTheme} />}>
              <Route index element={<> {/* index: no hijo, IndexLayout mostrará su contenido por defecto */} </>} />
              <Route path="/perfil" element={<ExampleProfile />} />
              <Route path="/editar-perfil" element={<EditProfile />} />
              <Route path="/post" element={<ProfileFeed />} />
              {/*
                Soportamos ambas rutas por compatibilidad con el gateway y enlaces existentes.
                /upload fue usado por el SSR previo y /upload-music es el menú actual.
              */}
              <Route path="/upload" element={<UploadMusic />} />
              <Route path="/upload-music" element={<UploadMusic />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
