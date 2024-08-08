import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { UsersModel } from 'src/users/entities/users.entity';
import { User } from 'src/users/decorator/user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts() {
    return this.postsService.getAllPosts();
  }

  // ':': pathParameter
  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // POST METHOD
  @Post()
  @UseGuards(AccessTokenGuard)
  postPosts(
    @User() user: UsersModel,
    @Body('title') title: string,
    @Body('content') content: string,
  ) {
    return this.postsService.createPost(user.id, title, content);
  }

  // PUT METHOD
  @Put(':id')
  putPost(
    @Param('id', ParseIntPipe) id: number,
    @Body('title') title?: string,
    @Body('content') content?: string,
  ) {
    return this.postsService.updatePost(id, title, content);
  }

  //DELETE METHOD
  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
