import { SMSService } from './sms.service';

export class PhoneVerificationService {
  private static readonly OTP_EXPIRY = 10 * 60 * 1000; // 10 mins
  private static otpStore = new Map<string, {
    otp: string;
    expires: number;
    attempts: number;
  }>();
  private static readonly MAX_ATTEMPTS = 3;
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
    }

  private static formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // For Kenyan numbers
  if (digits.startsWith('0')) {
    // Replace the leading 0 with +254
    return '+254' + digits.substring(1);
  }

  // If the number doesn't start with +, add it
  if (!phoneNumber.startsWith('+')) {
    return '+' + digits;
  }

  return phoneNumber;
}

  static async sendOTP(phoneNumber: string, userId: string): Promise<void> {
    // Check if there's an existing OTP that hasn't expired

     const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const existing = this.otpStore.get(userId);
    if (existing && Date.now() < existing.expires) {
      const timeLeft = Math.ceil((existing.expires - Date.now()) / 1000);
      throw new Error(`Please wait ${timeLeft} seconds before requesting a new OTP`);
      }

    const otp = this.generateOTP();

    // Store OTP with expiry and reset attempts
    this.otpStore.set(userId, {
      otp,
      expires: Date.now() + this.OTP_EXPIRY,
      attempts: 0
    });

    // Send OTP
    const message = `Your verification code is: ${otp}. Valid for 10 minutes.`;
  const sent = await SMSService.sendSMS(formattedPhone, message);

    if (!sent) {
      this.otpStore.delete(userId);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  static async verifyOTP(userId: string, otp: string): Promise<boolean> {
    const storedData = this.otpStore.get(userId);

    if (!storedData) return false;

    // Check expiry
    if (Date.now() > storedData.expires) {
      this.otpStore.delete(userId);
      return false;
    }

    if (storedData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(userId);
      throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    storedData.attempts++;
    this.otpStore.set(userId, storedData);

    if (storedData.otp !== otp) return false;
    this.otpStore.delete(userId);

    return true;
  }
}
