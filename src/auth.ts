import NextAuth, { type Session, type User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

import clientPromise, { getDb } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { LoginSchema } from "@/lib/auth/schemas";

type DbUser = {
  _id: unknown;
  email: string;
  name?: string | null;
  passwordHash?: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB?.trim() || undefined,
  }),

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials: unknown) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const { password } = parsed.data;

        const db = await getDb();
        const user = await db.collection<DbUser>("users").findOne({ email });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: String((user as any)._id),
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }: { token: JWT; user?: NextAuthUser | AdapterUser }) {
      if (user?.id) token.uid = user.id;
      return token;
    },

    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.uid) {
        session.user.id = String(token.uid);
      }
      return session;
    },
  },
});
