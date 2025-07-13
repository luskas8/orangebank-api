import { PrismaService } from '@database/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { version } from '../package.json';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(Logger));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const config = new DocumentBuilder()
    .setTitle('OrangeBank API')
    .setDescription(
      `
      ## OrangeBank API Documentation
      
      A comprehensive REST API for banking operations including account management, transactions, and authentication.
      
      ### Features:
      - **Authentication**: JWT-based authentication system
      - **Account Management**: Create and manage current and investment accounts
      - **Transactions**: Deposits, withdrawals, and transfers
      - **Security**: Bearer token authentication for all protected routes
      
      ### Getting Started:
      1. Register a new user account via \`POST /auth/register\`
      2. Login to get your JWT token via \`POST /auth/login\`
      3. Use the token in the Authorization header: \`Bearer <your-token>\`
      
      ### Error Handling:
      All errors follow a consistent format with detailed information about the issue.
      
      ### Rate Limiting:
      API requests are rate-limited for security and performance.
      `,
    )
    .setVersion(version)
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Accounts', 'Account creation and management operations')
    .addTag('Health & Info', 'Health checks and API information')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(
      `http://localhost:${process.env.PORT ?? 3000}`,
      'Local development server',
    )
    .addServer('https://api.orangebank.com', 'Production server')
    .setContact('luskas8', 'https://github.com/luskas8/orangebank-api', '')
    .setLicense('UNLICENSED', '')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
