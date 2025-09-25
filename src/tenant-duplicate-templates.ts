// src/duplicate-templates-for-existing-tenants.ts
import { PrismaClient } from '@prisma/client';

async function duplicateTemplatesForExistingTenants() {
  console.log('🚀 Duplicating Global Templates for Existing Tenants...\n');
  
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Get all global templates
    const globalTemplates = await prisma.template.findMany({
      where: { tenantId: 'global', isActive: true },
    });

    if (globalTemplates.length === 0) {
      console.log('❌ No global templates found');
      return;
    }

    console.log(`📋 Found ${globalTemplates.length} global templates`);

    // Get all tenants (excluding global)
    const tenants = await prisma.tenant.findMany({
      where: { 
        id: { not: 'global' } 
      },
    });

    console.log(`🏢 Found ${tenants.length} tenants`);

    let totalDuplicated = 0;

    for (const tenant of tenants) {
      console.log(`\n🔄 Processing tenant: ${tenant.id}`);

      // Check which templates this tenant already has
      const existingTemplates = await prisma.template.findMany({
        where: { tenantId: tenant.id },
        select: { name: true, language: true },
      });

      const existingKeys = new Set(
        existingTemplates.map(t => `${t.name}-${t.language}`)
      );

      // Filter out templates that already exist for this tenant
      const templatesToCreate = globalTemplates.filter(
        template => !existingKeys.has(`${template.name}-${template.language}`)
      );

      if (templatesToCreate.length > 0) {
        const tenantTemplates = templatesToCreate.map((template) => ({
          name: template.name,
          description: template.description,
          type: template.type,
          subject: template.subject,
          body: template.body,
          language: template.language,
          isActive: template.isActive,
          tenantId: tenant.id,
        }));

        await prisma.template.createMany({
          data: tenantTemplates,
        });

        console.log(`   ✅ Created ${templatesToCreate.length} templates for ${tenant.id}`);
        totalDuplicated += templatesToCreate.length;
      } else {
        console.log(`   ℹ️ All templates already exist for ${tenant.id}`);
      }
    }

    console.log(`\n🎉 Successfully duplicated ${totalDuplicated} templates across all tenants!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

duplicateTemplatesForExistingTenants();