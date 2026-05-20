const express = require('express')
const router = express.Router()
const { doBackup, listBackups, downloadBackup, deleteBackup } = require('../controllers/backup.controller')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.post('/', doBackup)
router.get('/', listBackups)
router.get('/download/:filename', downloadBackup)
router.delete('/:filename', deleteBackup)

module.exports = router