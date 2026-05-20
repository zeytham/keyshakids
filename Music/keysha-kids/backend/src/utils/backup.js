const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const BACKUP_DIR = path.join(__dirname, '../../backups')

// Hakikisha folder ya backups ipo
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

const createBackup = () => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `keysha_backup_${timestamp}.sql`
    const filepath = path.join(BACKUP_DIR, filename)

    const dbUrl = process.env.DATABASE_URL
    const match = dbUrl.match(/postgresql:\/\/(.+):(.+)@(.+):(\d+)\/(.+)/)

    if (!match) return reject(new Error('DATABASE_URL si sahihi!'))

    const [, user, password, host, port, database] = match

    const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f "${filepath}" --no-password`

    const env = { ...process.env, PGPASSWORD: password }

    exec(command, { env }, (error) => {
      if (error) {
        console.error('Backup error:', error)
        return reject(error)
      }

      // Hakikisha file ipo
      if (!fs.existsSync(filepath)) {
        return reject(new Error('Backup file haikuundwa!'))
      }

      const stats = fs.statSync(filepath)
      resolve({
        filename,
        filepath,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        createdAt: new Date().toISOString(),
      })
    })
  })
}

const getBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return []

  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const filepath = path.join(BACKUP_DIR, f)
      const stats = fs.statSync(filepath)
      return {
        filename: f,
        filepath,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        createdAt: stats.mtime.toISOString(),
      }
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30)
}

const deleteOldBackups = () => {
  const backups = getBackups()
  if (backups.length > 10) {
    backups.slice(10).forEach(b => {
      try { fs.unlinkSync(b.filepath) } catch (e) {}
    })
  }
}

module.exports = { createBackup, getBackups, deleteOldBackups, BACKUP_DIR }