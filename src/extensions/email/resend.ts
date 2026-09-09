import { render } from '@react-email/components';
import { Resend, type CreateEmailOptions } from 'resend';

import type {
  EmailConfigs,
  EmailMessage,
  EmailProvider,
  EmailSendResult,
} from '.';

/**
 * Resend email provider configs
 * @docs https://resend.com/docs/send-with-nextjs
 */
export interface ResendConfigs extends EmailConfigs {
  apiKey: string;
  defaultFrom?: string;
}

/**
 * Resend email provider implementation
 * @website https://resend.com/
 */
export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  configs: ResendConfigs;

  private client: Resend;

  constructor(configs: ResendConfigs) {
    this.configs = configs;
    this.client = new Resend(configs.apiKey);
  }

  async sendEmail(email: EmailMessage): Promise<EmailSendResult> {
    try {
      // Convert our format to Resend format
      const resendEmail: Partial<CreateEmailOptions> = {
        from: email.from || this.configs.defaultFrom || '',
        to: Array.isArray(email.to) ? email.to : [email.to],
        subject: email.subject,
      };

      // Add optional fields only if they exist
      if (email.cc) {
        resendEmail.cc = Array.isArray(email.cc) ? email.cc : [email.cc];
      }
      if (email.bcc) {
        resendEmail.bcc = Array.isArray(email.bcc) ? email.bcc : [email.bcc];
      }
      if (email.text) {
        resendEmail.text = email.text;
      }
      if (email.html) {
        resendEmail.html = email.html;
      }
      if (email.replyTo) {
        resendEmail.replyTo = email.replyTo;
      }
      if (email.attachments) {
        resendEmail.attachments = email.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType,
        }));
      }
      if (email.tags) {
        resendEmail.tags = email.tags.map((tag) => ({
          name: 'category',
          value: tag,
        }));
      }
      if (email.headers) {
        resendEmail.headers = email.headers;
      }

      if (email.react) {
        // Explicitly render React to HTML for better compatibility (especially on Edge/Workers)
        const html = await render(email.react);
        resendEmail.html = html;
      }

      const result = await this.client.emails.send(
        resendEmail as CreateEmailOptions
      );

      console.log('resend email result', result);

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }
}

/**
 * Create Resend provider with configs
 */
export function createResendProvider(configs: ResendConfigs): ResendProvider {
  return new ResendProvider(configs);
}
