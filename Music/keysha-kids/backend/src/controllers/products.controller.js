const { prisma } = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { MODULES, STOCK_MOVEMENT } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// PATA BIDHAA ZOTE
// ============================================================
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId, subCategoryId, lowStock } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { supplier: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(subCategoryId && { subCategoryId }),
      ...(lowStock === 'true' && {
        stockQuantity: { lte: prisma.product.fields.minStockAlert },
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return paginationResponse(res, 'Bidhaa zote!', products, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA BIDHAA ZINAZOKWISHA (LOW STOCK)
// ============================================================
const getLowStockProducts = async (req, res) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      WHERE p."stockQuantity" <= p."minStockAlert"
      AND p."isActive" = true
      ORDER BY p."stockQuantity" ASC
    `;

    return successResponse(res, 'Bidhaa zinazokwisha!', products);
  } catch (error) {
    console.error('Low stock error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA BIDHAA MOJA
// ============================================================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return errorResponse(res, 'Bidhaa hii haipatikani!', 404);
    }

    return successResponse(res, 'Taarifa za bidhaa!', product);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ONGEZA BIDHAA MPYA
// ============================================================
const createProduct = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      subCategoryId,
      size,
      color,
      costPrice,
      sellingPrice,
      stockQuantity,
      minStockAlert,
      supplier,
    } = req.body;

    if (!name || !categoryId || !costPrice || !sellingPrice) {
      return errorResponse(res, 'Jaza taarifa zote muhimu!', 400);
    }

    if (parseFloat(costPrice) <= 0 || parseFloat(sellingPrice) <= 0) {
      return errorResponse(res, 'Bei lazima iwe zaidi ya sifuri!', 400);
    }

    if (parseFloat(sellingPrice) < parseFloat(costPrice)) {
      return errorResponse(res, 'Bei ya kuuzia haiwezi kuwa chini ya bei ya kununulia!', 400);
    }

    // Angalia category ipo
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return errorResponse(res, 'Category hii haipatikani!', 404);
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        subCategoryId: subCategoryId || null,
        size: size || null,
        color: color || null,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity) || 0,
        minStockAlert: parseInt(minStockAlert) || 5,
        supplier: supplier || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
    });

    // Rekodi stock history kama stock ya awali ipo
    if (parseInt(stockQuantity) > 0) {
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          type: STOCK_MOVEMENT.IN,
          quantity: parseInt(stockQuantity),
          reason: 'Stock ya awali',
        },
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_PRODUCT',
      module: MODULES.INVENTORY,
      description: `${req.user.name} ameongeza bidhaa: ${name}`,
      newValue: { name, costPrice, sellingPrice, stockQuantity },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Bidhaa imeongezwa vizuri!', product, 201);
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// BADILISHA BIDHAA
// ============================================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      subCategoryId,
      size,
      color,
      costPrice,
      sellingPrice,
      minStockAlert,
      supplier,
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Bidhaa hii haipatikani!', 404);
    }

    // Kama bei imebadilika — rekodi price history
    const priceChanged =
      (costPrice && parseFloat(costPrice) !== parseFloat(existing.costPrice)) ||
      (sellingPrice && parseFloat(sellingPrice) !== parseFloat(existing.sellingPrice));

    if (priceChanged) {
      await prisma.priceHistory.create({
        data: {
          productId: id,
          oldCostPrice: existing.costPrice,
          newCostPrice: parseFloat(costPrice) || existing.costPrice,
          oldSellingPrice: existing.sellingPrice,
          newSellingPrice: parseFloat(sellingPrice) || existing.sellingPrice,
        },
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(subCategoryId !== undefined && { subCategoryId: subCategoryId || null }),
        ...(size !== undefined && { size: size || null }),
        ...(color !== undefined && { color: color || null }),
        ...(costPrice && { costPrice: parseFloat(costPrice) }),
        ...(sellingPrice && { sellingPrice: parseFloat(sellingPrice) }),
        ...(minStockAlert && { minStockAlert: parseInt(minStockAlert) }),
        ...(supplier !== undefined && { supplier: supplier || null }),
      },
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_PRODUCT',
      module: MODULES.INVENTORY,
      description: `${req.user.name} amebadilisha bidhaa: ${existing.name}`,
      oldValue: { costPrice: existing.costPrice, sellingPrice: existing.sellingPrice },
      newValue: { costPrice: product.costPrice, sellingPrice: product.sellingPrice },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Bidhaa imebadilishwa vizuri!', product);
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ONGEZA STOCK (STOCK IN)
// ============================================================
const addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, costPrice } = req.body;

    if (!quantity || parseInt(quantity) <= 0) {
      return errorResponse(res, 'Weka idadi sahihi ya stock!', 400);
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return errorResponse(res, 'Bidhaa hii haipatikani!', 404);
    }

    // Kama bei ya kununulia imebadilika
    if (costPrice && parseFloat(costPrice) !== parseFloat(product.costPrice)) {
      await prisma.priceHistory.create({
        data: {
          productId: id,
          oldCostPrice: product.costPrice,
          newCostPrice: parseFloat(costPrice),
          oldSellingPrice: product.sellingPrice,
          newSellingPrice: product.sellingPrice,
        },
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: { increment: parseInt(quantity) },
        ...(costPrice && { costPrice: parseFloat(costPrice) }),
      },
    });

    await prisma.stockHistory.create({
      data: {
        productId: id,
        type: STOCK_MOVEMENT.IN,
        quantity: parseInt(quantity),
        reason: reason || 'Stock imeongezwa',
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'STOCK_IN',
      module: MODULES.INVENTORY,
      description: `${req.user.name} ameongeza stock ya ${product.name}: +${quantity}`,
      oldValue: { stock: product.stockQuantity },
      newValue: { stock: updatedProduct.stockQuantity },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Stock imeongezwa vizuri!', {
      productId: id,
      oldStock: product.stockQuantity,
      addedStock: parseInt(quantity),
      newStock: updatedProduct.stockQuantity,
    });
  } catch (error) {
    console.error('Add stock error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// REKEBISHA STOCK (ADJUSTMENT)
// ============================================================
const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason } = req.body;

    if (newQuantity === undefined || newQuantity === null) {
      return errorResponse(res, 'Weka idadi mpya ya stock!', 400);
    }

    if (!reason || reason.trim() === '') {
      return errorResponse(res, 'Weka sababu ya marekebisho!', 400);
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return errorResponse(res, 'Bidhaa hii haipatikani!', 404);
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { stockQuantity: parseInt(newQuantity) },
      }),
      prisma.stockAdjustment.create({
        data: {
          productId: id,
          userId: req.user.id,
          oldQty: product.stockQuantity,
          newQty: parseInt(newQuantity),
          reason: reason.trim(),
        },
      }),
      prisma.stockHistory.create({
        data: {
          productId: id,
          type: STOCK_MOVEMENT.ADJUSTMENT,
          quantity: parseInt(newQuantity) - product.stockQuantity,
          reason: reason.trim(),
        },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      action: 'STOCK_ADJUSTMENT',
      module: MODULES.INVENTORY,
      description: `${req.user.name} amerekebisha stock ya ${product.name}: ${product.stockQuantity} → ${newQuantity}`,
      oldValue: { stock: product.stockQuantity },
      newValue: { stock: parseInt(newQuantity), reason },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Stock imerekebishwa vizuri!', {
      productId: id,
      oldStock: product.stockQuantity,
      newStock: parseInt(newQuantity),
      reason,
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ZIMA BIDHAA (Soft Delete)
// ============================================================
const deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return errorResponse(res, 'Bidhaa hii haipatikani!', 404);
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DEACTIVATE_PRODUCT',
      module: MODULES.INVENTORY,
      description: `${req.user.name} amezima bidhaa: ${product.name}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Bidhaa imezimwa vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  getAllProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  addStock,
  adjustStock,
  deactivateProduct,
};