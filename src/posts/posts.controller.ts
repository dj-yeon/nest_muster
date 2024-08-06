import { Controller, Get } from '@nestjs/common';
import { PostsService } from './posts.service';

interface Post {
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPost(): Post {
    return {
      author: 'newjeans_official',
      title: 'newjeans minji',
      content: 'dancing minji',
      likeCount: 100000000,
      commentCount: 9999999,
    };
  }
}
