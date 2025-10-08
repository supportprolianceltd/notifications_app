// src/delete-all-templates-force.ts
// 🚨 DANGER: This script will DELETE ALL TEMPLATES from the database
// 🚨 This is the NON-INTERACTIVE version for Docker/CI environments

import { PrismaClient } from '@prisma/client';

async function deleteAllTemplatesForce() {
  console.log('🗑️  Template Deletion Script (NON-INTERACTIVE MODE)\n');
  console.log('🚨 WARNING: This will DELETE ALL TEMPLATES from the database!');
  console.log('🚨 Running in force mode - no confirmation required\n');

  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking current templates in database...');
    
    // Get count of templates before deletion
    const totalTemplates = await prisma.template.count();
    const globalTemplates = await prisma.template.count({
      where: { tenantId: 'global' }
    });
    const tenantTemplates = totalTemplates - globalTemplates;

    console.log(`📊 Found ${totalTemplates} total templates:`);
    console.log(`   - ${globalTemplates} global templates`);
    console.log(`   - ${tenantTemplates} tenant-specific templates`);

    if (totalTemplates === 0) {
      console.log('✅ No templates found in database. Nothing to delete.');
      return;
    }

    console.log('\n🗑️  Starting deletion process...');

    // Delete all templates (cascading will handle related data)
    const deleteResult = await prisma.template.deleteMany({});

    console.log(`✅ Successfully deleted ${deleteResult.count} templates!`);
    console.log('\n🎉 Database is now clean of all templates.');

  } catch (error) {
    console.error('❌ Error deleting templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllTemplatesForce()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });