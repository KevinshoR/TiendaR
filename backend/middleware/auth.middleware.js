const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado, token faltante' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      store_id: decoded.store_id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'No autorizado, token inválido' });
  }
}

module.exports = authMiddleware;
