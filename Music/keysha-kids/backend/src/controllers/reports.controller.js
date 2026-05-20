const { prisma } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ============================================================
// HELPER — PATA TAREHE
// ============================================================
const getDateRange = (period, from, to) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.setHours(0, 0, 0, 0));
      endDate = new Date(yesterday.setHours(23, 59, 59, 999));
      break;
    case 'this_week':
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - now.getDay());
      startDate = new Date(firstDay.setHours(0, 0, 0, 0));
      endDate = new Date();
      break;
    case 'last_week':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
      startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
      endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date();
      break;
    case 'last_year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    case 'custom':
      startDate = from ? new Date(from) : new Date(now.setHours(0, 0, 0, 0));
      endDate = to ? new Date(to) : new Date();
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date();
  }

  return { startDate, endDate };
};

// ============================================================
// RIPOTI YA MAUZO
// ============================================================
const getSalesReport = async (req, res) => {
  try {
    const { period = 'today', from, to, cashierId } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const where = {
      isVoided: false,
      createdAt: { gte: startDate, lte: endDate },
      ...(cashierId && { cashierId }),
    };

    const sales = await prisma.sale.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        saleItems: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Hesabu takwimu
    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, s) => sum + parseFloat(s.totalAmount), 0
    );
    const totalDiscount = sales.reduce(
      (sum, s) => sum + parseFloat(s.discount), 0
    );
    const cashSales = sales.filter((s) => s.paymentType === 'CASH').length;
    const creditSales = sales.filter((s) => s.paymentType === 'CREDIT').length;
    const partialSales = sales.filter((s) => s.paymentType === 'PARTIAL').length;

    // Faida ya jumla
    const totalProfit = sales.reduce((sum, sale) => {
      const saleProfit = sale.saleItems.reduce((itemSum, item) => {
        const profit =
          (parseFloat(item.unitPrice) - parseFloat(item.costPrice)) *
          item.quantity;
        return itemSum + profit;
      }, 0);
      return sum + saleProfit;
    }, 0);

    return successResponse(res, 'Ripoti ya mauzo!', {
      period: { from: startDate, to: endDate },
      summary: {
        totalSales,
        totalRevenue,
        totalDiscount,
        totalProfit,
        cashSales,
        creditSales,
        partialSales,
      },
      sales,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// RIPOTI YA FEDHA (FINANCIAL)
// ============================================================
const getFinancialReport = async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const where = {
      isVoided: false,
      createdAt: { gte: startDate, lte: endDate },
    };

    const sales = await prisma.sale.findMany({
      where,
      include: {
        saleItems: true,
      },
    });

    const totalRevenue = sales.reduce(
      (sum, s) => sum + parseFloat(s.totalAmount), 0
    );

    const totalCost = sales.reduce((sum, sale) => {
      return sum + sale.saleItems.reduce((itemSum, item) => {
        return itemSum + parseFloat(item.costPrice) * item.quantity;
      }, 0);
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const totalDiscount = sales.reduce(
      (sum, s) => sum + parseFloat(s.discount), 0
    );

    const cashRevenue = sales
      .filter((s) => s.paymentType === 'CASH')
      .reduce((sum, s) => sum + parseFloat(s.paidAmount), 0);

    const creditRevenue = sales
      .filter((s) => s.paymentType !== 'CASH')
      .reduce((sum, s) => sum + parseFloat(s.paidAmount), 0);

    // Madeni yaliyolipwa kipindi hiki
    const debtPayments = await prisma.debtPayment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
      },
    });

    const debtPaymentsTotal = debtPayments.reduce(
      (sum, p) => sum + parseFloat(p.amountPaid), 0
    );

    // Jumla ya madeni yanayosubiri
    const pendingDebts = await prisma.debt.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remainingAmount: true },
    });

    return successResponse(res, 'Ripoti ya fedha!', {
      period: { from: startDate, to: endDate },
      revenue: {
        totalRevenue,
        cashRevenue,
        creditRevenue,
        totalDiscount,
      },
      profit: {
        totalCost,
        grossProfit,
        profitMargin:
          totalRevenue > 0
            ? ((grossProfit / totalRevenue) * 100).toFixed(2)
            : 0,
      },
      debts: {
        debtPaymentsReceived: debtPaymentsTotal,
        totalPendingDebts:
          pendingDebts._sum.remainingAmount || 0,
      },
    });
  } catch (error) {
    console.error('Financial report error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// RIPOTI YA INVENTORY
// ============================================================
const getInventoryReport = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + parseFloat(p.costPrice) * p.stockQuantity, 0
    );
    const totalSellingValue = products.reduce(
      (sum, p) => sum + parseFloat(p.sellingPrice) * p.stockQuantity, 0
    );
    const lowStockProducts = products.filter(
      (p) => p.stockQuantity <= p.minStockAlert
    );
    const outOfStockProducts = products.filter(
      (p) => p.stockQuantity === 0
    );

    return successResponse(res, 'Ripoti ya inventory!', {
      summary: {
        totalProducts,
        totalStockValue,
        totalSellingValue,
        potentialProfit: totalSellingValue - totalStockValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      lowStockProducts,
      outOfStockProducts,
      allProducts: products,
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// RIPOTI YA WAFANYAKAZI
// ============================================================
const getStaffReport = async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    });

    const staffReports = await Promise.all(
      users.map(async (user) => {
        const sales = await prisma.sale.findMany({
          where: {
            cashierId: user.id,
            isVoided: false,
            createdAt: { gte: startDate, lte: endDate },
          },
          include: { saleItems: true },
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce(
          (sum, s) => sum + parseFloat(s.totalAmount), 0
        );
        const voids = await prisma.sale.count({
          where: {
            cashierId: user.id,
            isVoided: true,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        return {
          user,
          totalSales,
          totalRevenue,
          voids,
        };
      })
    );

    return successResponse(res, 'Ripoti ya wafanyakazi!', {
      period: { from: startDate, to: endDate },
      staffReports,
    });
  } catch (error) {
    console.error('Staff report error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// BIDHAA ZINAZOENDA HARAKA / POLEPOLE
// ============================================================
const getProductsPerformance = async (req, res) => {
  try {
    const { period = 'this_month', from, to, limit = 10 } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          isVoided: false,
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    // Hesabu bidhaa zinazoenda haraka
    const productMap = {};
    for (const item of saleItems) {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0,
        };
      }
      productMap[item.productId].totalQuantity += item.quantity;
      productMap[item.productId].totalRevenue += parseFloat(item.subtotal);
      productMap[item.productId].totalProfit +=
        (parseFloat(item.unitPrice) - parseFloat(item.costPrice)) *
        item.quantity;
    }

    const sortedProducts = Object.values(productMap).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    return successResponse(res, 'Utendaji wa bidhaa!', {
      period: { from: startDate, to: endDate },
      topSelling: sortedProducts.slice(0, parseInt(limit)),
      slowMoving: sortedProducts.slice(-parseInt(limit)).reverse(),
    });
  } catch (error) {
    console.error('Products performance error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  getSalesReport,
  getFinancialReport,
  getInventoryReport,
  getStaffReport,
  getProductsPerformance,
};