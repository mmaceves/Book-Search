import User from '../models/User.js';
import { signToken } from '../services/auth.js';

const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: any) => {
      if (context.req.user) {
        const currentUser = await User.findOne({ _id: context.req.user._id });
        return currentUser;
      }
      throw new Error('Failed to authenticate');
    },
  },
  Mutation: {
    login: async (_parent: unknown, { email, password }: { email: string; password: string }) => {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Incorrect credentials');
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new Error('Incorrect credentials');
      }
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    addUser: async (_parent: unknown, { username, email, password }: { username: string; email: string; password: string }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    saveBook: async (_parent: unknown, { bookData }: { bookData: any }, context: any) => {
      if (!context.req.user) {
        throw new Error('You must be logged in to save a book');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.req.user._id },
        { $addToSet: { savedBooks: bookData } },
        { new: true, runValidators: true }
      );

      return updatedUser;
    },
    removeBook: async (_parent: unknown, { bookId }: { bookId: string }, context: any) => {
      if (!context.req.user) {
        throw new Error('You must be logged in to remove a book');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.req.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      return updatedUser;
    },
  },
};

export default resolvers;