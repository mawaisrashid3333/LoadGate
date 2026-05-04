/**
 * Auth Controller
 * Handles authentication operations
 */

const jwt = require('jsonwebtoken');

// Hardcoded credentials
const VALID_USERNAME = 'Main@Admin';
const VALID_PASSWORD = 'Admin@1234';

class AuthController {
  /**
   * Login endpoint
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
        });
      }

      // Validate credentials (hardcoded)
      if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          username: VALID_USERNAME,
          role: 'admin',
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          username: VALID_USERNAME,
          role: 'admin',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Verify token endpoint
   */
  static async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      return res.status(200).json({
        success: true,
        user: {
          username: decoded.username,
          role: decoded.role,
        },
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  }
}

module.exports = AuthController;
