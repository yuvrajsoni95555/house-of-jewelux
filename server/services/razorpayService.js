/**
 * HOUSE OF JEWELUX — Razorpay Payment Gateway Service
 * Handles server-side order generation, cryptographic signature verification,
 * and webhook authentication with PCI-DSS compliance standards.
 */

const crypto = require('crypto');
const https = require('https');

class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_GATEWAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_GATEWAY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  isConfigured() {
    return Boolean(
      this.keyId && 
      this.keySecret && 
      !this.keyId.includes('placeholder') && 
      !this.keySecret.includes('placeholder')
    );
  }

  getPublicKey() {
    return this.keyId;
  }

  /**
   * Create an official payment order via Razorpay API
   * @param {Object} params { amountInPaise, currency, receipt, notes }
   */
  async createOrder({ amountInPaise, currency = 'INR', receipt, notes = {} }) {
    if (!this.isConfigured()) {
      // In development or when credentials are not yet configured, return mock order descriptor for tests
      if (process.env.NODE_ENV === 'test') { // automated tests only: never fake a payment order anywhere else
        return {
          id: `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          entity: 'order',
          amount: amountInPaise,
          currency: currency,
          receipt: receipt,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000)
        };
      }
      throw new Error('Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in environment.');
    }

    const payload = JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt: receipt.slice(0, 40), // Razorpay receipt max 40 chars
      notes: {
        atelier: 'House of Jewelux Jaipur',
        ...notes
      }
    });

    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.razorpay.com',
        port: 443,
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': authHeader
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error?.description || `Razorpay order creation failed with status ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Razorpay response: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Razorpay connection error: ${err.message}`));
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Razorpay request timed out'));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Verify Payment Signature using constant-time comparison
   * @param {Object} params { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    const secret = this.keySecret || (process.env.NODE_ENV === 'test' ? 'test_secret_for_signature_verification' : '');
    if (!secret) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    try {
      const sigBuf = Buffer.from(razorpaySignature, 'utf8');
      const expBuf = Buffer.from(expected, 'utf8');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch (e) {
      return false;
    }
  }

  /**
   * Verify Webhook Signature
   * @param {string|Buffer} rawBody 
   * @param {string} signature 
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret || !signature || !rawBody) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expected, 'utf8');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch (e) {
      return false;
    }
  }
}

module.exports = new RazorpayService();
