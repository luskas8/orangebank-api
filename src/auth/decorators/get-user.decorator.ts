import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LoggedInUser } from '../dto/logged-in-user.dto';

interface RequestWithUser {
  user: LoggedInUser;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): LoggedInUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
