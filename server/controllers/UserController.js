const User = require("../models/User");
const bcrypt = require("bcrypt");
const e = require("../utils/error");

module.exports = {
    signout: (req, res, next) => {
        try {
            res
                .clearCookie('access_token')
                .status(200)
                .json('User has been signed out');
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        try {
          const updateFields = req.body; // Now receives only changed fields
      
          // Special password handling
          if (updateFields.password) {
            if (updateFields.password.length < 6) {
              return next(e.errorHandler(400, 'Password must be at least 6 characters'));
            }
            updateFields.password = bcrypt.hashSync(updateFields.password, 10);
            updateFields.isTemporaryPassword = true;
          }
      
          const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: updateFields },
            { new: true, runValidators: true }
          );
      
          if (!updatedUser) {
            return next(e.errorHandler(404, 'User not found'));
          }
      
          const { password, ...userData } = updatedUser._doc;
          res.status(200).json(userData);
        } catch (error) {
          if (error.code === 11000) {
            return next(e.errorHandler(400, 'Email already exists'));
          }
          next(error);
        }
      },

    deleteUser: async (req, res, next) => {
        try {
            await User.findByIdAndDelete(req.params.userId);
            res.status(200).json('User has been deleted');
        } catch (error) {
            next(error);
        }
    },

    getUser: async (req, res, next) => {
      try {
          const user = await User.findById(req.params.userId)
              .populate({
                  path: 'projects',
                  select: 'name status startDate endDate destination' // only include these fields
              });
          
          if (!user) {
              return res.status(404).json('User not found');
          }
          
          const { password, ...userData } = user._doc;
          res.status(200).json(userData);
      } catch (error) {
          next(error);
      }
  },

    getUsers: async (req, res, next) => {
        try {
            const startIndex = parseInt(req.query.startIndex) || 0;
            const limit = parseInt(req.query.limit) || 9;
            const sortDirection = req.query.sort === 'asc' ? 1 : -1;

            const users = await User.find()
                .sort({ createdAt: sortDirection })
                .skip(startIndex)
                .limit(limit);

            const usersWithoutPassword = users.map((user) => {
                const { password, ...rest } = user._doc;
                return rest;
            });

            const totalUsers = await User.countDocuments();

            const now = new Date();
            const oneMonthAgo = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                now.getDate()
            );
            const lastMonthUsers = await User.countDocuments({
                createdAt: { $gte: oneMonthAgo },
            });

            res.status(200).json({
                users: usersWithoutPassword,
                totalUsers,
                lastMonthUsers,
            });
        } catch (error) {
            next(error);
        }
    },

    updateAdminRole: async (req, res, next) => {
        const { userId } = req.params;
        const { isAdmin } = req.body;

        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { isAdmin },
                { new: true }
            );
            const { password, ...rest } = updatedUser._doc;
            res.status(200).json(rest);
        } catch (error) {
            next(error);
        }
    },

    //! get onmy employees
     getEmployees : async (req, res) => {
        try {
          // Find users where isAdmin is false or not set
          const employees = await User.find({ isAdmin: false })
            .select('-password -failedLoginAttempts -lockUntil') // Exclude sensitive fields
            .sort({ lastName: 1 }); // Sort by last name alphabetically
      
          res.status(200).json(employees);
        } catch (error) {
          console.error('Error fetching employees:', error);
          res.status(500).json({ message: 'Server error while fetching employees' });
        }
      },
};