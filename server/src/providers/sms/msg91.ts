import type { SendOtpParams, SmsProvider } from "./types";

const FLOW_URL = "https://control.msg91.com/api/v5/flow/";

/**
 * MSG91 "flow" (transactional DLT template) driver.
 * The DLT template must contain the variable {{OTP}} (or a named variable
 * mapped below). Configure MSG91_OTP_TEMPLATE_ID with the template ID.
 */
export class Msg91SmsProvider implements SmsProvider {
  constructor(
    private authKey: string,
    private templateId: string,
    private senderId?: string
  ) {}

  async sendOtp({ phone, code, purpose }: SendOtpParams): Promise<void> {
    const response = await fetch(FLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: this.authKey,
      },
      body: JSON.stringify({
        template_id: this.templateId,
        short_url: "0",
        recipients: [{ mobiles: phone, OTP: code, PURPOSE: purpose }],
        ...(this.senderId ? { sender: this.senderId } : {}),
      }),
    });

    const body = (await response.json().catch(() => ({}))) as { type?: string; message?: string };
    if (!response.ok || body.type === "error") {
      throw new Error(`MSG91 send failed: ${body.message ?? response.status}`);
    }
  }
}
