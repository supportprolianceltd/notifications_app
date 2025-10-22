import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
     origin: ['https://server1.prolianceltd.com', 'https://e3os.co.uk', 'https://crm-frontend-react.vercel.app/'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  await app.listen(3001);
}
bootstrap();
