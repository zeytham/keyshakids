const express = require('express')
const router = express.Router()
const { getSettings, saveSettings, getSystemInfo } = require('../controllers/settings.controller')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', getSettings)
router.put('/', saveSettings)
router.get('/system-info', getSystemInfo)

module.exports = router