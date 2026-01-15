const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // Make sure you have this env var

const attachIfUserExists = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      // Verify the JWT and decode the payload
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

      // Supabase stores user ID in the 'sub' claim of JWT
      req.userId = decoded.sub;

    } catch (error) {
      console.warn('Invalid or expired token:', error.message);
      // No userId set, but we don't block the request
    }
  }

  next();
};

module.exports = attachIfUserExists;
