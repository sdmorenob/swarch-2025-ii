import { useState } from "react";
import MailInput from "./Inputs/MailInput";
import PasswordInput from "./Inputs/PasswordInput";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes enviar los datos al backend
    const payload = {
      email,
      password,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      second_last_name: secondLastName || null,
      username,
      date_of_birth: dateOfBirth,
      gender: gender || null,
    };
    console.log(payload);
    // Realiza la petición al backend aquí
  };

  return (
    <div className="bg-base-200 select-none">
      <section
        className="w-full min-h-screen flex items-center justify-center bg-no-repeat bg-center"
        style={{
          backgroundImage: `url("https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg")`,
        }}
      >
        <div className="bg-white rounded-3xl shadow-xl flex w-full max-w-5xl overflow-hidden">
          <div className="w-full md:w-1/2 p-10 text-gray-800">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2">Crear cuenta</h2>
              <p className="text-sm text-gray-500">
                Únete a nuestra comunidad musical
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <MailInput value={email} onChange={setEmail} />
              <PasswordInput value={password} onChange={setPassword} />
              <input
                type="text"
                placeholder="Nombre"
                className="input input-bordered w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Segundo nombre (opcional)"
                className="input input-bordered w-full"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Apellido"
                className="input input-bordered w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Segundo apellido (opcional)"
                className="input input-bordered w-full"
                value={secondLastName}
                onChange={(e) => setSecondLastName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Nombre de usuario"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="date"
                placeholder="Fecha de nacimiento"
                className="input input-bordered w-full"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
              <select
                className="input input-bordered w-full"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Selecciona género (opcional)</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              <div className="flex items-center justify-start gap-2 text-sm text-gray-600">
                <span>¿Ya tienes una cuenta?</span>
                <a href="/login" className="text-orange-400 hover:underline">
                  Inicia sesión aquí
                </a>
              </div>
              <button type="submit" className="btn btn-warning w-full ">
                Crear Cuenta
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
          />
        </div>
      </section>
    </div>
  );
}