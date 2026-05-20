const { prisma } = require('../config/database');
const { hashPassword, comparePassword, validatePin, validatePassword } = require('../utils/password');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLog');
const { ROLES, MODULES } = require('../config/constants');
const { getIpAddress } = require('../middleware/auth');

// ============================================================
// SETUP OWNER (Mara ya kwanza tu)
// ============================================================
const setupOwner = async (req, res) => {
  try {
    // Angalia kama Owner tayari yupo
    const existingOwner = await prisma.user.findFirst({
      where: { role: ROLES.OWNER },
    });

    if (existingOwner) {
      return errorResponse(res, 'Owner ameshasajiliwa!', 400);
    }

    const { name, phone, password, pin } = req.body;

    // Validate
    if (!name || !phone || !password || !pin) {
      return errorResponse(res, 'Jaza taarifa zote!', 400);
    }

    if (!validatePassword(password)) {
      return errorResponse(
        res,
        'Password lazima iwe na herufi kubwa, ndogo, na nambari — angalau herufi 8!',
        400
      );
    }

    if (!validatePin(pin)) {
      return errorResponse(res, 'PIN lazima iwe nambari 4-6!', 400);
    }

    const passwordHash = await hashPassword(password);
    const pinHash = await hashPassword(pin);

    const owner = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        pinHash,
        role: ROLES.OWNER,
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens(owner.id, owner.role);

    return successResponse(res, 'Owner amesajiliwa vizuri!', {
      user: owner,
      accessToken,
      refreshToken,
    }, 201);

  } catch (error) {
    console.error('Setup owner error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// LOGIN
// ============================================================
const login = async (req, res) => {
  try {
    const { phone, password, pin } = req.body;

    if (!phone) {
      return errorResponse(res, 'Weka namba ya simu!', 400);
    }

    if (!password && !pin) {
      return errorResponse(res, 'Weka password au PIN!', 400);
    }

    // Tafuta user
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'Namba ya simu au nywila si sahihi!', 401);
    }

    // Thibitisha password au PIN
    let isValid = false;

    if (password && user.passwordHash) {
      isValid = await comparePassword(password, user.passwordHash);
    } else if (pin && user.pinHash) {
      isValid = await comparePassword(pin, user.pinHash);
    }

    if (!isValid) {
      return errorResponse(res, 'Namba ya simu au nywila si sahihi!', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Rekodi audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      module: MODULES.AUTH,
      description: `${user.name} ameingia mfumoni`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Umeingia vizuri!', {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// REFRESH TOKEN
// ============================================================
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return errorResponse(res, 'Refresh token haipo!', 400);
    }

    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'Akaunti hii haipo!', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.role
    );

    return successResponse(res, 'Token imefanywa upya!', {
      accessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error) {
    return errorResponse(res, 'Refresh token si sahihi au imekwisha!', 401);
  }
};

// ============================================================
// LOGOUT
// ============================================================
const logout = async (req, res) => {
  try {
    await createAuditLog({
      userId: req.user.id,
      action: 'LOGOUT',
      module: MODULES.AUTH,
      description: `${req.user.name} ametoka mfumoni`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Umetoka vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// GET PROFILE
// ============================================================
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return successResponse(res, 'Taarifa za mtumiaji!', user);
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// CHANGE PASSWORD
// ============================================================
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 'Weka password ya zamani na mpya!', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse(res, 'Password ya zamani si sahihi!', 400);
    }

    if (!validatePassword(newPassword)) {
      return errorResponse(
        res,
        'Password mpya lazima iwe na herufi kubwa, ndogo, na nambari — angalau herufi 8!',
        400
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      module: MODULES.AUTH,
      description: `${req.user.name} amebadilisha password`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'Password imebadilishwa vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

// ============================================================
// CHANGE PIN
// ============================================================
const changePin = async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
      return errorResponse(res, 'Weka PIN ya zamani na mpya!', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isValid = await comparePassword(oldPin, user.pinHash);
    if (!isValid) {
      return errorResponse(res, 'PIN ya zamani si sahihi!', 400);
    }

    if (!validatePin(newPin)) {
      return errorResponse(res, 'PIN lazima iwe nambari 4-6!', 400);
    }

    const pinHash = await hashPassword(newPin);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { pinHash },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CHANGE_PIN',
      module: MODULES.AUTH,
      description: `${req.user.name} amebadilisha PIN`,
      ipAddress: getIpAddress(req),
    });

    return successResponse(res, 'PIN imebadilishwa vizuri!');
  } catch (error) {
    return errorResponse(res, 'Hitilafu ya seva!', 500);
  }
};

module.exports = {
  setupOwner,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  changePin,
};