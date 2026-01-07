import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GenieService } from './genie.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { BookDemoDto } from './dto/book-demo.dto';

@ApiTags('Genie AI')
@Controller('genie')
@UseGuards(SessionAuthGuard)
@ApiBearerAuth()
export class GenieController {
  private readonly logger = new Logger(GenieController.name);

  constructor(private readonly genieService: GenieService) {}

  @Post('conversations/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new conversation with Genie AI' })
  @ApiResponse({
    status: 201,
    description: 'Conversation started successfully',
  })
  async startConversation(
    @Req() req: any,
    @Body() dto: StartConversationDto,
  ) {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      return await this.genieService.startConversation(organizationId, dto);
    } catch (error) {
      this.logger.error('Error starting conversation:', error);
      throw error;
    }
  }

  @Post('conversations/:conversation_id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to Genie AI' })
  @ApiResponse({
    status: 200,
    description: 'Message sent and response received',
  })
  async sendMessage(
    @Req() req: any,
    @Param('conversation_id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      return await this.genieService.sendMessage(
        conversationId,
        organizationId,
        dto,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  @Post('conversations/:conversation_id/book-demo')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book a demo from conversation' })
  @ApiResponse({
    status: 201,
    description: 'Demo booking request submitted',
  })
  async bookDemo(
    @Req() req: any,
    @Param('conversation_id') conversationId: string,
    @Body() dto: BookDemoDto,
  ) {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      return await this.genieService.bookDemo(
        conversationId,
        organizationId,
        dto,
      );
    } catch (error) {
      this.logger.error('Error booking demo:', error);
      throw error;
    }
  }

  @Get('conversations/:conversation_id')
  @ApiOperation({ summary: 'Get conversation details and history' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
  })
  async getConversation(
    @Req() req: any,
    @Param('conversation_id') conversationId: string,
  ) {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      return await this.genieService.getConversation(
        conversationId,
        organizationId,
      );
    } catch (error) {
      this.logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for organization' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  async listConversations(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      return await this.genieService.listConversations(organizationId, status);
    } catch (error) {
      this.logger.error('Error listing conversations:', error);
      throw error;
    }
  }
}
