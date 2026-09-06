export interface SendOtpParams {
  phone: string;
  code: string;
  /** Purpose of the message, useful for drivers that map to DLT templates. */
  purpose: string;
}

export interface SmsProvider {
  /**
   * Dev-only drivers (console) may surface the code in the API response so
   * the UI can display it without a real SMS. Real providers (MSG91) must
   * always report false — the code is only ever delivered by SMS.
   */
  readonly exposesDevOtp: boolean;

  sendOtp(params: SendOtpParams): Promise<void>;
}
