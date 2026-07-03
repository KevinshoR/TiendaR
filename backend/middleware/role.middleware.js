function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

function soloLectura(req, res, next) {
  if (req.user && req.user.role === 'contador' && req.method !== 'GET') {
    return res.status(403).json({ message: 'Tu rol de contador es de solo lectura' });
  }
  next();
}

module.exports = { requireRole, soloLectura };
