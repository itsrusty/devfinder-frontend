import {
    BadGatewayException,
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Post } from '@prisma/client';
import { UpdatePostDto } from './dto/post.update.dto';
import { CreatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    async validateIfUserExists(userId: number) {
        const findUser = await this.prisma.user.findFirst({
            where: {
                id: userId,
            },
        });

        if (!findUser) throw new BadRequestException('no existe el usuario');

        return true;
    }

    async validatePostUser(userId: number, postId: number): Promise<Post> {
        const findPost = await this.prisma.post.findFirst({
            where: {
                id: postId,
                authorId: userId,
            },
        });

        if (!findPost)
            throw new BadGatewayException('No existe el post para el usuario');

        return findPost;
    }

    async createPostUser(
        userId: number,
        postCreated: CreatePostDto,
    ): Promise<Post> {
        const validateUser = await this.validateIfUserExists(userId);

        if (!validateUser) throw new BadRequestException('error al crear el post');

        return this.prisma.post.create({
            data: {
                authorId: userId,
                ...postCreated,
            },
        });
    }

    async showPosts() {
        const posts = await this.prisma.post.findMany({
            include: {
                author: true,
            },
        });
        return {
            totalPosts: posts.length,
            post: posts,
        };
    }

    showPagePosts(page: number, limit: number) {
        const skip = (page - 1) * limit;

        return this.prisma.post.findMany({
            take: limit,
            skip: skip,
            include: {
                author: true,
            },
            // orderBy: { createdAt: 'desc' }
        });
    }

    async editPost(
        postId: number,
        userId: number,
        newContentPost: UpdatePostDto,
    ): Promise<{ message: string; updatedPost: Post }> {
        await this.validatePostUser(userId, postId);
        const updatedData = await this.prisma.post.update({
            where: {
                id: postId,
            },
            data: newContentPost,
        });

        return {
            message: `updated data ${updatedData.id}`,
            updatedPost: updatedData,
        };
    }

    async removePost(
        postId: number,
        userId: number,
    ): Promise<{ message: string; removedData: Post }> {
        await this.validatePostUser(userId, postId);
        const removedData = await this.prisma.post.delete({
            where: {
                id: postId,
            },
        });

        return {
            message: 'eliminado exitosaente',
            removedData: removedData,
        };
    }

    async viewCandidatesToMyPosts(postId: number, userId: number): Promise<Post> {
        const myPosts = await this.prisma.post.findFirst({
            where: {
                id: postId,
                authorId: userId,
            },
            include: {
                CandidatesList: true,
                _count: true,
                // author: true
            },
        });

        return myPosts;
    }

    // donde el usuario ha postulado
    async viewMyPostulates(userId: number) { }
}
