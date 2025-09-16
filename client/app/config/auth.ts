import type {
  NextAuthOptions,
  Account,
  Profile,
  User as NextAuthUser,
} from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

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
  debug: false,
  useSecureCookies: process.env.NODE_ENV === "production",

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

    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email", // Request necessary scopes
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
      //-------------------------------GOOGLE OAUTH------------------------------------//
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
                accessToken: account.access_token,
              }),
            }
          );
          console.log(
            "BACKEND_URL ok?",
            !!process.env.BACKEND_URL,
            "NEXT_PUBLIC_API_URL ok?",
            !!process.env.NEXT_PUBLIC_API_URL
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
        //--------------------------------GITHUB OAUTH----------------------------------------//
      } else if (account?.provider === "github") {
        try {
          // Check in your NextAuth configuration
          console.log(
            "GitHub Client ID available:",
            !!process.env.GITHUB_CLIENT_ID
          );
          console.log(
            "GitHub Client Secret available:",
            !!process.env.GITHUB_CLIENT_SECRET
          );
          console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                githubId: account.providerAccountId,
                image: user.image,
                accessToken: account.access_token,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Backend GitHub API error:",
              response.status,
              errorText
            );
            return false;
          }

          const userData = await response.json();

          if (userData.accessToken && userData.user?.id) {
            user.id = userData.user.id;
            user.backendAccessToken = userData.accessToken;
            return true;
          }

          console.error("Invalid response format from backend");
          return false;
        } catch (error) {
          console.error("Error syncing GitHub user:", error);
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
