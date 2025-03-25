import User from '../models/User.js';
import { signToken } from '../services/auth.js';

const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.req.user) {
        throw new Error('Not authenticated');
      }
      return User.findById(context.req.user._id);
    },
    users: async () => {
      try {
        const users = await User.find();
        return users;
      } catch (error) {
        throw new Error('Error fetching users');
      }
    },
    user: async (_: any, { id }: { id: string }) => {
      try {
        const user = await User.findById(id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        throw new Error('Error fetching user');
      }
    }
  },
  Mutation: {
    login: async (_: any, { email, password }: { email: string; password: string }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new Error('Wrong password!');
      }

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    saveBook: async (_: any, { bookData }: { bookData: any }, context: any) => {
      if (!context.req.user) {
        throw new Error('Not authenticated');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.req.user._id },
        { $addToSet: { savedBooks: bookData } },
        { new: true, runValidators: true }
      );

      return updatedUser;
    },
    deleteBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.req.user) {
        throw new Error('Not authenticated');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.req.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      return updatedUser;
    }
  }
};

export default resolvers;