import type {
  NextAuthOptions,
  Account,
  Profile,
  User as NextAuthUser,
} from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    backendAccessToken?: string;
  }

  interface User {
    id?: string;
    backendAccessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    backendAccessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    //calling the backend endpoint here
    async signIn({
      user,
      account,
    }: {
      user: NextAuthUser;
      account?: Account | null;
      profile?: Profile | undefined;
    }) {
      if (account?.provider === "google") {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image,
                googleId: account.providerAccountId,
              }),
            }
          );

          if (response.ok) {
            const userData = await response.json();
            user.id = userData.user.id;
            user.backendAccessToken = userData.accessToken;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error syncing Google user:", error);
          return false;
        }
      }
      return true;
    },

    //runs when a JWT session is created and on calls that need it.
    async jwt({
      token,
      user,
      account,
    }: {
      token: NextAuthJWT;
      user?: NextAuthUser;
      account?: Account | null;
    }) {
      if (account && user) {
        token.backendAccessToken = user.backendAccessToken;
        token.id = user.id;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: import("next-auth").Session;
      token: NextAuthJWT;
    }) {
      if (token.id) {
        session.user = { ...session.user, id: token.id };
      }
      if (token.backendAccessToken) {
        session.backendAccessToken = token.backendAccessToken as string;
      }
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
