import { Controller, Get, Param } from '@nestjs/common';
import { PostsService } from './posts.service';

interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[];

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts() {
    return posts;
  }

  // ':': pathParameter
  @Get(':id')
  getPost(@Param('id') id: string) {
    return posts.find((post) => post.id === +id);
  }
}
