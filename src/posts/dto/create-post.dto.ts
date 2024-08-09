import { IsString } from 'class-validator';

export class CreatePostDto {
  @IsString({ message: 'title must be string.' })
  title: string;

  @IsString({ message: 'content must be string.' })
  content: string;
}
