const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // use official package
const { ensureCsrfSecret, verifyCsrfToken } = require('../middleware/csrf');
const auth = require('../middleware/auth');
const {
  redirectToGithub,
  githubCallback,
  refreshToken,
  logout,
  cliLoginWithToken,
  cliOAuthCallback,
  getCurrentUser
} = require('../controllers/userController');


const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ status: 'error', message: 'Too many requests, please try again later.' });
  }
})

router.use('/auth', authRateLimit)

router.get('/auth/github', ensureCsrfSecret, redirectToGithub);
router.get('/auth/github/callback', githubCallback);
router.post('/auth/refresh', verifyCsrfToken, refreshToken);
router.post('/auth/logout', verifyCsrfToken, logout);
router.post('/auth/cli/login', cliLoginWithToken);
router.post('/auth/cli/callback', cliOAuthCallback);
router.get('/auth/me', auth, getCurrentUser);

// 👇 Add the missing endpoint required by tests
router.get('/users/me', auth, getCurrentUser);

module.exports = router;