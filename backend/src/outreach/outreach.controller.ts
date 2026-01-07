import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OutreachService } from './services/outreach.service';
import { MessageLogService } from './services/message-log.service';
import {
  CreateSequenceDto,
  UpdateSequenceDto,
  CreateStepDto,
  UpdateStepDto,
  EnrollLeadsDto,
  UpdateEnrollmentDto,
} from './dto/sequence.dto';
import { GetMessagesQueryDto, UpdateMessageStatusDto } from './dto/message.dto';

/**
 * OutreachController: Email-first outreach engine
 * 
 * Phase 14: AutoGenX Integration
 * - Manage sequences and steps
 * - Enroll leads in sequences
 * - Track message status
 * - CRM integration (auto-activity logging + stage updates)
 */
@ApiTags('Outreach')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('v1/clients/:clientId/outreach')
export class OutreachController {
  private readonly logger = new Logger(OutreachController.name);

  constructor(
    private readonly outreachService: OutreachService,
    private readonly messageLogService: MessageLogService,
  ) {}

  // ========================================================================
  // SEQUENCE MANAGEMENT
  // ========================================================================

  @Post('sequences')
  @ApiOperation({ summary: 'Create email sequence' })
  @ApiResponse({ status: 201, description: 'Sequence created' })
  async createSequence(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSequenceDto,
  ) {
    return this.outreachService.createSequence(clientId, user.userId, dto);
  }

  @Get('sequences')
  @ApiOperation({ summary: 'Get all sequences for client' })
  @ApiResponse({ status: 200, description: 'Sequences retrieved' })
  async getSequences(@Param('clientId') clientId: string) {
    return this.outreachService.getSequences(clientId);
  }

  @Get('sequences/:sequenceId')
  @ApiOperation({ summary: 'Get sequence details' })
  @ApiResponse({ status: 200, description: 'Sequence details' })
  async getSequence(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
  ) {
    return this.outreachService.getSequence(clientId, sequenceId);
  }

  @Put('sequences/:sequenceId')
  @ApiOperation({ summary: 'Update sequence' })
  @ApiResponse({ status: 200, description: 'Sequence updated' })
  async updateSequence(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
    @Body() dto: UpdateSequenceDto,
  ) {
    return this.outreachService.updateSequence(clientId, sequenceId, dto);
  }

  @Delete('sequences/:sequenceId')
  @ApiOperation({ summary: 'Delete sequence' })
  @ApiResponse({ status: 200, description: 'Sequence deleted' })
  async deleteSequence(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
  ) {
    return this.outreachService.deleteSequence(clientId, sequenceId);
  }

  // ========================================================================
  // STEP MANAGEMENT
  // ========================================================================

  @Post('sequences/:sequenceId/steps')
  @ApiOperation({ summary: 'Add step to sequence' })
  @ApiResponse({ status: 201, description: 'Step added' })
  async addStep(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
    @Body() dto: CreateStepDto,
  ) {
    return this.outreachService.addStep(clientId, sequenceId, dto);
  }

  @Put('sequences/:sequenceId/steps/:stepId')
  @ApiOperation({ summary: 'Update step' })
  @ApiResponse({ status: 200, description: 'Step updated' })
  async updateStep(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.outreachService.updateStep(clientId, sequenceId, stepId, dto);
  }

  @Delete('sequences/:sequenceId/steps/:stepId')
  @ApiOperation({ summary: 'Delete step' })
  @ApiResponse({ status: 200, description: 'Step deleted' })
  async deleteStep(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.outreachService.deleteStep(clientId, sequenceId, stepId);
  }

  // ========================================================================
  // ENROLLMENT MANAGEMENT
  // ========================================================================

  @Post('sequences/:sequenceId/enroll')
  @ApiOperation({ summary: 'Enroll leads in sequence' })
  @ApiResponse({ status: 200, description: 'Leads enrolled (respects suppression)' })
  async enrollLeads(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
    @Body() dto: EnrollLeadsDto,
  ) {
    return this.outreachService.enrollLeads(clientId, sequenceId, dto);
  }

  @Get('sequences/:sequenceId/enrollments')
  @ApiOperation({ summary: 'Get all enrollments for sequence' })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved' })
  async getEnrollments(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
  ) {
    return this.outreachService.getEnrollments(clientId, sequenceId);
  }

  @Put('sequences/:sequenceId/enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Update enrollment status' })
  @ApiResponse({ status: 200, description: 'Enrollment updated' })
  async updateEnrollment(
    @Param('clientId') clientId: string,
    @Param('sequenceId') sequenceId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.outreachService.updateEnrollment(
      clientId,
      sequenceId,
      enrollmentId,
      dto,
    );
  }

  // ========================================================================
  // MESSAGE LOG TRACKING
  // ========================================================================

  @Get('messages')
  @ApiOperation({ summary: 'Get message logs for client' })
  @ApiResponse({ status: 200, description: 'Messages retrieved with pagination' })
  async getMessages(
    @Param('clientId') clientId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messageLogService.getMessages(clientId, query);
  }

  @Get('messages/:messageId')
  @ApiOperation({ summary: 'Get message details' })
  @ApiResponse({ status: 200, description: 'Message details' })
  async getMessage(
    @Param('clientId') clientId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messageLogService.getMessage(clientId, messageId);
  }

  @Put('messages/:messageId/status')
  @ApiOperation({
    summary: 'Update message status (usually called by AutoGenX webhook)',
  })
  @ApiResponse({ status: 200, description: 'Message status updated' })
  async updateMessageStatus(
    @Param('clientId') clientId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.messageLogService.updateMessageStatus(clientId, messageId, dto);
  }
}
