interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  callbackUrl: string;
}

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

export const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || "your_mpesa_consumer_key",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "your_mpesa_consumer_secret",
  passkey: process.env.MPESA_PASSKEY || "your_mpesa_passkey",
  shortcode: process.env.MPESA_SHORTCODE || "your_mpesa_shortcode",
  callbackUrl: process.env.MPESA_CALLBACK_URL || "https://aviator-5vrq.onrender.com/api/payments"
};

export const paypalConfig: PayPalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID || "your_paypal_client_id",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "your_paypal_client_secret",
  environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || "sandbox"
};
