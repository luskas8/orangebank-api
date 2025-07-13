import { AccountModule } from '@account/account.module';
import { AuthModule } from '@auth/auth.module';
import { PrismaModule } from '@database/prisma/prisma.module';
import { PrismaService } from '@database/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { GlobalExceptionFilter } from './exception/http-exception.filter';
import { MarketModule } from './market/market.module';

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
    AuthModule,
    PassportModule,
    MarketModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
