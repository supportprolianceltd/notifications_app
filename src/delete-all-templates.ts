// src/delete-all-templates.ts
// 🚨 DANGER: This script will DELETE ALL TEMPLATES from the database
// 🚨 Use only in development - NEVER run this in production!

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

async function deleteAllTemplates() {
  console.log('🗑️  Template Deletion Script\n');
  console.log('🚨 WARNING: This will DELETE ALL TEMPLATES from the database!');
  console.log('🚨 This action cannot be undone!\n');

  // Create readline interface for user confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Prompt for confirmation
  const confirmation = await new Promise<string>((resolve) => {
    rl.question('Are you sure you want to delete ALL templates? Type "DELETE ALL TEMPLATES" to confirm: ', resolve);
  });

  if (confirmation !== 'DELETE ALL TEMPLATES') {
    console.log('❌ Operation cancelled. Templates were not deleted.');
    rl.close();
    return;
  }

  rl.close();

  const prisma = new PrismaClient();

  try {
    console.log('\n🔍 Checking current templates in database...');
    
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
    console.log('💡 You can now run test-all-templates.ts to recreate fresh templates.');

  } catch (error) {
    console.error('❌ Error deleting templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllTemplates()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });