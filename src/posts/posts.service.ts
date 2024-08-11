import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommonService } from 'src/common/common.service';
import { PaginatePostDto } from './dto/paginte-post.dto';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';
import { CreatePostImageDto } from './image/dto/create-image.dto';
import { ImageModel } from 'src/common/entity/image.entity';
import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
    private readonly commonService: CommonService,
  ) {}

  async getAllPosts() {
    this.postsRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS,
    });
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      ...DEFAULT_POST_FIND_OPTIONS,
      where: { id },
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  async createPost(authorId: number, postDto: CreatePostDto) {
    // 1) create -> 저장할 객체를 생성한다.
    // 2) save -> 객체를 저장한다. (create 메서드에서 생성한 객체로))

    const post = this.postsRepository.create({
      author: {
        id: authorId,
      },
      ...postDto,
      images: [],
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(postId: number, postDto: UpdatePostDto) {
    const { title, content } = postDto;

    // save의 기능
    // 1) 만약 데이터 존재, (id 기준으로) 새로 생성한다.
    // 2) 만약 데이터 존재X, (같은 id 값이 존재한다면) 존재하는 값을 업데이트한다.

    const post = await this.postsRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(postId: number) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(postId);

    return postId;
  }

  // 1) 오름차 순으로 정렬하는 pagination만 구현한다
  async paginatePosts(dto: PaginatePostDto) {
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      {
        ...DEFAULT_POST_FIND_OPTIONS,
      },
      'posts',
    );
  }

  async createPostImage(dto: CreatePostImageDto) {
    // dto의 이미지 이름 기반, 파일 경로 생성
    const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);

    try {
      // 파일 존재 확인
      await promises.access(tempFilePath);
    } catch (e) {
      throw new BadRequestException('존재하지 않는 파일.');
    }

    // 파일 이름만 가져오기
    const fileName = basename(tempFilePath);

    // 새로 이동할 포스트 폴더의 이동 경로 + 이미지 이름
    const newPath = join(POST_IMAGE_PATH, fileName);

    // save
    const result = await this.imageRepository.save({
      ...dto,
    });

    // 파일 옮기기
    await promises.rename(tempFilePath, newPath);

    return result;
  }
}
