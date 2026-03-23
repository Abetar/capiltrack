// lib/auth/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcrypt"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado")
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          throw new Error("Email o contraseña incorrectos")
        }

        if (user.isBlocked) {
          throw new Error("Cuenta bloqueada. Contacta soporte.")
        }

        if (user.subscriptionStatus !== "active") {
          throw new Error("Debes activar tu suscripción para continuar.")
        }

        // 🔥 IMPORTANTE: incluir role
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          clinicId: user.clinicId,
          subscriptionStatus: user.subscriptionStatus,
          isBlocked: user.isBlocked,
          role: user.role, // 👈 NUEVO
        } as any
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: (user as any).id,
          email: (user as any).email,
          name: (user as any).name,
          clinicId: (user as any).clinicId,
          subscriptionStatus: (user as any).subscriptionStatus,
          isBlocked: (user as any).isBlocked,
          role: (user as any).role, // 👈 NUEVO
        }
      }

      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: (token as any).id,
          email: (token as any).email,
          name: (token as any).name,
          clinicId: (token as any).clinicId,
          subscriptionStatus: (token as any).subscriptionStatus,
          isBlocked: (token as any).isBlocked,
          role: (token as any).role, // 👈 NUEVO
        },
      }
    },
  },

  secret: process.env.AUTH_SECRET,
})