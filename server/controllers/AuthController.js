const User = require("../models/User");
const bcrypt = require("bcrypt");
const e = require("../utils/error");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // For generating temporary passwords

const sendingEmail = require("../utils/sendingEmail");

module.exports = {
  // 🔹 SIGNUP (For Regular Users)
  signup: async (req, res, next) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return next(e.errorHandler(400, "All fields are required"));
    }

    if (password.length < 6) {
      return next(
        e.errorHandler(400, "Password must be at least 6 characters")
      );
    }

    const potentialUser = await User.findOne({ email });
    if (potentialUser) {
      return next(e.errorHandler(400, "User already registered"));
    }

    if (password !== confirmPassword) {
      return next(e.errorHandler(400, "Passwords do not match!"));
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isTemporaryPassword: false, // Regular signup user
    });

    try {
      await newUser.save();
      res.json("Signup successful");
    } catch (error) {
      next(error);
    }
  },

  // 🔹 ADMIN: CREATE USER (With Temporary Password)
  createUser: async (req, res, next) => {
    const { firstName, lastName, email, role, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return next(e.errorHandler(400, "All fields are required"));
    }

    const potentialUser = await User.findOne({ email });
    if (potentialUser) {
      return next(e.errorHandler(400, "User already exists"));
    }

    // Generate random temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || "",
      password: hashedPassword,
      role,
      isAdmin: role === "Admin",
      isTemporaryPassword: true, // User must reset password on first login
    });

    try {
      await newUser.save();

      // ✅ Send actual email
      await sendingEmail(
        email,
        "Welcome! Your Temporary Password",
        `Hi ${firstName},\n\nYour account has been created.\nHere is your temporary password: ${tempPassword}\n\nPlease log in and change it as soon as possible.\n\nBest,\nElecPower`
      );

      res.json({
        message:
          "User created successfully. Temporary password sent via email.",
      });
    } catch (error) {
      next(error);
    }
  },

  // 🔹 SIGNIN (Force Password Change if Temporary)
  signin: async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(e.errorHandler(400, "All fields are required"));
    }

    try {
      const validUser = await User.findOne({ email });

      if (!validUser) {
        return next(e.errorHandler(404, "User not found"));
      }

      // Check if account is locked
      const currentTime = Date.now();
      if (
        validUser.failedLoginAttempts >= 3 &&
        validUser.lockUntil &&
        currentTime < validUser.lockUntil
      ) {
        const timeLeft = Math.ceil((validUser.lockUntil - currentTime) / 1000);
        return next(
          e.errorHandler(
            403,
            `Account locked. Try again in ${timeLeft} seconds.`
          )
        );
      }

      // Validate password
      const validPassword = bcrypt.compareSync(password, validUser.password);
      if (!validPassword) {
        validUser.failedLoginAttempts =
          (validUser.failedLoginAttempts || 0) + 1;

        if (validUser.failedLoginAttempts >= 3) {
          validUser.lockUntil = Date.now() + 15 * 1000; // Lock for 15 sec
        }

        await validUser.save();
        return next(e.errorHandler(400, "Invalid password"));
      }

      // Reset failed attempts and lock status on success
      validUser.failedLoginAttempts = 0;
      validUser.lockUntil = undefined;

      // Generate JWT token
      const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

      // Remove password from response
      const { password: pass, ...userWithoutPassword } = validUser._doc;

      await validUser.save();

      // 🔹 Handle temporary password — still return user info
      if (validUser.isTemporaryPassword) {
        return res
          .status(200)
          .cookie("access_token", token, { httpOnly: true })
          .json({ ...userWithoutPassword, isTemporaryPassword: true, token: token });
      }

     

      // 🔹 Return full user object if login is successful
      res
        .status(200)
        .cookie("access_token", token, { httpOnly: true })
        .json({
          ...userWithoutPassword,
          isTemporaryPassword: false,
          token: token,
        });
    } catch (error) {
      next(error);
    }
  },

 

  updatePassword: async (req, res, next) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Basic validation
    if (!newPassword || !confirmNewPassword) {
      return next(e.errorHandler(400, "All fields are required"));
    }

    if (newPassword.length < 8) {
      return next(
        e.errorHandler(400, "Password must be at least 8 characters")
      );
    }

    if (newPassword === currentPassword) {
      // Prevent using same password
      return next(e.errorHandler(400, "New password must be different"));
    }

    if (newPassword !== confirmNewPassword) {
      return next(e.errorHandler(400, "Passwords do not match!"));
    }

    try {
      // Verify token and get user
      const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
      if (!token)
        return next(
          e.errorHandler(401, "Session expired - Please login again")
        );

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(e.errorHandler(404, "User not found"));

      // For temporary passwords, we skip current password verification
      if (!user.isTemporaryPassword) {
        if (!currentPassword) {
          return next(e.errorHandler(400, "Current password is required"));
        }
        const isMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!isMatch) {
          return next(e.errorHandler(401, "Current password is incorrect"));
        }
      }

      // Update password
      user.password = bcrypt.hashSync(newPassword, 10);
      user.isTemporaryPassword = false;
      user.passwordChangedAt = Date.now();

      await user.save();

      // Clear token to force re-login
      res.clearCookie("access_token");

      res.status(200).json({
        success: true,
        message:
          "Password updated successfully. Please login with your new password.",
        redirectTo: "/login", // Explicit redirect path for frontend
      });
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return next(
          e.errorHandler(401, "Session invalid - Please login again")
        );
      }
      if (error.name === "TokenExpiredError") {
        return next(
          e.errorHandler(401, "Session expired - Please login again")
        );
      }
      next(error);
    }
  },
};
