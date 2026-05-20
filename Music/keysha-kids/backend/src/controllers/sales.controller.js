const { prisma } = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { MODULES, STOCK_MOVEMENT, PAYMENT_TYPES, DEBT_STATUS } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// FANYA MAUZO (POS)
// ============================================================
const createSale = async (req, res) => {
  try {
    const { items, paymentType, paidAmount, discount, customerName, customerPhone } = req.body;

    if (!items || items.length === 0) {
      return errorResponse(res, 'Ongeza bidhaa angalau moja!', 400);
    }

    if (!paymentType || !Object.values(PAYMENT_TYPES).includes(paymentType)) {
      return errorResponse(res, 'Chagua aina ya malipo!', 400);
    }

    if (paymentType !== PAYMENT_TYPES.CASH && !customerName) {
      return errorResponse(res, 'Weka jina la mteja kwa mauzo ya deni!', 400);
    }

    // Pata bidhaa
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      return errorResponse(res, 'Baadhi ya bidhaa haipatikani!', 404);
    }

    // Hesabu jumla
    let totalAmount = 0;
    const saleItemsData = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (product.stockQuantity < item.quantity) {
        return errorResponse(
          res,
          `Stock ya "${product.name}" haitoshi! Iliyobaki: ${product.stockQuantity}`,
          400
        );
      }

      const subtotal = parseFloat(product.sellingPrice) * item.quantity;
      totalAmount += subtotal;

      saleItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        subtotal,
      });
    }

    const discountAmount = parseFloat(discount) || 0;
    const finalTotal = totalAmount - discountAmount;
    const paid = parseFloat(paidAmount) || 0;

    if (paymentType === PAYMENT_TYPES.CASH && paid < finalTotal) {
      return errorResponse(res, 'Pesa haitoshi kwa malipo ya cash!', 400);
    }

    if (paymentType === PAYMENT_TYPES.PARTIAL && paid >= finalTotal) {
      return errorResponse(res, 'Malipo kamili — tumia Cash badala yake!', 400);
    }

    if (paymentType === PAYMENT_TYPES.PARTIAL && paid <= 0) {
      return errorResponse(res, 'Weka pesa iliyolipwa sasa!', 400);
    }

    // Tafuta au unda customer
    let customer = null;

    if (customerName) {
      // Tafuta kwa simu kwanza
      if (customerPhone && customerPhone.trim()) {
        customer = await prisma.customer.findUnique({
          where: { phone: customerPhone.trim() },
        });
      }

      // Kama haipo — unda mpya
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName.trim(),
            phone: customerPhone?.trim() || `guest_${Date.now()}`,
            creditLimit: 0,
            totalDebt: 0,
          },
        });
      }

      // Angalia credit limit — kama ni 0 hakuna kikomo
      if (paymentType !== PAYMENT_TYPES.CASH) {
        const debtAmount = finalTotal - paid;
        const currentDebt = parseFloat(customer.totalDebt) || 0;
        const creditLimit = parseFloat(customer.creditLimit) || 0;

        if (creditLimit > 0) {
          const newTotalDebt = currentDebt + debtAmount;
          if (newTotalDebt > creditLimit) {
            return errorResponse(
              res,
              `Deni litazidi kikomo! Kikomo: TZS ${creditLimit.toLocaleString()}, Deni la sasa: TZS ${currentDebt.toLocaleString()}`,
              400
            );
          }
        }
      }
    }

    // Fanya transaction
    const result = await prisma.$transaction(async (tx) => {
      // Unda sale
      const sale = await tx.sale.create({
        data: {
          cashierId: req.user.id,
          customerId: customer?.id || null,
          totalAmount: finalTotal,
          discount: discountAmount,
          paidAmount: paid,
          paymentType,
          saleItems: {
            create: saleItemsData,
          },
        },
        include: {
          saleItems: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });

      // Punguza stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            type: STOCK_MOVEMENT.OUT,
            quantity: item.quantity,
            reason: `Mauzo - Receipt: ${sale.receiptNumber}`,
            referenceId: sale.id,
          },
        });
      }

      // Unda deni kama si cash
      if (paymentType !== PAYMENT_TYPES.CASH && customer) {
        const debtAmount = finalTotal - paid;

        await tx.debt.create({
          data: {
            customerId: customer.id,
            saleId: sale.id,
            totalAmount: finalTotal,
            paidAmount: paid,
            remainingAmount: debtAmount,
            status: paid === 0 ? DEBT_STATUS.PENDING : DEBT_STATUS.PARTIAL,
          },
        });

        await tx.customer.update({
          where: { id: customer.id },
          data: { totalDebt: { increment: debtAmount } },
        });
      }

      return sale;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_SALE',
      module: MODULES.SALES,
      description: `${req.user.name} amefanya mauzo ya TZS ${finalTotal}`,
      newValue: { receiptNumber: result.receiptNumber, totalAmount: finalTotal, paymentType },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Mauzo yamefanywa vizuri!', result, 201);
  } catch (error) {
    console.error('Create sale error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA MAUZO YOTE
// ============================================================
const getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, cashierId, paymentType, from, to, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isVoided: false,
      ...(cashierId && { cashierId }),
      ...(paymentType && { paymentType }),
      ...(from || to ? {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      } : {}),
      ...(search && {
        OR: [
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { receiptNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          saleItems: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    return paginationResponse(res, 'Mauzo yote!', sales, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get sales error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA MAUZO MOJA
// ============================================================
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        saleItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        debt: true,
      },
    });

    if (!sale) {
      return errorResponse(res, 'Mauzo haya hayapatikani!', 404);
    }

    return successResponse(res, 'Taarifa za mauzo!', sale);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// VOID SALE
// ============================================================
const voidSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return errorResponse(res, 'Weka sababu ya kufuta mauzo!', 400);
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true },
    });

    if (!sale) return errorResponse(res, 'Mauzo haya hayapatikani!', 404);
    if (sale.isVoided) return errorResponse(res, 'Mauzo haya yameshafutwa!', 400);

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id },
        data: { isVoided: true, voidReason: reason.trim(), voidedAt: new Date() },
      });

      for (const item of sale.saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            type: STOCK_MOVEMENT.IN,
            quantity: item.quantity,
            reason: `Void - Receipt: ${sale.receiptNumber}`,
            referenceId: sale.id,
          },
        });
      }

      if (sale.customerId) {
        const debt = await tx.debt.findUnique({ where: { saleId: id } });
        if (debt) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { totalDebt: { decrement: debt.remainingAmount } },
          });
          await tx.debt.delete({ where: { saleId: id } });
        }
      }
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'VOID_SALE',
      module: MODULES.SALES,
      description: `${req.user.name} amefuta mauzo: ${sale.receiptNumber}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Mauzo yamefutwa vizuri!');
  } catch (error) {
    console.error('Void sale error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = { createSale, getAllSales, getSaleById, voidSale };