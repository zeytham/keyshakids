const fs = require('fs')
const path = require('path')
const { createBackup, getBackups, deleteOldBackups, BACKUP_DIR } = require('../utils/backup')
const { successResponse, errorResponse } = require('../utils/response')

// Fanya backup sasa
const doBackup = async (req, res) => {
  try {
    const backup = await createBackup()
    deleteOldBackups()
    return successResponse(res, 'Backup imefanywa vizuri!', backup)
  } catch (error) {
    console.error('Backup error:', error)
    return errorResponse(res, 'Backup imeshindwa! Hakikisha pg_dump ipo.', 500)
  }
}

// Pata orodha ya backups
const listBackups = async (req, res) => {
  try {
    const backups = getBackups()
    return successResponse(res, 'Backups zote!', backups)
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500)
  }
}

// Download backup
const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params
    const filepath = path.join(BACKUP_DIR, filename)

    // Security check
    if (!filename.startsWith('keysha_backup_') ||
        (!filename.endsWith('.zip') && !filename.endsWith('.sql'))) {
      return errorResponse(res, 'Faili si sahihi!', 400)
    }

    if (!fs.existsSync(filepath)) {
      return errorResponse(res, 'Faili haipatikani!', 404)
    }

    res.download(filepath, filename)
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500)
  }
}

// Futa backup moja
const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params
    const filepath = path.join(BACKUP_DIR, filename)

    if (!filename.startsWith('keysha_backup_')) {
      return errorResponse(res, 'Faili si sahihi!', 400)
    }

    if (!fs.existsSync(filepath)) {
      return errorResponse(res, 'Faili haipatikani!', 404)
    }

    fs.unlinkSync(filepath)
    return successResponse(res, 'Backup imefutwa!')
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500)
  }
}

module.exports = { doBackup, listBackups, downloadBackup, deleteBackup }