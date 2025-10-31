// src/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // El nombre que se mostrará en el formulario de inicio de sesión (opcional)
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Llama a tu endpoint de login del auth-service
          const res = await fetch("http://127.0.0.1:8080/api/auth", { // <-- Tu puerto 8001
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { "Content-Type": "application/json" }
          })

          const data = await res.json()

          if (!res.ok || !data) {
            console.error("Error de credenciales:", data.detail || "Error desconocido");
            return null
          }

          // Si tu API devuelve el token Y el usuario (Paso 1)
          // `data.user` ya tendrá { id, name, email }
          // También guardamos el token para futuras llamadas a la API
          const userWithToken = {
             ...data.user,
             accessToken: data.access_token
          };

          return userWithToken

        } catch (e) {
          console.error("Error en authorize:", e);
          return null
        }
      }
    })
  ],
  callbacks: {
    // El 'token' JWT de NextAuth se enriquece con datos de 'user'
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    // La 'session' del cliente se enriquece con datos del 'token'
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Tu página de login personalizada
  }
})