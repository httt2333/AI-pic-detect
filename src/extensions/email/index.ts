import { ReactNode } from 'react';

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Email message interface
 */
export interface EmailMessage {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  headers?: Record<string, string>;
  react?: ReactNode;
}

/**
 * Email send result interface
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

/**
 * Email configs interface
 */
export interface EmailConfigs {
  [key: string]: any;
}

/**
 * Email provider interface
 */
export interface EmailProvider {
  // provider name
  readonly name: string;

  // provider configs
  configs: EmailConfigs;

  // send email
  sendEmail(email: EmailMessage): Promise<EmailSendResult>;
}

/**
 * Email manager to manage all email providers
 */
export class EmailManager {
  // email providers
  private providers: EmailProvider[] = [];
  private defaultProvider?: EmailProvider;

  // add email provider
  addProvider(provider: EmailProvider, isDefault = false) {
    this.providers.push(provider);
    if (isDefault) {
      this.defaultProvider = provider;
    }
  }

  // get provider by name
  getProvider(name: string): EmailProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }

  // send email using default provider
  async sendEmail(email: EmailMessage): Promise<EmailSendResult> {
    // set default provider if not set
    if (!this.defaultProvider && this.providers.length > 0) {
      this.defaultProvider = this.providers[0];
    }

    if (!this.defaultProvider) {
      throw new Error('No email provider configured');
    }

    return this.defaultProvider.sendEmail(email);
  }

  // send email using specific provider
  async sendEmailWithProvider(
    email: EmailMessage,
    providerName: string
  ): Promise<EmailSendResult> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Email provider '${providerName}' not found`);
    }
    return provider.sendEmail(email);
  }

  // get all provider names
  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }
}

// Global email manager instance
export const emailManager = new EmailManager();

// Export all providers
export * from './resend';
