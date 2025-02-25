import twilio from 'twilio';
import { twilioConfig } from '../config/sms.config';

export class SMSService {
  private static client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: twilioConfig.phoneNumber,
        to: to
      });

      console.log(`SMS sent successfully. SID: ${response.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
}
