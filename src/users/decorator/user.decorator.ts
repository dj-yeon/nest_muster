import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersModel } from '../entities/users.entity';

export const User = createParamDecorator((data, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();

  const user = req.user as UsersModel;

  if (!user) {
    // @UseGuards(AccessTokenGuard)를 사용한 전제하에 사용, 없으면 서버 오류
    throw new InternalServerErrorException(
      'User 데코레이터는 AccessTokenGuard와 함께 사용해야합니다. Request에 user 프로퍼티가 존재하지 않습니다!',
    );
  }

  return user;
});
