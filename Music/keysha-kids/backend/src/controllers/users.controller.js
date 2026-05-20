const { prisma } = require('../config/database');
const { hashPassword, validatePin, validatePassword } = require('../utils/password');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { ROLES, MODULES } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// PATA WAFANYAKAZI WOTE
// ============================================================
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      role: ROLES.CASHIER,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginationResponse(res, 'Wafanyakazi wote!', users, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// PATA MFANYAKAZI MMOJA
// ============================================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Mfanyakazi huyu hapatikani!', 404);
    }

    return successResponse(res, 'Taarifa za mfanyakazi!', user);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ONGEZA MFANYAKAZI MPYA
// ============================================================
const createUser = async (req, res) => {
  try {
    const { name, phone, pin, password } = req.body;

    if (!name || !phone || !pin) {
      return errorResponse(res, 'Jaza taarifa zote — jina, simu, na PIN!', 400);
    }

    if (!validatePin(pin)) {
      return errorResponse(res, 'PIN lazima iwe nambari 4-6!', 400);
    }

    if (password && !validatePassword(password)) {
      return errorResponse(
        res,
        'Password lazima iwe na herufi kubwa, ndogo, na nambari — angalau herufi 8!',
        400
      );
    }

    // Angalia simu haipo tayari
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return errorResponse(res, 'Namba ya simu hii ipo tayari!', 409);
    }

    const pinHash = await hashPassword(pin);
    const passwordHash = password ? await hashPassword(password) : null;

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        pinHash,
        passwordHash,
        role: ROLES.CASHIER,
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE_USER',
      module: MODULES.USERS,
      description: `${req.user.name} ameongeza mfanyakazi: ${name}`,
      newValue: { name, phone, role: ROLES.CASHIER },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Mfanyakazi ameongezwa vizuri!', user, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// BADILISHA TAARIFA ZA MFANYAKAZI
// ============================================================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse(res, 'Mfanyakazi huyu hapatikani!', 404);
    }

    // Angalia simu haijachukuliwa na mtu mwingine
    if (phone && phone !== user.phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return errorResponse(res, 'Namba ya simu hii ipo tayari!', 409);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_USER',
      module: MODULES.USERS,
      description: `${req.user.name} amebadilisha taarifa za: ${user.name}`,
      oldValue: { name: user.name, phone: user.phone },
      newValue: { name: updatedUser.name, phone: updatedUser.phone },
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Taarifa zimebadilishwa vizuri!', updatedUser);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// ZIMA / WASHA AKAUNTI YA MFANYAKAZI
// ============================================================
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse(res, 'Mfanyakazi huyu hapatikani!', 404);
    }

    // Usimzime Owner
    if (user.role === ROLES.OWNER) {
      return errorResponse(res, 'Huwezi kuzima akaunti ya Owner!', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: user.isActive ? 'DEACTIVATE_USER' : 'ACTIVATE_USER',
      module: MODULES.USERS,
      description: `${req.user.name} ${user.isActive ? 'amezima' : 'amewasha'} akaunti ya: ${user.name}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(
      res,
      `Akaunti ${updatedUser.isActive ? 'imewashwa' : 'imezimwa'} vizuri!`,
      updatedUser
    );
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// RESET PIN YA MFANYAKAZI (Owner tu)
// ============================================================
const resetUserPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPin } = req.body;

    if (!newPin || !validatePin(newPin)) {
      return errorResponse(res, 'PIN lazima iwe nambari 4-6!', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse(res, 'Mfanyakazi huyu hapatikani!', 404);
    }

    const pinHash = await hashPassword(newPin);

    await prisma.user.update({
      where: { id },
      data: { pinHash },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'RESET_PIN',
      module: MODULES.USERS,
      description: `${req.user.name} amebadilisha PIN ya: ${user.name}`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'PIN imebadilishwa vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPin,
};