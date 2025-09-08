// src/test-database.ts
import { PrismaClient } from '@prisma/client';

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n');
  
  const prisma = new PrismaClient();

  try {
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
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Test basic operations
    console.log('\n📊 Testing basic operations:');
    
    // Create test tenants
    const tenants = [
      {
        id: 'test-tenant-1',
        name: 'Test Tenant 1',
      },
      {
        id: 'test-tenant-2', 
        name: 'Test Tenant 2',
      }
    ];

    for (const tenantData of tenants) {
      const tenant = await prisma.tenant.upsert({
        where: { id: tenantData.id },
        update: {},
        create: tenantData,
      });
      console.log(`   ✅ Tenant created: ${tenant.name}`);
    }

    // Create tenant configs for both tenants
  const tenantConfigs: { id: string; tenantId: string }[] = [];
    for (const tenantData of tenants) {
      const config = await prisma.tenantConfig.upsert({
        where: { tenantId: tenantData.id },
        update: {},
        create: { tenantId: tenantData.id },
      });
      tenantConfigs.push(config);
      console.log(`   ✅ Tenant config created for: ${tenantData.id}`);
    }

    // Create tenant branding for both tenants
    const brandingSeedData = [
      {
        tenantId: 'test-tenant-1',
        companyName: 'Arts Training',
        logoUrl: 'https://temp.artstraining.co.uk/uploads/system//d56a5489205fde270a6d8744f980f38f.png',
        websiteUrl: 'https://temp.artstraining.co.uk',
        supportEmail: 'notification@temp.artstraining.co.uk',
        supportPhone: '+1-555-0123',
        physicalAddress: '123 Test Street, Test City, TC 12345',
        primaryColor: '#0066cc',
      },
      {
        tenantId: 'test-tenant-2',
        companyName: 'Proliance Ltd',
        logoUrl: 'https://prolianceltd.com/assets/anim-logo1-C0x_JQ1e.png',
        websiteUrl: 'https://prolianceltd.com/',
        supportEmail: 'notification@temp.artstraining.co.uk',
        supportPhone: '+1-555-6789',
        physicalAddress: '456 Another St, Other City, OC 67890',
        primaryColor: '#ff6600',
      }
    ];

    for (const brandData of brandingSeedData) {
      const branding = await prisma.tenantBrand.upsert({
        where: { tenantId: brandData.tenantId },
        update: {},
        create: brandData,
      });
      console.log(`   ✅ Tenant branding created: ${branding.companyName}`);
    }

    // Create email providers for both tenants
    const emailProvidersSeedData = [
      {
        tenantConfigId: tenantConfigs[0].id,
        host: 'premium292.web-hosting.com',
        port: 587,
        secure: false,
        username: 'notification@temp.artstraining.co.uk', // replace with real/test creds
        password: 'Restricted123!',
        fromEmail: 'notification@temp.artstraining.co.uk',
        fromName: 'Testing Mail',
        isDefault: true,
      },
      {
        tenantConfigId: tenantConfigs[1].id,
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        username: 'ethereal_user_2', // replace with real/test creds
        password: 'ethereal_pass_2',
        fromEmail: 'tenant2@example.com',
        fromName: 'Tenant 2',
        isDefault: true,
      },
    ];
    for (const providerData of emailProvidersSeedData) {
      const provider = await prisma.tenantEmailProvider.upsert({
        where: { id: providerData.tenantConfigId }, // upsert by configId for idempotency
        update: {},
        create: providerData,
      });
      console.log(`   ✅ Email provider created for config: ${provider.tenantConfigId}`);
    }

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

    // Create test user preferences for both users
    const userPreferences = [
      {
        tenantId: 'test-tenant-1',
        userId: 'user-test-001',
        email: true,
        sms: false,
        push: true,
      },
      {
        tenantId: 'test-tenant-2',
        userId: 'user-test-002',
        email: true,
        sms: true,
        push: false,
      }
    ];

    for (const prefData of userPreferences) {
      const preferences = await prisma.userPreference.upsert({
        where: { tenantId_userId: { tenantId: prefData.tenantId, userId: prefData.userId } },
        update: {},
        create: prefData,
      });
      console.log(`   ✅ User preferences created for ${prefData.userId} in ${prefData.tenantId}`);
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