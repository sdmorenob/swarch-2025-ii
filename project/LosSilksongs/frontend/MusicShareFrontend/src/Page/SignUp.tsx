import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MailInput from "../components/Inputs/MailInput";
import PasswordInput from "../components/Inputs/PasswordInput";
import Toast from "../components/Toast";
import TextInput from "../components/Inputs/TextInput";

type Props = {
  theme: "cupcake" | "dark";
};

export default function SignUp({ theme }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("https://localhost/api/users/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: email,       
          password: password,
          username: user,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ message: "Cuenta creada exitosamente", type: "success" });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        let errorMessage = "Error al crear la cuenta";
        
        if (data.detail) {

          if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((err: any) => err.msg || err.message || JSON.stringify(err))
              .join(", ");
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        
        setToast({ message: errorMessage, type: "error" });
      }
    } catch (e) {
      console.log("Error en el fetch:", e);
      setToast({ message: "Error de conexión", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-base-300 select-none min-h-screen" data-theme={theme}>
      {toast && (
        <Toast message={toast.message} id={Date.now()} type={toast.type} />
      )}
      <section className="w-full min-h-screen flex items-center justify-center bg-no-repeat bg-center">
        <div className="bg-base-100 rounded-3xl shadow-xl flex w-full max-w-5xl overflow-hidden">
          <div className="w-full md:w-1/2 p-10">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2 text-base-content">
                Crear cuenta
              </h2>
              <p className="text-sm opacity-70">
                Únete a nuestra comunidad musical
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                placeholder="Usuario"
                value={user}
                onChange={setUser}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  placeholder="Nombre"
                  value={firstName}
                  onChange={setFirstName}
                />
                <TextInput
                  placeholder="Apellido"
                  value={lastName}
                  onChange={setLastName}
                />
              </div>

              <MailInput onChange={setEmail} />
              <PasswordInput onChange={setPassword} />
              
              <div className="flex items-center justify-start gap-2 text-sm">
                <span className="opacity-80">¿Ya tienes una cuenta?</span>
                <a
                  href="/login"
                  className="text-warning hover:underline font-medium"
                >
                  Inicia sesión aquí
                </a>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-warning w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </form>
          </div>
          <div
            className="hidden md:block md:w-1/2 bg-cover bg-center"
            style={{ backgroundImage: `url(/static/signup.jpeg)` }}
            role="img"
            aria-label="Imagen de fondo para registro"
          />
        </div>
      </section>
    </div>
  );
}