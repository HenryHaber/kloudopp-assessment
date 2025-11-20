const {DataTypes, Model} = require('sequelize');
const {sequelize} = require('../config/database');
const bcrypt = require('bcrypt');
const {genSalt} = require('bcrypt');


const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  authProvider: {
    type: DataTypes.ENUM('local', 'google'),
    allowNull: false,
    defaultValue: 'local',
    field: 'auth_provider'
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    field: 'google_id'
  },
  userType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_type'
  },
  firstName: {
    type: DataTypes.STRING,
    field: 'first_name',
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    field: 'last_name',
    allowNull: false
  },
  profilePicture: {
    type: DataTypes.STRING,
    field: 'profile_picture',
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_email_verified'
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    field: 'email_verification_token',
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    field: 'password_reset_token',
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    field: 'refresh_token',
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login',
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'

  }
}, {
  tabelName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['google_id'],
      where: {
        google_id: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }

    },
    {
      fields: ['user_type']
    },
    {
      fields: ['auth_provider']
    }
  ]
});

User.hashPassword = async function (password) {
  const saltRounds = await genSalt(10);
  return await bcrypt.hash(password, saltRounds);
}

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
}

User.prototype.getPublicProfile = function () {
  return {
    id: this.id,
    email: this.email,
    userType: this.userType,
    firstName: this.firstName,
    lastName: this.lastName,
    profilePicture: this.profilePicture,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  }
}

module.exports= User