import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

import { AuthService, JwtPayload } from '@auth/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    };
    super(strategyOptions);
  }

  async validate(payload: JwtPayload) {
    try {
      const id = Number(payload.sub);
      const user = await this.authService.findById(id);
      return user;
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
