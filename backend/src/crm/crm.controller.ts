import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PipelineService } from './services/pipeline.service';
import { ActivityService } from './services/activity.service';
import { TaskService } from './services/task.service';
import { MemberService } from './services/member.service';
import { LeadCrmService } from './services/lead-crm.service';
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreateStageDto,
  UpdateStageDto,
} from './dto/pipeline.dto';
import { CreateActivityDto, ListActivitiesQueryDto } from './dto/activity.dto';
import { CreateTaskDto, UpdateTaskDto, ListTasksQueryDto } from './dto/task.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import {
  UpdateLeadStageDto,
  UpdateLeadOwnerDto,
  UpdateLeadCrmFieldsDto,
} from './dto/lead-crm.dto';

@ApiTags('CRM')
@Controller('clients/:clientId/crm')
export class CrmController {
  constructor(
    private pipelineService: PipelineService,
    private activityService: ActivityService,
    private taskService: TaskService,
    private memberService: MemberService,
    private leadCrmService: LeadCrmService,
  ) {}

  // ============ PIPELINES ============

  @Post('pipelines')
  @ApiOperation({ summary: 'Create a new pipeline for client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 201, description: 'Pipeline created' })
  createPipeline(@Param('clientId') clientId: string, @Body() dto: CreatePipelineDto) {
    return this.pipelineService.createPipeline(clientId, dto);
  }

  @Get('pipelines')
  @ApiOperation({ summary: 'List all pipelines for client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  listPipelines(@Param('clientId') clientId: string) {
    return this.pipelineService.listPipelines(clientId);
  }

  @Get('pipelines/:pipelineId')
  @ApiOperation({ summary: 'Get pipeline by ID' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  getPipeline(@Param('clientId') clientId: string, @Param('pipelineId') pipelineId: string) {
    return this.pipelineService.getPipeline(clientId, pipelineId);
  }

  @Patch('pipelines/:pipelineId')
  @ApiOperation({ summary: 'Update pipeline' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  updatePipeline(
    @Param('clientId') clientId: string,
    @Param('pipelineId') pipelineId: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.pipelineService.updatePipeline(clientId, pipelineId, dto);
  }

  @Delete('pipelines/:pipelineId')
  @ApiOperation({ summary: 'Delete pipeline' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePipeline(@Param('clientId') clientId: string, @Param('pipelineId') pipelineId: string) {
    return this.pipelineService.deletePipeline(clientId, pipelineId);
  }

  // ============ STAGES ============

  @Post('pipelines/:pipelineId/stages')
  @ApiOperation({ summary: 'Create a new stage in pipeline' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  createStage(
    @Param('clientId') clientId: string,
    @Param('pipelineId') pipelineId: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelineService.createStage(clientId, pipelineId, dto);
  }

  @Get('pipelines/:pipelineId/stages')
  @ApiOperation({ summary: 'List stages in pipeline' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  listStages(@Param('clientId') clientId: string, @Param('pipelineId') pipelineId: string) {
    return this.pipelineService.listStages(clientId, pipelineId);
  }

  @Patch('pipelines/:pipelineId/stages/:stageId')
  @ApiOperation({ summary: 'Update stage' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  updateStage(
    @Param('clientId') clientId: string,
    @Param('pipelineId') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelineService.updateStage(clientId, pipelineId, stageId, dto);
  }

  @Delete('pipelines/:pipelineId/stages/:stageId')
  @ApiOperation({ summary: 'Delete stage' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStage(
    @Param('clientId') clientId: string,
    @Param('pipelineId') pipelineId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.pipelineService.deleteStage(clientId, pipelineId, stageId);
  }

  // ============ PIPELINE BOARD ============

  @Get('pipelines/:pipelineId/board')
  @ApiOperation({ summary: 'Get Kanban board view of pipeline' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  getPipelineBoard(@Param('clientId') clientId: string, @Param('pipelineId') pipelineId: string) {
    return this.pipelineService.getPipelineBoard(clientId, pipelineId);
  }

  // ============ ACTIVITIES ============

  @Post('activities')
  @ApiOperation({ summary: 'Create activity' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  createActivity(
    @Param('clientId') clientId: string,
    @Body() dto: CreateActivityDto,
    @Request() req: any,
  ) {
    // TODO: Get user ID from auth context
    const userId = req.user?.id || 'system';
    return this.activityService.createActivity(clientId, userId, dto);
  }

  @Get('activities')
  @ApiOperation({ summary: 'List activities' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  listActivities(@Param('clientId') clientId: string, @Query() query: ListActivitiesQueryDto) {
    return this.activityService.listActivities(clientId, query);
  }

  @Get('activities/:activityId')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  getActivity(@Param('clientId') clientId: string, @Param('activityId') activityId: string) {
    return this.activityService.getActivity(clientId, activityId);
  }

  @Delete('activities/:activityId')
  @ApiOperation({ summary: 'Delete activity' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(@Param('clientId') clientId: string, @Param('activityId') activityId: string) {
    return this.activityService.deleteActivity(clientId, activityId);
  }

  // ============ TASKS ============

  @Post('tasks')
  @ApiOperation({ summary: 'Create task' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  createTask(@Param('clientId') clientId: string, @Body() dto: CreateTaskDto) {
    return this.taskService.createTask(clientId, dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  listTasks(@Param('clientId') clientId: string, @Query() query: ListTasksQueryDto) {
    return this.taskService.listTasks(clientId, query);
  }

  @Get('tasks/due-soon')
  @ApiOperation({ summary: 'Get tasks due soon' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  getTasksDueSoon(@Param('clientId') clientId: string, @Query('days') days?: number) {
    return this.taskService.getTasksDueSoon(clientId, days ? Number(days) : 7);
  }

  @Get('tasks/overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  getOverdueTasks(@Param('clientId') clientId: string) {
    return this.taskService.getOverdueTasks(clientId);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  getTask(@Param('clientId') clientId: string, @Param('taskId') taskId: string) {
    return this.taskService.getTask(clientId, taskId);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  updateTask(
    @Param('clientId') clientId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(clientId, taskId, dto);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete task' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(@Param('clientId') clientId: string, @Param('taskId') taskId: string) {
    return this.taskService.deleteTask(clientId, taskId);
  }

  // ============ MEMBERS ============

  @Post('members')
  @ApiOperation({ summary: 'Add member to client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  addMember(@Param('clientId') clientId: string, @Body() dto: AddMemberDto) {
    return this.memberService.addMember(clientId, dto);
  }

  @Get('members')
  @ApiOperation({ summary: 'List client members' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  listMembers(@Param('clientId') clientId: string) {
    return this.memberService.listMembers(clientId);
  }

  @Patch('members/:memberId')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  updateMemberRole(
    @Param('clientId') clientId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.memberService.updateMemberRole(clientId, memberId, dto);
  }

  @Delete('members/:memberId')
  @ApiOperation({ summary: 'Remove member from client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param('clientId') clientId: string, @Param('memberId') memberId: string) {
    return this.memberService.removeMember(clientId, memberId);
  }

  // ============ LEAD CRM FIELDS ============

  @Patch('leads/:leadId/stage')
  @ApiOperation({ summary: 'Update lead stage' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  updateLeadStage(
    @Param('clientId') clientId: string,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadStageDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.leadCrmService.updateLeadStage(clientId, leadId, dto, userId);
  }

  @Patch('leads/:leadId/owner')
  @ApiOperation({ summary: 'Update lead owner' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  updateLeadOwner(
    @Param('clientId') clientId: string,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadOwnerDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.leadCrmService.updateLeadOwner(clientId, leadId, dto, userId);
  }

  @Patch('leads/:leadId')
  @ApiOperation({ summary: 'Update lead CRM fields' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  updateLeadCrmFields(
    @Param('clientId') clientId: string,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadCrmFieldsDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.leadCrmService.updateLeadCrmFields(clientId, leadId, dto, userId);
  }

  @Get('stages/:stageId/leads')
  @ApiOperation({ summary: 'Get leads in a specific stage' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  getLeadsByStage(
    @Param('clientId') clientId: string,
    @Param('stageId') stageId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leadCrmService.getLeadsByStage(
      clientId,
      stageId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }
}
