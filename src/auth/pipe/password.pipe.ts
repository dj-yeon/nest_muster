import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PasswordPipe implements PipeTransform {
  transform(value: any) {
    if (value.toString().length > 8) {
      throw new BadRequestException('password should be under 8 characters!');
    }

    return value.toString();
  }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(
    private readonly length: number,
    private readonly subject: string,
  ) {}

  transform(value: any) {
    if (value.toString().length > this.length) {
      throw new BadRequestException(
        `${this.subject}의 최대 길이는 ${this.length}입니다.`,
      );
    }

    return value.toString();
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}

  transform(value: any) {
    if (value.toString().length < this.length) {
      throw new BadRequestException(`최소 길이는 ${this.length}입니다.`);
    }

    return value.toString();
  }
}
