import { useState } from "react";
import MailInput from "./Inputs/MailInput";
import PasswordInput from "./Inputs/PasswordInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      // Aquí iría la lógica de autenticación
      console.log("Login attempt:", email, password);
      
      // Simulación de login (reemplazar con tu API real)
      // await loginUser(email, password);
      
      // Redirección después del login exitoso
      // window.location.href = "/dashboard";
      
    } catch (error) {
      setErrorMsg("Credenciales incorrectas. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-base-200 select-none">
      <section className="w-full min-h-screen flex items-center justify-center bg-no-repeat bg-center"
        style={{
    backgroundImage: `url("https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg")`
  }}>
        <div className="bg-white rounded-3xl shadow-xl flex w-full max-w-5xl overflow-hidden ">
          <div className="w-full md:w-1/2 p-10 text-gray-800">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2">Iniciar sesión</h2>
              <p className="text-sm text-gray-500">
                Accede a tu cuenta musical
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <MailInput value={email} onChange={setEmail} />
              <PasswordInput value={password} onChange={setPassword} />
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="checkbox checkbox-sm" />
                  <label htmlFor="remember">Recordarme</label>
                </div>
                <a href="/forgot-password" className="text-orange-400 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <div className="flex items-center justify-start gap-2 text-sm text-gray-600">
                <span>¿No tienes una cuenta?</span>
                <a href="/signup" className="text-orange-400 hover:underline">
                  Regístrate aquí
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
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>

              {errorMsg && (
                <p className="text-red-600 text-sm text-center mt-2">
                  {errorMsg}
                </p>
              )}
            </form>
          </div>
          <div
            className={`hidden md:block md:w-1/2 bg-contain bg-center`}
            style={{ backgroundImage: `url(/static/signup.jpeg)` }}
            role="img"
            aria-label="Imagen de fondo para login"
          />
        </div>
      </section>
    </div>
  );
}