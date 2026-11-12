import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { User } from '@prisma/client';
import { ChatConversationStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards';
import { ChatService } from './chat.service';

@ApiTags('Live Chat')
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Customer: Get or create live chat session (JWT user or guest token).
   */
  @Get('customer/chat/session')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get or initialize live chat session for user or guest' })
  async getSession(
    @CurrentUser() user: User | undefined,
    @Headers('x-guest-token') guestTokenHeader?: string,
    @Query('guestToken') guestTokenQuery?: string,
  ) {
    const guestToken = guestTokenHeader || guestTokenQuery;
    return this.chatService.getOrCreateSession({
      userId: user?.id,
      guestToken: user ? undefined : guestToken,
    });
  }

  /**
   * Customer / Shared: Fetch 20 previous messages (cursor-based pagination).
   */
  @Get('customer/chat/messages')
  @ApiOperation({ summary: 'Get paginated chat messages for a conversation' })
  async getMessages(
    @Query('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    if (!conversationId) {
      throw new BadRequestException('conversationId query param is required');
    }
    return this.chatService.getMessages(conversationId, cursor, limit ? Number(limit) : 20);
  }

  /**
   * Customer: Upload photo attachment for live chat.
   */
  @Post('customer/chat/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload customer chat photo attachment' })
  async uploadCustomerFile(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.saveChatAttachment(file);
  }

  /**
   * Customer: Link guest conversation to authenticated user account upon login.
   */
  @Post('customer/chat/link-guest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Merge guest chat messages into authenticated account' })
  async linkGuest(
    @CurrentUser() user: User,
    @Body('guestToken') guestToken: string,
  ) {
    if (!guestToken) {
      throw new BadRequestException('guestToken is required in body');
    }
    await this.chatService.linkGuestConversation(user.id, guestToken);
    return { ok: true };
  }

  /**
   * Admin: List conversations for dashboard.
   */
  @Get('admin/chat/conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List customer conversations for admin dashboard' })
  async getAdminConversations(
    @Query('status') status?: ChatConversationStatus,
    @Query('search') search?: string,
  ) {
    return this.chatService.getAdminConversations({ status, search });
  }

  /**
   * Admin: Get conversation messages.
   */
  @Get('admin/chat/conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get paginated messages for admin' })
  async getAdminMessages(
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(conversationId, cursor, limit ? Number(limit) : 20);
  }

  /**
   * Admin: Mark conversation as read by staff.
   */
  @Post('admin/chat/conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mark conversation as read by staff' })
  async markAdminRead(@Param('id') conversationId: string) {
    await this.chatService.markAsRead(conversationId, 'ADMIN');
    return { ok: true };
  }

  /**
   * Admin: Upload photo attachment from dashboard.
   */
  @Post('admin/chat/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload staff chat photo attachment' })
  async uploadAdminFile(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.saveChatAttachment(file);
  }
}

