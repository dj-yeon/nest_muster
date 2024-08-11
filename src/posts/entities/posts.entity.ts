import { IsString } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class PostsModel extends BaseModel {
  // 1. argument: 어떤 릴레이션과 관계?
  // 2. argument: 어떤 property를 연동?
  @ManyToOne(() => UsersModel, (user) => user.posts, { nullable: false })
  author: UsersModel;

  @Column()
  @IsString({ message: stringValidationMessage })
  title: string;

  @Column()
  @IsString({ message: stringValidationMessage })
  content: string;

  @Column({
    nullable: true,
  })
  image?: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;
}
