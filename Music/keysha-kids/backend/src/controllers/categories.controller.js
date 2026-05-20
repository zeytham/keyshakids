const { prisma } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { MODULES } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// PATA CATEGORIES ZOTE
// ============================================================
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(res, 'Categories zote!', categories);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ONGEZA CATEGORY MPYA
// ============================================================
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return errorResponse(res, 'Jaza jina la category!', 400);
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_CATEGORY',
      module: MODULES.CATEGORIES,
      description: `${req.user.name} ameongeza category: ${name}`,
      newValue: { name },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Category imeongezwa vizuri!', category, 201);
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse(res, 'Category hii ipo tayari!', 409);
    }
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// BADILISHA CATEGORY
// ============================================================
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return errorResponse(res, 'Jaza jina la category!', 400);
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Category hii haipatikani!', 404);
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_CATEGORY',
      module: MODULES.CATEGORIES,
      description: `${req.user.name} amebadilisha category: ${existing.name} → ${name}`,
      oldValue: { name: existing.name },
      newValue: { name },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Category imebadilishwa vizuri!', category);
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse(res, 'Category hii ipo tayari!', 409);
    }
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// FUTA CATEGORY
// ============================================================
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return errorResponse(res, 'Category hii haipatikani!', 404);
    }

    if (existing._count.products > 0) {
      return errorResponse(
        res,
        'Huwezi kufuta category yenye bidhaa — hamisha bidhaa kwanza!',
        400
      );
    }

    await prisma.category.delete({ where: { id } });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE_CATEGORY',
      module: MODULES.CATEGORIES,
      description: `${req.user.name} amefuta category: ${existing.name}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Category imefutwa vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ONGEZA SUBCATEGORY
// ============================================================
const createSubCategory = async (req, res) => {
  try {
    const { id: categoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return errorResponse(res, 'Jaza jina la subcategory!', 400);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse(res, 'Category hii haipatikani!', 404);
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name: name.trim(),
        categoryId,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_SUBCATEGORY',
      module: MODULES.CATEGORIES,
      description: `${req.user.name} ameongeza subcategory: ${name} kwenye ${category.name}`,
      newValue: { name, categoryId },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Subcategory imeongezwa vizuri!', subCategory, 201);
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse(res, 'Subcategory hii ipo tayari kwenye category hii!', 409);
    }
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// BADILISHA SUBCATEGORY
// ============================================================
const updateSubCategory = async (req, res) => {
  try {
    const { subId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return errorResponse(res, 'Jaza jina la subcategory!', 400);
    }

    const existing = await prisma.subCategory.findUnique({
      where: { id: subId },
    });

    if (!existing) {
      return errorResponse(res, 'Subcategory hii haipatikani!', 404);
    }

    const subCategory = await prisma.subCategory.update({
      where: { id: subId },
      data: { name: name.trim() },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_SUBCATEGORY',
      module: MODULES.CATEGORIES,
      description: `${req.user.name} amebadilisha subcategory: ${existing.name} → ${name}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Subcategory imebadilishwa vizuri!', subCategory);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// FUTA SUBCATEGORY
// ============================================================
const deleteSubCategory = async (req, res) => {
  try {
    const { subId } = req.params;

    const existing = await prisma.subCategory.findUnique({
      where: { id: subId },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return errorResponse(res, 'Subcategory hii haipatikani!', 404);
    }

    if (existing._count.products > 0) {
      return errorResponse(
        res,
        'Huwezi kufuta subcategory yenye bidhaa — hamisha bidhaa kwanza!',
        400
      );
    }

    await prisma.subCategory.delete({ where: { id: subId } });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE_SUBCATEGORY',
      module: MODULES.CATEGORIES,
      description: `${req.user.name} amefuta subcategory: ${existing.name}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Subcategory imefutwa vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
};