import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { UsersModel } from 'src/users/entity/users.entity';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginte-post.dto';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource, QueryRunner as QR } from 'typeorm';
import { PostsImagesService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { HttpExceptionFilter } from 'src/common/exception-filter/http.exception-filter';
import { Roles } from 'src/users/decorator/roles.decorator';
import { RolesEnum } from 'src/users/const/roles.const';
import { IsPublic } from 'src/common/decorator/is-public.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly dataSource: DataSource,
    private readonly postImageService: PostsImagesService,
  ) {}

  @Get()
  @IsPublic()
  @UseInterceptors(LogInterceptor)
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  // ':': pathParameter
  @Get(':id')
  @IsPublic()
  @UseInterceptors(LogInterceptor)
  // @UseFilters(HttpExceptionFilter)
  getPost(@Param('id', ParseIntPipe) id: number) {
    //    throw new BadRequestException('test error');

    return this.postsService.getPostById(id);
  }

  // POST METHOD
  @Post()
  @UseInterceptors(TransactionInterceptor)
  async postPosts(
    @User() user: UsersModel,
    @Body() body: CreatePostDto,
    @QueryRunner() qr: QR,
  ) {
    // //
    // // 트렌젝션과 관련된 모든 쿼리를 담당할, 쿼리 러너를 생성한다.
    // const qr = this.dataSource.createQueryRunner();

    // // 쿼리 러너에 연결한다.
    // await qr.connect();

    // // 쿼리 러너에서 트랜젝션을 시작한다.
    // // 이 시점부터 같은 쿼리 러너를 사용하면, 트랜젝션 안에서 데이터베이스 액션을 실행 할 수 있다.
    // await qr.startTransaction();

    // 로직 실행

    const post = await this.postsService.createPost(user.id, body, qr);

    for (let i = 0; i < body.images.length; i++) {
      await this.postImageService.createPostImage(
        {
          post,
          order: i,
          path: body.images[i],
          type: ImageModelType.POST_IMAGE,
        },
        qr,
      );
    }

    // await qr.commitTransaction();
    // await qr.release();

    return this.postsService.getPostById(post.id, qr);
  }

  // PATCH METHOD
  @Patch(':id')
  patchPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  //DELETE METHOD
  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }

  // RBAC -> Role Based Access Control
}
