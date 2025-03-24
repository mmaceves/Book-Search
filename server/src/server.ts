// import express from 'express';
// import path from 'node:path';
// import db from './config/connection.js';
// import routes from './routes/index.js';

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // if we're in production, serve client/build as static assets
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// }

// app.use(routes);

// db.once('open', () => {
//   app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
// });


import express from 'express';
import { ApolloServer, BaseContext } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';

import { typeDefs, resolvers } from './schemas/index.js';
import db from './config/connection.js';
import { authenticateTokenGraphQL } from './services/auth.js';

const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer<BaseContext>({
  typeDefs,
  resolvers,
  plugins: [
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await server.stop();
          },
        };
      },
    },
  ],
});

server.start().then(() => {
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Apply authentication middleware for GraphQL
        await authenticateTokenGraphQL({ req });
        return { req };
      },
    })
  );
});

const startApolloServer = async () => {
  await server.start();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server));

  // if we're in production, serve client/dist as static assets
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();