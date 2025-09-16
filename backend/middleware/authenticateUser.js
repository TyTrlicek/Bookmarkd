// backend/middleware/authenticateUser.js

const jwt = require('jsonwebtoken');

function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {}, (err, decoded) => {
    if (err || !decoded) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.sub;
    req.user = decoded;
    next();
  });
}

module.exports = authenticateUser;
