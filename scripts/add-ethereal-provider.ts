import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'test-tenant-1';
  // TODO: Replace these Ethereal credentials with your own
  const ethereal = {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    username: 'YOUR_ETHEREAL_USER',
    password: 'YOUR_ETHEREAL_PASS',
    fromEmail: 'YOUR_ETHEREAL_USER@ethereal.email',
    fromName: 'Test Sender',
  };

  const tenantConfig = await prisma.tenantConfig.findUnique({
    where: { tenantId }
  });
  if (!tenantConfig) throw new Error('No tenant config for ' + tenantId);

  await prisma.tenantEmailProvider.create({
    data: {
      tenantConfigId: tenantConfig.id,
      host: ethereal.host,
      port: ethereal.port,
      secure: ethereal.secure,
      username: ethereal.username,
      password: ethereal.password,
      fromEmail: ethereal.fromEmail,
      fromName: ethereal.fromName,
      isDefault: true
    }
  });
  console.log('Ethereal provider added!');
}

main().catch(e => { console.error(e); process.exit(1); });
