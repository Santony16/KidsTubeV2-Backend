const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kidstube-secret-key';

const authenticateToken = (req, res, next) => {
  // Get the token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add the user info to the request object for use in route handlers
    req.user = decoded;
    
    // Proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = { authenticateToken, JWT_SECRET };
