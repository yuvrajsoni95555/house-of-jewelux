/**
 * HOUSE OF JEWELUX — In-Memory Sliding Window Rate Limiter
 * Protects authentication, payment, and checkout endpoints from brute-force & denial of service.
 */

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 60, message = 'Too many requests, please try again shortly.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.clients = new Map();

    // Periodic cleanup of stale client records every 5 minutes
    setInterval(() => this.cleanup(), 300000).unref();
  }

  middleware() {
    return (req, res, next) => {
      // In test mode, bypass rate limiter
      if (process.env.NODE_ENV === 'test') {
        return next();
      }

      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      const now = Date.now();

      let client = this.clients.get(ip);
      if (!client) {
        client = { timestamps: [] };
        this.clients.set(ip, client);
      }

      // Filter timestamps outside current window
      const windowStart = now - this.windowMs;
      client.timestamps = client.timestamps.filter(ts => ts > windowStart);

      if (client.timestamps.length >= this.maxRequests) {
        res.setHeader('Retry-After', Math.ceil(this.windowMs / 1000));
        return res.status(429).json({
          success: false,
          error: this.message,
          retryAfterSeconds: Math.ceil(this.windowMs / 1000)
        });
      }

      client.timestamps.push(now);
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - client.timestamps.length));
      next();
    };
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [ip, data] of this.clients.entries()) {
      data.timestamps = data.timestamps.filter(ts => ts > windowStart);
      if (data.timestamps.length === 0) {
        this.clients.delete(ip);
      }
    }
  }
}

// Pre-configured rate limiters
const authLimiter = new RateLimiter(60000, 15, 'Too many login attempts. Please wait 1 minute.').middleware();
const paymentLimiter = new RateLimiter(60000, 25, 'Payment request rate limit reached. Please wait a moment.').middleware();
const globalLimiter = new RateLimiter(60000, 120, 'Request rate limit exceeded. Please wait.').middleware();

module.exports = {
  RateLimiter,
  authLimiter,
  paymentLimiter,
  globalLimiter
};
