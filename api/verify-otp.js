// Serverless Backend Handler: Verify WhatsApp OTP
// Path: /api/verify-otp.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone and verification code are required' });
    }

    // Clean and format phone number: e.g. +91XXXXXXXXXX
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = `+${cleaned}`;
    } else {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit number' });
    }

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_VERIFY_SERVICE_SID
    } = process.env;

    // Check if Twilio keys are configured. If not, trigger Developer Mock Mode check
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      if (code === '123456') {
        console.log(`[Developer Mode] Approved mock verification code for ${cleaned}`);
        return res.status(200).json({
          success: true,
          message: 'WhatsApp number verified successfully (Developer Mode)!'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Use 123456 for Developer Mode.'
        });
      }
    }

    // Call Twilio Verify API to verify the OTP code
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    
    const params = new URLSearchParams();
    params.append('To', cleaned);
    params.append('Code', code.trim());

    const twilioResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio VerificationCheck Error:', data);
      return res.status(400).json({
        success: false,
        message: data.message || 'Verification check failed.'
      });
    }

    if (data.status === 'approved') {
      return res.status(200).json({
        success: true,
        message: 'WhatsApp number verified successfully! ✅'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

  } catch (error) {
    console.error('OTP Verify Server Failure:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred.'
    });
  }
}
