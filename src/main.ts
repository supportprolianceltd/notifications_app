import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://server1.prolianceltd.com', 'https://e3os.co.uk', 'https://crm-frontend-react.vercel.app/'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  const port = process.env.PORT || 3001;
  // Log the resolved static folder path to help debug missing-file issues
  const staticPath = join(__dirname, '..', 'public');
  console.log(`Static files (should be) served from: ${staticPath} at http://localhost:${port}/static/`);

  await app.listen(port);
}
bootstrap();
