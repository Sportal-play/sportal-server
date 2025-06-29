import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import { dbConnect } from '../../../lib/mongodb';
import User from '../../../models/User';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('[DEBUG] JWT callback - user:', user, 'token:', token);
      // On initial sign in, persist the user id to the token
      if (user) {
        token.id = user.id;
        // Fetch profile for username and rating
        const client = await clientPromise;
        const db = client.db();
        const profile = await db.collection('profiles').findOne({ _id: new (require('mongodb').ObjectId)(user.id) });
        if (profile) {
          token.username = profile.username || null;
          token.rating = profile.rating || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[DEBUG] Session callback - token:', token, 'session.user:', session.user);
      await dbConnect();
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id || token.sub,
          username: token.username || null,
          rating: token.rating || null,
        }
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth',
    newUser: '/auth/new-user',
  },
}); 