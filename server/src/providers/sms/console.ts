import type { SendOtpParams, SmsProvider } from "./types";
import { maskPhone } from "../../lib/phone";

/**
 * Development driver: prints the OTP to the server console instead of
 * sending an SMS. Lets the whole login flow be exercised before DLT
 * templates and MSG91 credentials are ready.
 */
export const consoleSmsProvider: SmsProvider = {
  exposesDevOtp: true,

  async sendOtp({ phone, code, purpose }: SendOtpParams) {
    console.log(
      `[sms:console] purpose=${purpose} to=${maskPhone(phone)} OTP=${code} (dev only — not delivered)`
    );
  },
};
