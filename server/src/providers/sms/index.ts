import { env } from "../../env";
import type { SmsProvider } from "./types";
import { consoleSmsProvider } from "./console";
import { Msg91SmsProvider } from "./msg91";

export type { SmsProvider, SendOtpParams } from "./types";

let provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (provider) return provider;

  if (env.SMS_DRIVER === "msg91") {
    if (!env.MSG91_AUTH_KEY || !env.MSG91_OTP_TEMPLATE_ID) {
      throw new Error(
        "SMS_DRIVER=msg91 requires MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID in the environment"
      );
    }
    provider = new Msg91SmsProvider(env.MSG91_AUTH_KEY, env.MSG91_OTP_TEMPLATE_ID, env.MSG91_SENDER_ID);
    console.log("[sms] using MSG91 provider");
  } else {
    provider = consoleSmsProvider;
    console.log("[sms] using console driver (OTPs are printed, not sent)");
  }
  return provider;
}
