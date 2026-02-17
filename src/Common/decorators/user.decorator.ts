import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TgUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.tgUser; 
    return data ? user?.[data] : user;
  },
);