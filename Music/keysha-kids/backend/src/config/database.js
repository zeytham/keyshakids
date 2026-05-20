const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log('🔗 Database URL prefix:', connectionString?.substring(0, 30));

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database imeunganika vizuri!');
  } catch (error) {
    console.error('❌ Database haikuweza kuunganika:', error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDatabase };