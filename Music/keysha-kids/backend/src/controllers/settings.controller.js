const { prisma } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { MODULES } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// Default settings
const DEFAULT_SETTINGS = {
  businessName: 'Keysha Kids Collection',
  businessPhone1: '0622146487',
  businessPhone2: '0626030263',
  businessInstagram: '@keysha_kids_collection',
  businessAddress: 'Mwanakwerekwe, Zanzibar',
}

// ============================================================
// PATA SETTINGS
// ============================================================
const getSettings = async (req, res) => {
  try {
    // Tumia audit_logs table kuhifadhi settings kama JSON
    const setting = await prisma.auditLog.findFirst({
      where: { action: 'SYSTEM_SETTINGS' },
      orderBy: { createdAt: 'desc' },
    })

    const settings = setting
      ? JSON.parse(setting.newValue || '{}')
      : DEFAULT_SETTINGS

    return successResponse(res, 'Settings zimepata!', {
      ...DEFAULT_SETTINGS,
      ...settings,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return errorResponse(res, 'Hitilafu ya seva!', 500)
  }
}

// ============================================================
// HIFADHI SETTINGS
// ============================================================
const saveSettings = async (req, res) => {
  try {
    const {
      businessName,
      businessPhone1,
      businessPhone2,
      businessInstagram,
      businessAddress,
    } = req.body

    const settings = {
      businessName: businessName?.trim() || DEFAULT_SETTINGS.businessName,
      businessPhone1: businessPhone1?.trim() || DEFAULT_SETTINGS.businessPhone1,
      businessPhone2: businessPhone2?.trim() || DEFAULT_SETTINGS.businessPhone2,
      businessInstagram: businessInstagram?.trim() || DEFAULT_SETTINGS.businessInstagram,
      businessAddress: businessAddress?.trim() || DEFAULT_SETTINGS.businessAddress,
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SYSTEM_SETTINGS',
        module: MODULES.SETTINGS || 'SETTINGS',
        description: `${req.user.name} amebadilisha settings za biashara`,
        newValue: JSON.stringify(settings),
        ipAddress: getIpAddress(req),
      },
    })

    return successResponse(res, 'Settings zimehifadhiwa!', settings)
  } catch (error) {
    console.error('Save settings error:', error)
    return errorResponse(res, 'Hitilafu ya seva!', 500)
  }
}

// ============================================================
// PATA SYSTEM INFO
// ============================================================
const getSystemInfo = async (req, res) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalSales,
      totalUsers,
      totalDebts,
      pendingDebts,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.sale.count({ where: { isVoided: false } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.debt.count(),
      prisma.debt.count({ where: { status: { not: 'PAID' } } }),
    ])

    return successResponse(res, 'System info!', {
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      stats: {
        totalProducts,
        totalCustomers,
        totalSales,
        totalUsers,
        totalDebts,
        pendingDebts,
      },
      server: {
        status: 'Online ✅',
        platform: 'Railway',
        database: 'PostgreSQL',
        frontend: 'Vercel',
      },
      builtWith: {
        backend: 'Node.js + Express + Prisma',
        frontend: 'React + Vite',
        database: 'PostgreSQL 18',
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('System info error:', error)
    return errorResponse(res, 'Hitilafu ya seva!', 500)
  }
}

module.exports = { getSettings, saveSettings, getSystemInfo }