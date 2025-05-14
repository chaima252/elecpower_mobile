const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
    },

    lastName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: String,

    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
    },
    profilePicture: {
        type: String,
        default:
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isTemporaryPassword: {
        type: Boolean,
        default: false
      },
    failedLoginAttempts: {
        type: Number,
        default: 0, 
    },
    lockUntil: {
        type: Number, 
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
    }],



}, { timestamps: true });


UserSchema.virtual("confirmPassword")
    .get(() => this._confirmPassword)
    .set(value => this._confirmPassword = value)


const User = mongoose.model("User", UserSchema);

module.exports = User;
