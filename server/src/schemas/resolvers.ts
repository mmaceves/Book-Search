import User from '../models/User';
// Query definitions for MongoDB operations
const resolvers = {
  // Get all users
  query: {

    users: async () => {
      try {
        const users = await User.find();
        return users;
      } catch (error) {
        throw new Error('Error fetching users');
      }
    },

    // Get single user by ID
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

  // Mutation definitions for MongoDB operations
  mutation: {
    // Create new user
    createUser: async (_: any, { input }: { input: any }) => {
      try {
        const user = new User(input);
        await user.save();
        return user;
      } catch (error) {
        throw new Error('Error creating user');
      }
    },

    // Update existing user
    updateUser: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const user = await User.findByIdAndUpdate(
          id,
          { $set: input },
          { new: true }
        );
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        throw new Error('Error updating user');
      }
    },

    // Delete user
    deleteUser: async (_: any, { id }: { id: string }) => {
      try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        throw new Error('Error deleting user');
      }
    }
  }
};

export default resolvers;