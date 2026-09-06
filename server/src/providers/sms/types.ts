export interface SendOtpParams {
  phone: string;
  code: string;
  /** Purpose of the message, useful for drivers that map to DLT templates. */
  purpose: string;
}

export interface SmsProvider {
  sendOtp(params: SendOtpParams): Promise<void>;
}
