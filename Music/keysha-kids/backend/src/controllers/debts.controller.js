const { prisma } = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { MODULES, DEBT_STATUS } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// PATA MADENI YOTE
// ============================================================
const getAllDebts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(customerId && { customerId }),
    };

    const [debts, total] = await Promise.all([
      prisma.debt.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          sale: {
            select: {
              id: true,
              receiptNumber: true,
              createdAt: true,
            },
          },
          debtPayments: {
            orderBy: { paymentDate: 'desc' },
            take: 1,
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.debt.count({ where }),
    ]);

    return paginationResponse(res, 'Madeni yote!', debts, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get debts error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA DENI MOJA
// ============================================================
const getDebtById = async (req, res) => {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, creditLimit: true },
        },
        sale: {
          include: {
            saleItems: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        debtPayments: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!debt) {
      return errorResponse(res, 'Deni hili halipatikani!', 404);
    }

    return successResponse(res, 'Taarifa za deni!', debt);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// LIPA DENI
// ============================================================
const payDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;

    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      return errorResponse(res, 'Weka kiasi cha malipo!', 400);
    }

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!debt) {
      return errorResponse(res, 'Deni hili halipatikani!', 404);
    }

    if (debt.status === DEBT_STATUS.PAID) {
      return errorResponse(res, 'Deni hili limelipwa tayari!', 400);
    }

    const payment = parseFloat(amountPaid);
    const remaining = parseFloat(debt.remainingAmount);

    if (payment > remaining) {
      return errorResponse(
        res,
        `Malipo yanazidi deni! Deni linalobaki: TZS ${remaining}`,
        400
      );
    }

    const newRemaining = remaining - payment;
    const newPaid = parseFloat(debt.paidAmount) + payment;
    const newStatus = newRemaining === 0 ? DEBT_STATUS.PAID : DEBT_STATUS.PARTIAL;

    const result = await prisma.$transaction(async (tx) => {
      // Update deni
      const updatedDebt = await tx.debt.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      });

      // Rekodi malipo
      const debtPayment = await tx.debtPayment.create({
        data: {
          debtId: id,
          customerId: debt.customerId,
          amountPaid: payment,
          receivedBy: req.user.id,
        },
      });

      // Update jumla ya deni la mteja
      await tx.customer.update({
        where: { id: debt.customerId },
        data: {
          totalDebt: { decrement: payment },
        },
      });

      return { updatedDebt, debtPayment };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'PAY_DEBT',
      module: MODULES.DEBTS,
      description: `${req.user.name} amepokea malipo ya TZS ${payment} kutoka ${debt.customer.name}`,
      oldValue: { remainingAmount: remaining },
      newValue: { remainingAmount: newRemaining, status: newStatus },
      ipAddress: getIpAddress(req),
    });

    // Tengeneza receipt data
    const receipt = {
      receiptNumber: result.debtPayment.receiptNumber,
      customerName: debt.customer.name,
      customerPhone: debt.customer.phone,
      amountPaid: payment,
      remainingDebt: newRemaining,
      paymentDate: result.debtPayment.paymentDate,
      receivedBy: req.user.name,
      status: newStatus,
    };

    return successResponse(res, 'Malipo yamepokewa vizuri!', {
      debt: result.updatedDebt,
      receipt,
    });
  } catch (error) {
    console.error('Pay debt error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA RECEIPT YA MALIPO YA DENI
// ============================================================
const getDebtPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.debtPayment.findUnique({
      where: { id: paymentId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        debt: {
          select: {
            totalAmount: true,
            remainingAmount: true,
            status: true,
          },
        },
        user: { select: { id: true, name: true } },
      },
    });

    if (!payment) {
      return errorResponse(res, 'Receipt hii haipatikani!', 404);
    }

    const receipt = {
      receiptNumber: payment.receiptNumber,
      customerName: payment.customer.name,
      customerPhone: payment.customer.phone,
      amountPaid: payment.amountPaid,
      remainingDebt: payment.debt.remainingAmount,
      debtStatus: payment.debt.status,
      paymentDate: payment.paymentDate,
      receivedBy: payment.user.name,
    };

    return successResponse(res, 'Receipt ya malipo!', receipt);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// MADENI YANAYOKARIBIA KIKOMO (kwa notifications)
// ============================================================
const getDebtsNearLimit = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        creditLimit: { gt: 0 },
        totalDebt: { gt: 0 },
      },
    });

    const nearLimit = customers.filter((c) => {
      const percentage =
        (parseFloat(c.totalDebt) / parseFloat(c.creditLimit)) * 100;
      return percentage >= 70;
    });

    return successResponse(res, 'Wateja wanaokaribia kikomo cha deni!', nearLimit);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  getAllDebts,
  getDebtById,
  payDebt,
  getDebtPaymentReceipt,
  getDebtsNearLimit,
};