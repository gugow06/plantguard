import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isProtected =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/history') ||
        nextUrl.pathname.startsWith('/settings');

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      if (nextUrl.pathname === '/login' && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null;
      }
      if (trigger === 'update' && session?.user) {
        if (typeof session.user.name === 'string') token.name = session.user.name;
        if (typeof session.user.email === 'string') token.email = session.user.email;
        if (typeof session.user.image === 'string' || session.user.image === null) {
          token.picture = session.user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | null) ?? session.user.name;
        session.user.email = (token.email as string | null) ?? session.user.email;
        session.user.image = (token.picture as string | null) ?? session.user.image;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
