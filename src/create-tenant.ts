// src/create-tenant.ts
import { PrismaClient } from '@prisma/client';

async function createTenant() {
  console.log('🏢 Creating Tenant...\n');
  
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Create single tenant
    const tenant = {
      id: 'test-tenant-1',
      name: 'Test Company Ltd',
      externalId: 'external-12345',
    };

    console.log('\n🏗️ Creating tenant:');
    
    const result = await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: { 
        name: tenant.name,
        externalId: tenant.externalId 
      },
      create: tenant,
    });
    
    console.log(`   ✅ Tenant "${result.name}" (${result.id}) created/updated`);

    // Duplicate global templates for this tenant
    console.log('\n📋 Duplicating global templates for tenant...');
    
    const globalTemplates = await prisma.template.findMany({
      where: { tenantId: 'global' }
    });

    console.log(`   📄 Found ${globalTemplates.length} global templates to duplicate`);

    let duplicatedCount = 0;
    for (const template of globalTemplates) {
      try {
        // Check if template already exists for this tenant
        const existingTemplate = await prisma.template.findFirst({
          where: {
            name: template.name,
            tenantId: tenant.id
          }
        });

        if (!existingTemplate) {
          // Create new template for this tenant
          await prisma.template.create({
            data: {
              id: `${tenant.id}-${template.name}`,
              name: template.name,
              type: template.type,
              subject: template.subject,
              body: template.body,
              language: template.language,
              isActive: template.isActive,
              tenantId: tenant.id,
            }
          });
          duplicatedCount++;
          console.log(`     ✅ Duplicated template: ${template.name}`);
        } else {
          console.log(`     ⏭️ Template already exists: ${template.name}`);
        }
      } catch (error) {
        console.error(`     ❌ Failed to duplicate template ${template.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully duplicated ${duplicatedCount} templates for tenant "${tenant.name}"`);

    // Show summary
    const tenantTemplates = await prisma.template.count({
      where: { tenantId: tenant.id }
    });
    
    console.log(`📊 Tenant now has ${tenantTemplates} notification templates`);

  } catch (error) {
    console.error('❌ Tenant creation failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
  }
}

createTenant();