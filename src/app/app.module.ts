import { AccountModule } from '@account/account.module';
import { PrismaModule } from '@database/prisma/prisma.module';
import { PrismaService } from '@database/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        return {
          pinoHttp: {
            transport:
              nodeEnv === 'dev' ? { target: 'pino-pretty' } : undefined,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.cpf',
              ],
              censor: '********',
            },
            enabled: nodeEnv !== 'test',
          },
        };
      },
    }),
    AccountModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
