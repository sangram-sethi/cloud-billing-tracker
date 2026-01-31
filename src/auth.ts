import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { ensureAuthIndexes } from "@/lib/auth/indexes";
import { consumeLoginToken } from "@/lib/auth/loginToken";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.MONGODB_DB }),
  session: { strategy: "jwt" },

  // Keep UX inside your premium pages
  pages: {
    signIn: "/login",
    error: "/login",
  },

  trustHost: true,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      // ✅ Always show account chooser
      authorization: {
        params: {
          prompt: "select_account",
        },
      },

      // One-email-one-account linking for trusted provider
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Email OTP",
      credentials: {
        loginToken: { label: "Login Token", type: "text" },
      },
      authorize: async (credentials) => {
        await ensureAuthIndexes();

        // Accept both FormData (some v5 flows) and plain objects
        let raw: unknown = credentials;
        if (typeof FormData !== "undefined" && credentials instanceof FormData) {
          raw = Object.fromEntries(credentials.entries());
        }

        const parsed = z.object({ loginToken: z.string().min(20) }).safeParse(raw);
        if (!parsed.success) return null;

        const user = await consumeLoginToken(parsed.data.loginToken);
        return user;
      },
    }),
  ],

  callbacks: {
    session: ({ session, token }) => {
      if (session.user && typeof token.sub === "string") {
        // Works whether or not your next-auth types are augmented
        (session.user as typeof session.user & { id?: string }).id = token.sub;
      }
      return session;
    },
  },
});
