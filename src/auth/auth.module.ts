import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  exports: [UsersService],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
