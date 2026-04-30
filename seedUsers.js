// scripts/seedUsers.js
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel')

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in .env');
  process.exit(1);
}

// Define test users
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
  // Add more users as needed
];

const buildAccessToken = (user) => {
  return jwt.sign(
    {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
    JWT_SECRET,
    { expiresIn: '3m' } // same as backend
  );
};

const buildRefreshToken = (user) => {
  return jwt.sign(
    {
      user: { id: user._id },
      token_type: 'refresh',
      token_id: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: '5m' }
  );
};

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of users) {
      // Upsert user
      const user = await User.findOneAndUpdate(
        { github_id: userData.github_id },
        { ...userData, last_login_at: new Date() },
        { upsert: true, new: true }
      );

      // Generate tokens
      const accessToken = buildAccessToken(user);
      const refreshToken = buildRefreshToken(user);

      // Store refresh token in DB (required for validation)
      user.refresh_token = refreshToken;
      user.refresh_token_expires_at = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      console.log('\n=========================================');
      console.log(`User: ${user.username} (${user.role})`);
      console.log(`ID: ${user._id}`);
      console.log(`Access Token (expires 3m):\n${accessToken}`);
      console.log(`Refresh Token (expires 5m):\n${refreshToken}`);
      console.log('=========================================\n');
    }

    console.log('Seeding complete. Tokens generated above.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
};

seedUsers()