import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUNDS_KEY,
  ENV_JWT_SECRET_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // 토큰을 사용하게 되는 방식
  /**
   *
   * 1) 사용자가 로그인 또는 회원가입을 진행하면
   *    accessToken과 refreshToken을 발급받는다.
   *
   * 2) 로그인 할 때는 Basic 토큰과 함께 요청을 보낸다.
   *    Basic 토큰은 '이메일:비밀번호'를 Base64로 인코딩한 형태이다.
   *    예) {authorization: 'Basic {token}'}
   *
   * 3) 아무나 접근할 수 없는 정보 (private route)를 접근할 때는
   *    accessToekn을 Header에 추가해서 요청과 함께 보낸다.
   *    예) {authorization: 'Bearer {token}'}
   *
   * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
   *    예를 들어 현재 로그인한 사용자가 작성한 포스트만 가져오려면, 토큰의 sub 값에 입력되어 있는 사용자의 포스트만 따로 필터링 가능.
   *    특정 사용자의 토큰이 없다면, 다른 사용자의 데이터 접근 불가.
   *
   * 5) 모든 토큰은 만료 기간이 있다. 만료기간이 지나면 새로 토큰을 발급받아야한다.
   *    그렇지 않으면 jwtService.verify()에서 인증이 통과 안된다.
   *    그러니 access 토큰을 새로 발급 받을 수 있는 /auth/token/access와
   *    refresh 토큰을 새로 발급 받을 수 있는 /auth/token/refresh가 필요하다.
   *
   * 6) 토큰이 만료되면 각각의 토큰을 새로 발급 받을 수 있는 엔드포인트에 요청을 해서,
   *    새로운 토큰을 발급받고 새로운 토큰을 사용해서 private route에 접근한다.
   */

  // 토큰을 발급
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      // seconds
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      throw new UnauthorizedException('unregistered User!');
    }

    // bcrypt.compare(비교할 비밀번호, db상의 비밀번호)
    const passOk = await bcrypt.compare(user.password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('Wrong Password!');
    }

    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(user: RegisterUserDto) {
    const hash = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY)),
    );

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }

  // header는 'Basic {token}' or 'Bearer {token}'
  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    // Bearer - 'refresh Token' or 'access Token'
    // Basic - 로그인 용
    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('wrong Token!');
    }

    const token = splitToken[1];

    return token;
  }

  /**
   * Basic ajsldfksjdflskdf
   *
   * 1) ajsldfksjdflskdf -> email:password
   * 2) email:password -> [email, password]
   * 3) {email: email, password: password}
   */
  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return {
      email,
      password,
    };
  }

  // 토큰 인증, 검증
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료됐거나, 잘못된 토큰입니다.');
    }
  }

  // 토큰 재발급
  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
    });

    /**
     * sub: id,
     * email: email,
     * type: 'access' || 'refresh'
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh 토큰으로만 가능합니다!',
      );
    }

    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }
}
