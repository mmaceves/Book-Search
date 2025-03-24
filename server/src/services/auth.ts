import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string;
}

export const graphqlAuthMiddleware = async (context: { req: Request }) => {
  const authHeader = context.req.headers.authorization;

  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  const secretKey = process.env.JWT_SECRET_KEY || '';

  try {
    const user = await new Promise((resolve, reject) => {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          reject(new Error('Invalid token'));
        }
        resolve(decoded);
      });
    });

    context.req.user = user as JwtPayload;
    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET_KEY || '';

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      req.user = user as JwtPayload;
      return next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

export const authenticateTokenGraphQL = async (context: { req: Request }) => {
  const authHeader = context.req.headers.authorization;

  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  const secretKey = process.env.JWT_SECRET_KEY || '';

  try {
    const user = await new Promise((resolve, reject) => {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          reject(new Error('Forbidden'));
        }
        resolve(decoded);
      });
    });

    context.req.user = user as JwtPayload;
    return user;
  } catch (error) {
    throw new Error('Unauthorized');
  }
};

export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};