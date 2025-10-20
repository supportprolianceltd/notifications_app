// src/channels/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as hbs from 'handlebars';
import { TemplatesService } from '../../templates/templates.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { TenantEmailProvidersService } from '../../tenant-email-providers/tenant-email-providers.service';
import { emailsSentCounter } from '../../metrics/metrics.controller';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporters = new Map<string, nodemailer.Transporter>(); // cache by tenantId
  private usingDefaultConfig = new Set<string>(); // track which tenants are using default config
  private tenantEmailLimiters = new Map<string, RateLimiterMemory>();

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly notificationsService: NotificationsService,
    private readonly tenantEmailProvidersService: TenantEmailProvidersService,
  ) {}

  /** Get or create transporter for a tenant */
  private async getTransporterForTenant(tenantId: string): Promise<nodemailer.Transporter> {
    if (this.transporters.has(tenantId)) {
      return this.transporters.get(tenantId);
    }

    try {
      // 1. Load SMTP config from DB
      const emailConfig = await this.tenantEmailProvidersService.getDefaultEmailProvider(tenantId);
      // Mask sensitive info in logs
      const safeConfig = { ...emailConfig, password: emailConfig?.password ? '***' : undefined };
      this.logger.log(`Loaded email config for tenant ${tenantId}: ${JSON.stringify(safeConfig)}`);

      if (!emailConfig) {
        this.logger.warn(`⚠️ No email provider found for tenant ${tenantId}, using default configuration`);
        const defaultConfig = this.getDefaultEmailConfig();
        const transporter = nodemailer.createTransport(defaultConfig);
        
        try {
          await transporter.verify();
          this.logger.log(`✅ Verified default transporter for tenant ${tenantId}`);
          this.transporters.set(tenantId, transporter);
          this.usingDefaultConfig.add(tenantId); // mark as using default config
          return transporter;
        } catch (err) {
          this.logger.error(`❌ Failed to verify default transporter for tenant ${tenantId}`, err.message);
          throw new Error(`Default email configuration failed for tenant ${tenantId}: ${err.message}`);
        }
      }

      // 2. Create transporter
      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.username,
          pass: emailConfig.password,
        },
      });

      await transporter.verify();
      this.logger.log(`✅ Verified transporter for tenant ${tenantId}`);

      this.transporters.set(tenantId, transporter);
      this.usingDefaultConfig.delete(tenantId); // mark as using tenant config
      return transporter;
    } catch (err) {
      this.logger.error(`❌ Failed to init transporter for tenant ${tenantId}`, err.message);
      this.logger.warn(`⚠️ Falling back to default email configuration for tenant ${tenantId}`);
      
      try {
        const defaultConfig = this.getDefaultEmailConfig();
        const fallbackTransporter = nodemailer.createTransport(defaultConfig);
        await fallbackTransporter.verify();
        this.logger.log(`✅ Verified default fallback transporter for tenant ${tenantId}`);
        this.transporters.set(tenantId, fallbackTransporter);
        this.usingDefaultConfig.add(tenantId); // mark as using default config
        return fallbackTransporter;
      } catch (fallbackErr) {
        this.logger.error(`❌ Default email configuration also failed for tenant ${tenantId}`, fallbackErr.message);
        throw new Error(`Both tenant and default email configurations failed for tenant ${tenantId}`);
      }
    }
  }

  private getDefaultEmailConfig() {
    return {
      host: process.env.SMTP_HOST || 'email-smtp.eu-west-2.amazonaws.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };
  }

  private getDefaultFromConfig() {
    return {
      fromEmail: process.env.FROM_EMAIL || 'no-reply@e3os.co.uk',
      fromName: process.env.FROM_NAME || 'E3OS',
    };
  }

  private createConsoleTransporter(): nodemailer.Transporter {
    return {
      sendMail: (options) => {
        this.logger.log('📧 [SIMULATED EMAIL]');
        this.logger.log(`   To: ${options.to}`);
        this.logger.log(`   Subject: ${options.subject}`);
        this.logger.log(`   Body: ${options.html?.substring(0, 200)}...`);
        return Promise.resolve({ messageId: 'simulated-' + Date.now() });
      },
    } as any;
  }

  private getTenantLimiter(tenantId: string): RateLimiterMemory {
    if (!this.tenantEmailLimiters.has(tenantId)) {
      this.tenantEmailLimiters.set(
        tenantId,
        new RateLimiterMemory({
          points: parseInt(process.env.TENANT_EMAIL_RATE_LIMIT || '100'), // e.g. 100 emails
          duration: parseInt(process.env.TENANT_EMAIL_RATE_DURATION || '3600'), // per hour
        })
      );
    }
    return this.tenantEmailLimiters.get(tenantId)!;
  }

  async sendEmail(jobData: {
    to: string;
    subject: string;
    template: string;
    context: any;
    tenantId: string;
    userId?: string;
    userName?: string;
    eventType: string;
  }): Promise<void> {
    const { to, subject, template, context, tenantId, userId, userName, eventType } = jobData;

    try {
      // Per-tenant rate limiting
      try {
        await this.getTenantLimiter(tenantId).consume(tenantId);
      } catch (rateErr) {
        this.logger.warn(`Tenant ${tenantId} exceeded email rate limit`);
        throw new Error('Tenant email rate limit exceeded, try again later.');
      }

      // 1. Check user preferences
      if (userId) {
        const canSend = await this.notificationsService.checkUserPreferences(
          tenantId,
          userId,
          'email',
        );
        if (!canSend) {
          this.logger.log(`User ${userId} opted out of email`);
          return;
        }
      }

      // 2. Load template + branding
      const templateData = await this.templatesService.findTemplate(tenantId, template, 'email');
      const branding = await this.templatesService.getTenantBranding(tenantId);

      // 3. Merge context
      const templateContext = {
        ...context,
        company_name: branding?.companyName,
        support_email: branding?.supportEmail,
        logo_url: branding?.logoUrl,
        current_year: new Date().getFullYear(),
      };

      // 4. Render
      const html = this.renderTemplate(templateData.body, templateContext);
      const finalSubject = this.renderTemplate(templateData.subject || subject, templateContext);

      // 5. Create notification log
      const notification = await this.notificationsService.createNotificationLog({
        tenantId,
        userId,
        userEmail: to,
        userName,
        channel: 'email',
        eventType,
        status: 'queued',
        subject: finalSubject,
        body: html,
        templateId: templateData.id,
      });

      // 6. Send using tenant transporter
      const transporter = await this.getTransporterForTenant(tenantId);

      // Get email config for 'from' field
      let emailConfig;
      const isUsingDefaultConfig = this.usingDefaultConfig.has(tenantId);
      
      if (!isUsingDefaultConfig) {
        try {
          emailConfig = await this.tenantEmailProvidersService.getDefaultEmailProvider(tenantId);
        } catch (err) {
          // If no email provider found, emailConfig will be null and we'll use default
          this.logger.warn(`No email provider for tenant ${tenantId}, using default from config`);
        }
      } else {
        this.logger.log(`Tenant ${tenantId} is using default SMTP config, using default from address`);
      }

      const defaultFromConfig = this.getDefaultFromConfig();
      
      // If using default config, always use default from address
      const fromEmail = isUsingDefaultConfig ? 
        defaultFromConfig.fromEmail : 
        (emailConfig?.fromEmail || branding?.supportEmail || defaultFromConfig.fromEmail);
        
      const fromName = isUsingDefaultConfig ? 
        defaultFromConfig.fromName : 
        (emailConfig?.fromName || branding?.companyName || defaultFromConfig.fromName);

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to,
        subject: finalSubject,
        html,
      };

      this.logger.log(`📧 Sending email - From: ${mailOptions.from}, To: ${to}, Subject: ${finalSubject}`);
      const info = await transporter.sendMail(mailOptions);

      // 7. Update log
      await this.notificationsService.updateNotificationStatus(
        notification.id,
        'sent',
        info,
        info.messageId,
      );

  emailsSentCounter.inc();
  this.logger.log(`✅ Email sent to ${to}`);
    } catch (err) {
      this.logger.error(`❌ Failed to send email to ${to}`, err.stack);
      if (userId) {
        await this.notificationsService.createNotificationLog({
          tenantId,
          userId,
          userEmail: to,
          userName,
          channel: 'email',
          eventType,
          status: 'failed',
          subject,
          body: err.message,
          providerResponse: { error: err.message },
        });
      }
      throw err;
    }
  }

  private renderTemplate(templateContent: string, context: any): string {
    const template = hbs.compile(templateContent);
    return template(context);
  }
}
