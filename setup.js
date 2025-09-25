// setup.js

const { execSync } = require('child_process');
const { Client } = require('pg');

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('🔄 Running seeding using script.js...');

async function waitForPostgres() {
   const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  console.log(`🔎 Using database URL: ${dbUrl}`);

    const client = new Client({
    connectionString: dbUrl,
  });
  
  let retries = 20;
  while (retries > 0) {
    try {
      await client.connect();
      await client.end();
      console.log('✅ Postgres is ready!');
      return;
    } catch (err) {
      console.log('⏳ Waiting for Postgres...');
      await new Promise(res => setTimeout(res, 2000));
      retries--;
    }
  }
  throw new Error('Postgres not ready after waiting.');
}

(async () => {
  try {
    await waitForPostgres();

      // Run migrations automatically in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Running Prisma migrations (development only)...');
        run('npx prisma migrate deploy');
      }

    console.log('🌱 Seeding database...');
    run('npm run seed');

    console.log('🌱 Seeding templates...');
    run('npm run seed:templates');

    console.log('🚀 Starting app...');
    run('npm run start:prod');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
})();
