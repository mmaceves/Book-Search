import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

import { typeDefs, resolvers } from './schemas/index.js';
import db from './config/connection.js';
import { authenticateTokenGraphQL } from './services/auth.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const context = async ({ req }: { req: express.Request }) => {
  // Apply authentication middleware for GraphQL
  await authenticateTokenGraphQL({ req });
  return { req };
};

const startApolloServer = async () => {
  await server.start();

  app.use(cors({
    origin: "http://localhost:3000", // Allow frontend
    credentials: true, // If using cookies or authentication
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server, { context }));

  // if we're in production, serve client/build as static assets
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/build')));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../../client/build/index.html'));
    });
  }

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

startApolloServer();