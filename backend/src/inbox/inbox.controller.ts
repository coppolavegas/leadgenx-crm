import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { InboxService } from './inbox.service';
import { TaskEngineService } from './task-engine.service';
import { SlaTrackingService } from './sla-tracking.service';
import { AutomationService } from './automation.service';
import {
  GetInboxQueryDto,
  MarkInboxItemDto,
  StarInboxItemDto,
} from './dto/inbox.dto';
import {
  CompleteTaskDto,
  SnoozeTaskDto,
  ReassignTaskDto,
  GetTasksQueryDto,
} from './dto/task.dto';

@ApiTags('Phase 15: Inbox & Workflow')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('clients/:clientId/inbox')
export class InboxController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly taskEngine: TaskEngineService,
    private readonly slaService: SlaTrackingService,
    private readonly automation: AutomationService,
  ) {}

  // ========================================================================
  // INBOX FEED
  // ========================================================================

  @Get('/')
  @ApiOperation({ summary: 'Get unified inbox feed for client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Inbox items retrieved' })
  async getInbox(
    @Param('clientId') clientId: string,
    @Query() query: GetInboxQueryDto,
  ) {
    return this.inboxService.getInboxFeed(clientId, query);
  }

  @Get('/unread-count')
  @ApiOperation({ summary: 'Get unread inbox count' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@Param('clientId') clientId: string) {
    const count = await this.inboxService.getUnreadCount(clientId);
    return { unread_count: count };
  }

  @Put('/:itemId/read')
  @ApiOperation({ summary: 'Mark inbox item as read/unread' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'itemId', description: 'Inbox item ID' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async markAsRead(
    @Param('clientId') clientId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MarkInboxItemDto,
  ) {
    return this.inboxService.markAsRead(clientId, itemId, dto.read);
  }

  @Put('/:itemId/star')
  @ApiOperation({ summary: 'Star/unstar inbox item' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'itemId', description: 'Inbox item ID' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async toggleStar(
    @Param('clientId') clientId: string,
    @Param('itemId') itemId: string,
    @Body() dto: StarInboxItemDto,
  ) {
    return this.inboxService.toggleStar(clientId, itemId, dto.starred);
  }

  @Post('/mark-all-read')
  @ApiOperation({ summary: 'Mark all inbox items as read' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'All items marked as read' })
  async markAllAsRead(@Param('clientId') clientId: string) {
    await this.inboxService.markAllAsRead(clientId);
    return { success: true };
  }

  @Delete('/:itemId')
  @ApiOperation({ summary: 'Delete inbox item' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'itemId', description: 'Inbox item ID' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  async deleteItem(
    @Param('clientId') clientId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.inboxService.deleteInboxItem(clientId, itemId);
  }

  // ========================================================================
  // TASK MANAGEMENT
  // ========================================================================

  @Get('/tasks/today')
  @ApiOperation({ summary: 'Get tasks due today' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Today tasks retrieved' })
  async getTodayTasks(
    @Param('clientId') clientId: string,
    @Query() query: GetTasksQueryDto,
  ) {
    return this.taskEngine.getTodayTasks(clientId, query.userId);
  }

  @Get('/tasks/upcoming')
  @ApiOperation({ summary: 'Get upcoming tasks (next 7 days)' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Upcoming tasks retrieved' })
  async getUpcomingTasks(
    @Param('clientId') clientId: string,
    @Query() query: GetTasksQueryDto,
  ) {
    return this.taskEngine.getUpcomingTasks(clientId, query.userId);
  }

  @Get('/tasks/overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Overdue tasks retrieved' })
  async getOverdueTasks(
    @Param('clientId') clientId: string,
    @Query() query: GetTasksQueryDto,
  ) {
    return this.taskEngine.getOverdueTasks(clientId, query.userId);
  }

  @Post('/tasks/:taskId/complete')
  @ApiOperation({ summary: 'Complete a task' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task completed' })
  async completeTask(
    @Param('clientId') clientId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CompleteTaskDto,
    @Request() req: any,
  ) {
    return this.taskEngine.completeTask(
      clientId,
      taskId,
      req.user.id,
      dto.notes,
    );
  }

  @Put('/tasks/:taskId/snooze')
  @ApiOperation({ summary: 'Snooze a task' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task snoozed' })
  async snoozeTask(
    @Param('clientId') clientId: string,
    @Param('taskId') taskId: string,
    @Body() dto: SnoozeTaskDto,
  ) {
    return this.taskEngine.snoozeTask(
      clientId,
      taskId,
      new Date(dto.snoozedUntil),
    );
  }

  @Put('/tasks/:taskId/reassign')
  @ApiOperation({ summary: 'Reassign a task' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task reassigned' })
  async reassignTask(
    @Param('clientId') clientId: string,
    @Param('taskId') taskId: string,
    @Body() dto: ReassignTaskDto,
  ) {
    return this.taskEngine.reassignTask(clientId, taskId, dto.newAssigneeId);
  }

  // ========================================================================
  // SLA TRACKING
  // ========================================================================

  @Get('/sla/metrics')
  @ApiOperation({ summary: 'Get SLA metrics for client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'SLA metrics' })
  async getSlaMetrics(@Param('clientId') clientId: string) {
    return this.slaService.getSlaMetrics(clientId);
  }

  @Get('/sla/overdue-leads')
  @ApiOperation({ summary: 'Get list of overdue leads' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Overdue leads list' })
  async getOverdueLeads(@Param('clientId') clientId: string) {
    return this.slaService.getOverdueLeads(clientId);
  }

  // ========================================================================
  // AUTOMATION (Admin/Testing)
  // ========================================================================

  @Post('/automation/run-all')
  @ApiOperation({
    summary: 'Run all automation rules (48h follow-up, overdue detection)',
  })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Automations executed' })
  async runAllAutomations(@Param('clientId') clientId: string) {
    return this.automation.runAllAutomations(clientId);
  }

  @Post('/automation/48h-followup')
  @ApiOperation({ summary: 'Run 48-hour follow-up automation' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: '48h automation executed' })
  async run48HourFollowUp(@Param('clientId') clientId: string) {
    return this.automation.run48HourFollowUp(clientId);
  }

  @Post('/automation/overdue-detection')
  @ApiOperation({ summary: 'Run overdue detection automation' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Overdue detection executed' })
  async runOverdueDetection(@Param('clientId') clientId: string) {
    return this.automation.runOverdueDetection(clientId);
  }
}
