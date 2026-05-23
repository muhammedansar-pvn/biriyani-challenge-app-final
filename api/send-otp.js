// Serverless Backend Handler: Send WhatsApp OTP
// Path: /api/send-otp.js

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
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
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

    // Check if Twilio keys are configured. If not, trigger Developer Mock Mode
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      console.log(`[Developer Mode] Twilio keys missing. Falling back to mock verification for ${cleaned}`);
      return res.status(200).json({
        success: true,
        mockMode: true,
        message: 'Developer Mode active: OTP is 123456'
      });
    }

    // Call Twilio Verify API to send OTP via WhatsApp
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
    
    const params = new URLSearchParams();
    params.append('To', cleaned);
    params.append('Channel', 'whatsapp');

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
      console.error('Twilio Verification Error:', data);
      return res.status(500).json({
        success: false,
        message: data.message || 'Failed to send WhatsApp verification code.'
      });
    }

    return res.status(200).json({
      success: true,
      mockMode: false,
      message: 'Verification code sent to WhatsApp!'
    });

  } catch (error) {
    console.error('OTP Send Server Failure:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred.'
    });
  }
}
