require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { PORT } = require('./config/constants');
const cron = require('node-cron');
const { createBackup, deleteOldBackups } = require('./utils/backup');

const startServer = async () => {
  try {
    // Unganika na database kwanza
    await connectDatabase();

    // Auto backup kila usiku saa 2 (02:00)
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Auto backup inaanza...')
      try {
        const backup = await createBackup()
        deleteOldBackups()
        console.log('✅ Auto backup imekamilika:', backup.filename)
      } catch (error) {
        console.error('❌ Auto backup imeshindwa:', error)
      }
    }, {
      timezone: 'Africa/Dar_es_Salaam'
    })

    // Anza server
    app.listen(PORT, () => {
      console.log('================================================');
      console.log('🚀 Keysha Kids Collection API imeanza!');
      console.log(`🌍 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
      console.log('================================================');
    });

  } catch (error) {
    console.error('❌ Server haikuweza kuanza:', error);
    process.exit(1);
  }
};

// Handle errors zinazotokea bila kushikwa
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();