// src/test-database.ts
import { PrismaClient } from '@prisma/client';

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n');
  
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Clean up existing notifications and tenant email provider configs
    console.log('\n🧹 Cleaning up existing notifications and tenant email providers...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted notifications: ${deletedNotifications.count}`);
    const deletedEmailProviders = await prisma.tenantEmailProvider.deleteMany({});
    console.log(`   ✅ Deleted tenant email providers: ${deletedEmailProviders.count}`);
    const deletedTenantBrands = await prisma.tenantBrand.deleteMany({});
    console.log(` ✅ Deleted tenant brands: ${deletedTenantBrands.count}`)
    const deletedConfig = await prisma.tenantConfig.deleteMany({});
    console.log(` ✅ Deleted tenant configs: ${deletedConfig.count}`)

    // Ensure global tenant exists for global templates
    await prisma.tenant.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        name: 'Global Tenant',
      },
    });
    console.log('   ✅ Global tenant created/ensured');

    // Test basic operations
    console.log('\n📊 Testing basic operations:');

    // Create global tenant config
    const globalConfig = await prisma.tenantConfig.upsert({
      where: { tenantId: 'global' },
      update: {},
      create: { tenantId: 'global' },
    });
    console.log(`   ✅ Global tenant config created`);

    // Create global tenant branding for E3OS
    const globalBranding = await prisma.tenantBrand.upsert({
      where: { tenantId: 'global' },
      update: {},
      create: {
        tenantId: 'global',
        companyName: 'E3OS',
        websiteUrl: 'https://e3os.co.uk',
        supportEmail: 'support@e3os.co.uk',
        primaryColor: '#0066cc',
      },
    });
    console.log(`   ✅ Global tenant branding created: ${globalBranding.companyName}`);

    // Create/update email provider for global tenant (proper idempotency)
    const existingEmailProvider = await prisma.tenantEmailProvider.findFirst({
      where: { tenantConfigId: globalConfig.id }
    });

    if (existingEmailProvider) {
      // Update existing email provider
      await prisma.tenantEmailProvider.update({
        where: { id: existingEmailProvider.id },
        data: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: process.env.SMTP_SECURE === 'true',
          username: process.env.SMTP_USER,
          password: process.env.SMTP_PASS,
          fromEmail: process.env.FROM_EMAIL,
          fromName: process.env.FROM_NAME || 'E3OS',
          isDefault: true,
        },
      });
      console.log(`   ✅ Global email provider updated`);
    } else {
      // Create new email provider
      await prisma.tenantEmailProvider.create({
        data: {
          tenantConfigId: globalConfig.id,
          host: process.env.SMTP_HOST || 'email-smtp.eu-west-2.amazonaws.com',
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: process.env.SMTP_SECURE === 'true',
          username: process.env.SMTP_USER || 'AKIAQQPIOM5KEYH7UZWS',
          password: process.env.SMTP_PASS || 'BOh5oE1xO9F7gQA5CkgCPvlaZSmIez1GCLoLFsUlBGC9',
          fromEmail: process.env.FROM_EMAIL || 'no-reply@e3os.co.uk',
          fromName: process.env.FROM_NAME || 'E3OS',
          isDefault: true,
        },
      });
      console.log(`   ✅ Global email provider created`);
    }
    console.log(`   ✅ Global email provider created`);

    // Create all necessary templates
    const templatesToCreate = [
    {
    name: 'welcome-email',
    type: 'email',
    subject: 'Welcome to {{company_name}}, {{user_name}}!',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: {{primary_color}}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{company_name}}!</h1>
    </div>
    <div class="content">
      <h2>Hello {{user_name}}!</h2>
      <p>Thank you for registering with us. We're excited to have you on board.</p>
      <p>Get started by exploring your dashboard and completing your profile.</p>
      <p>If you have any questions, contact our support team at <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
      <p>{{physical_address}}</p>
    </div>
  </div>
</body>
</html>`,
    language: 'en',
    isActive: true,
    tenantId: 'global',
    },
    {
    name: 'password-reset',
    type: 'email',
    subject: 'Password Reset Request for {{company_name}}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: {{primary_color}}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { background-color: {{primary_color}}; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <h2>Hello {{user_name}}!</h2>
      <p>You requested to reset your password for {{company_name}}.</p>
      <p>Click the button below to reset your password:</p>
      <p><a href="{{reset_link}}" class="button">Reset Password</a></p>
      <p>This link will expire in {{expiry_time}}.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    language: 'en',
    isActive: true,
    tenantId: 'global',
    },
    {
    name: 'payment-failed',
    type: 'email',
    subject: 'Payment Failed for Invoice #{{invoice_id}}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: {{primary_color}}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { background-color: {{primary_color}}; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <h2>Hello {{user_name}}!</h2>
      <p>We were unable to process your payment of <strong>{{amount}}</strong> for invoice <strong>#{{invoice_id}}</strong>.</p>
      <p>Please update your payment information and try again:</p>
      <p><a href="{{retry_link}}" class="button">Retry Payment</a></p>
      <p>If you continue to experience issues, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:{{support_email}}">{{support_email}}</a></p>
    </div>
  </div>
</body>
</html>`,
    language: 'en',
    isActive: true,
    tenantId: 'global',
    }
    ];

    for (const templateData of templatesToCreate) {
      const { tenantId, name, language } = templateData;
      const where = {
        tenantId_name_language: { tenantId, name, language }
      };
      const create = { ...templateData };
      const template = await prisma.template.upsert({
        where,
        update: {},
        create,
      });
      console.log(`   ✅ Template created: ${template.name} for ${template.tenantId}`);
    }

    // Query to verify data
    console.log('\n📊 Database Summary:');
    const templates = await prisma.template.findMany();
    console.log(`   📋 Total templates: ${templates.length}`);
    
    const notifications = await prisma.notification.findMany();
    console.log(`   📋 Total notifications: ${notifications.length}`);

    const brandingData = await prisma.tenantBrand.findMany();
    console.log(`   📋 Total tenant branding records: ${brandingData.length}`);

    const tenantsCount = await prisma.tenant.findMany();
    console.log(`   📋 Total tenants: ${tenantsCount.length}`);

    const usersCount = await prisma.userPreference.findMany();
    console.log(`   📋 Total user preferences: ${usersCount.length}`);

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

testDatabase();