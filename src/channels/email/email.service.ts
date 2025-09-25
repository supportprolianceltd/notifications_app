// src/channels/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as hbs from 'handlebars';
import { TemplatesService } from '../../templates/templates.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { TenantEmailProvidersService } from '../../tenant-email-providers/tenant-email-providers.service';
import { emailsSentCounter } from '../../metrics/metrics.controller';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporters = new Map<string, nodemailer.Transporter>(); // cache by tenantId

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
        return fallbackTransporter;
      } catch (fallbackErr) {
        this.logger.error(`❌ Default email configuration also failed for tenant ${tenantId}`, fallbackErr.message);
        throw new Error(`Both tenant and default email configurations failed for tenant ${tenantId}`);
      }
    }
  }

  private getDefaultEmailConfig() {
    return {
      host: 'premium292.web-hosting.com',
      port: 587,
      secure: false,
      auth: {
        user: 'notification@temp.artstraining.co.uk',
        pass: 'Restricted123!',
      },
    };
  }

  private getDefaultFromConfig() {
    return {
      fromEmail: 'notification@temp.artstraining.co.uk',
      fromName: 'Testing Mail',
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
      try {
        emailConfig = await this.tenantEmailProvidersService.getDefaultEmailProvider(tenantId);
      } catch (err) {
        // If no email provider found, emailConfig will be null and we'll use default
        this.logger.warn(`No email provider for tenant ${tenantId}, using default from config`);
      }

      const defaultFromConfig = this.getDefaultFromConfig();
      const fromEmail = emailConfig?.fromEmail || branding?.supportEmail || defaultFromConfig.fromEmail;
      const fromName = emailConfig?.fromName || branding?.companyName || defaultFromConfig.fromName;

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to,
        subject: finalSubject,
        html,
      };

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
