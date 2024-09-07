import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from 'src/users/users.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorator/is-public.decorator';

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 현재 요청에 관한 정보들
    const req = context.switchToHttp().getRequest();

    if (isPublic) {
      req.isRoutePublic = true;

      return true;
    }

    // header의 authorization 부분을 가져온다
    const rawToken = req.headers['authorization'];

    // 없을 시, 에러 던진다
    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다!');
    }

    // Bearer의 다음 값을 토큰으로 할당
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    // 유효한 토큰인지 확인
    const result = await this.authService.verifyToken(token);

    const user = await this.usersService.getUserByEmail(result.email);

    req.user = user;
    req.token = token;
    req.tokenType = result.type;

    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();

    if (req.isRoutePublic) {
      return true;
    }

    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('Access Token이 아닙니다.');
    }

    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // BearerTokenGuard에 구현 되어있는 canActivate를 상속받는다.
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();

    if (req.isRoutePublic) {
      return true;
    }

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('Refresh Token이 아닙니다.');
    }

    return true;
  }
}
