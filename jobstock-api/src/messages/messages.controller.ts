import { Body, Controller, Get, Param, Post, Delete, Query, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { MessagesService } from './messages.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chat');

const typingMap = new Map<string, number>();

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const mime = file.mimetype;
    let mediaType = 'file';
    if (mime.startsWith('image/')) mediaType = 'image';
    else if (mime.startsWith('audio/') || mime.startsWith('video/webm')) mediaType = 'audio';
    return {
      url: `/uploads/chat/${file.filename}`,
      mediaType,
      originalName: file.originalname,
    };
  }

  @Post('typing')
  setTyping(@CurrentUser() user: AuthenticatedUser, @Body() dto: { receiverId: string }) {
    typingMap.set(`${user.userId}-${dto.receiverId}`, Date.now());
    return { success: true };
  }

  @Get('typing/:counterpartId')
  getTyping(@CurrentUser() user: AuthenticatedUser, @Param('counterpartId') counterpartId: string) {
    const ts = typingMap.get(`${counterpartId}-${user.userId}`);
    if (ts && Date.now() - ts < 5000) return { isTyping: true };
    return { isTyping: false };
  }

  @Post()
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user.userId, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.listConversations(user.userId);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.countUnread(user.userId);
  }

  @Get('conversations/:counterpartId')
  getConversation(@CurrentUser() user: AuthenticatedUser, @Param('counterpartId') counterpartId: string) {
    return this.messagesService.getConversation(user.userId, counterpartId);
  }

  @Delete(':messageId')
  deleteMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId') messageId: string,
    @Query('type') type: 'me' | 'everyone',
  ) {
    return this.messagesService.deleteMessage(user.userId, messageId, type);
  }
}

