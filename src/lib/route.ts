import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./db";

declare module "next-auth" {
    interface User {
        id: number;
    }

    interface Session extends DefaultSession {
        user: User;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as number;
            }
            return session;
        },
        async signIn(params) {
            const { email, name } = params.user;
            if (!email || !name) {
                console.error("Missing user email or name");
                return false;
            }

            try {
                console.log("Attempting to upsert user");
                const result = await prisma.user.upsert({
                    where: { email },
                    update: { name },
                    create: { email, name }
                });
                console.log("User upsert successful", result);
                return true;
            } catch (error) {
                console.error("Error during sign in:", error);
                if (error instanceof Error) {
                    console.error(error.message);
                    console.error(error.stack);
                }
                return false;
            }
        }
    },
    pages: {
        signIn: '/',
    }
}
