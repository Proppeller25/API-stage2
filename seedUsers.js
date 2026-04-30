require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const REFRESH_TOKEN_MAX_AGE_MS =
  Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in .env');
  process.exit(1);
}

const users = [
  {
    github_id: 'admin_test_1',
    username: 'admin_user',
    email: 'admin@insighta.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    role: 'admin',
    is_active: true,
  },
  {
    github_id: 'analyst_test_1',
    username: 'analyst_john',
    email: 'analyst@insighta.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/67890',
    role: 'analyst',
    is_active: true,
  },
];

const buildAccessToken = (user) =>
  jwt.sign(
    {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

const buildRefreshToken = (user) =>
  jwt.sign(
    {
      user: { id: user._id },
      token_type: 'refresh',
      token_id: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of users) {
      const user = await User.findOneAndUpdate(
        { github_id: userData.github_id },
        {
          ...userData,
          id: undefined,
          is_active: true,
          last_login_at: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      const accessToken = buildAccessToken(user);
      const refreshToken = buildRefreshToken(user);

      user.username = userData.username;
      user.email = userData.email;
      user.github_id = userData.github_id;
      user.role = userData.role;
      user.is_active = true;
      user.refresh_token = refreshToken;
      user.refresh_token_expires_at = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
      user.last_login_at = new Date();
      await user.save();

      console.log('\n=========================================');
      console.log(`User: ${user.username} (${user.role})`);
      console.log(`ID: ${user._id}`);
      console.log(`GitHub ID: ${user.github_id}`);
      console.log(`Access Token (expires ${ACCESS_TOKEN_EXPIRES_IN}):\n${accessToken}`);
      console.log(`Refresh Token (expires ${REFRESH_TOKEN_EXPIRES_IN}):\n${refreshToken}`);
      console.log('=========================================\n');
    }

    console.log('Seeding complete. Tokens generated above.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
};

seedUsers();
