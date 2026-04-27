const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const checkRole = require('../middleware/role')
const {
  redirectToGithub,
  githubCallback,
  refreshToken,
  logout
} = require('../controllers/userController')

router.get('/auth/github', redirectToGithub)
router.get('/auth/github/callback', githubCallback)
router.post('/auth/refresh', refreshToken)
router.post('/auth/logout', logout)

module.exports = router