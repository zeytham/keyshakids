const { prisma } = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { MODULES } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// PATA WATEJA WOTE
// ============================================================
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { debts: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return paginationResponse(res, 'Wateja wote!', customers, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA MTEJA MMOJA
// ============================================================
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        debts: {
          where: { status: { not: 'PAID' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return errorResponse(res, 'Mteja huyu hapatikani!', 404);
    }

    return successResponse(res, 'Taarifa za mteja!', customer);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ONGEZA MTEJA MPYA
// ============================================================
const createCustomer = async (req, res) => {
  try {
    const { name, phone, creditLimit } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 'Jaza jina na namba ya simu!', 400);
    }

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return errorResponse(res, 'Namba ya simu hii ipo tayari!', 409);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        creditLimit: parseFloat(creditLimit) || 0,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_CUSTOMER',
      module: MODULES.CUSTOMERS,
      description: `${req.user.name} ameongeza mteja: ${name}`,
      newValue: { name, phone, creditLimit },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Mteja ameongezwa vizuri!', customer, 201);
  } catch (error) {
    console.error('Create customer error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// BADILISHA TAARIFA ZA MTEJA
// ============================================================
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, creditLimit } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Mteja huyu hapatikani!', 404);
    }

    if (phone && phone !== existing.phone) {
      const taken = await prisma.customer.findUnique({ where: { phone } });
      if (taken) {
        return errorResponse(res, 'Namba ya simu hii ipo tayari!', 409);
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(creditLimit !== undefined && {
          creditLimit: parseFloat(creditLimit),
        }),
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_CUSTOMER',
      module: MODULES.CUSTOMERS,
      description: `${req.user.name} amebadilisha taarifa za mteja: ${existing.name}`,
      oldValue: { name: existing.name, phone: existing.phone },
      newValue: { name: customer.name, phone: customer.phone },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Taarifa za mteja zimebadilishwa!', customer);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA MADENI NA HISTORIA YA MAUZO YA MTEJA
// ============================================================
const getCustomerDebts = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return errorResponse(res, 'Mteja huyu hapatikani!', 404);
    }

    const debts = await prisma.debt.findMany({
      where: {
        customerId: id,
        ...(status && { status }),
      },
      include: {
        debtPayments: { orderBy: { paymentDate: 'desc' } },
        sale: {
          select: {
            id: true, receiptNumber: true,
            totalAmount: true, createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sales = await prisma.sale.findMany({
      where: { customerId: id, isVoided: false },
      include: {
        cashier: { select: { id: true, name: true } },
        saleItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalSales = sales.length
    const totalSpent = sales.reduce(
      (sum, s) => sum + parseFloat(s.totalAmount || 0), 0
    )

    return successResponse(res, 'Historia ya mteja!', {
      customer: {
        id: customer.id, name: customer.name,
        phone: customer.phone, creditLimit: customer.creditLimit,
        totalDebt: customer.totalDebt,
      },
      debts,
      sales,
      totalSales,
      totalSpent,
    });
  } catch (error) {
    console.error('Get customer debts error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerDebts,
};