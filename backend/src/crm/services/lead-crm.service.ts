import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLeadStageDto, UpdateLeadOwnerDto, UpdateLeadCrmFieldsDto } from '../dto/lead-crm.dto';
import { AutoGenxService } from '../../autogenx/autogenx.service';

@Injectable()
export class LeadCrmService {
  constructor(
    private prisma: PrismaService,
    private autogenx: AutoGenxService,
  ) {}

  async updateLeadStage(clientId: string, leadId: string, dto: UpdateLeadStageDto, userId: string) {
    // Verify lead exists
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    // Verify stage exists and belongs to client's pipeline
    const stage = await this.prisma.client_pipeline_stage.findFirst({
      where: {
        id: dto.crm_stage_id,
        pipeline: {
          client_id: clientId,
        },
      },
      include: {
        pipeline: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException(`Stage ${dto.crm_stage_id} not found`);
    }

    // Update lead stage
    const updatedLead = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        crm_stage_id: dto.crm_stage_id,
      },
      include: {
        crm_stage: {
          include: {
            pipeline: true,
          },
        },
        owner: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    // Create activity for stage change
    await this.prisma.activity.create({
      data: {
        client_id: clientId,
        lead_id: leadId,
        type: 'stage_changed',
        content: `Stage changed to ${stage.name}`,
        meta: {
          old_stage_id: lead.crm_stage_id,
          new_stage_id: dto.crm_stage_id,
          pipeline_id: stage.pipeline.id,
        },
        created_by_user_id: userId,
      },
    });

    // AutoGenX Phase 1: Emit lead_status_changed event (fire-and-forget)
    this.autogenx.emitEvent({
      workspaceId: stage.pipeline.client.organization_id,
      leadId: leadId,
      eventType: 'lead_status_changed',
      payload: {
        old_stage_id: lead.crm_stage_id,
        new_stage_id: dto.crm_stage_id,
        stage_name: stage.name,
        client_id: clientId,
      },
    });

    return updatedLead;
  }

  async updateLeadOwner(clientId: string, leadId: string, dto: UpdateLeadOwnerDto, userId: string) {
    // Verify lead exists
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    // Verify new owner exists
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.owner_user_id },
    });

    if (!owner) {
      throw new NotFoundException(`User ${dto.owner_user_id} not found`);
    }

    // Update lead owner
    const updatedLead = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        owner_user_id: dto.owner_user_id,
      },
      include: {
        owner: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        crm_stage: {
          include: {
            pipeline: true,
          },
        },
      },
    });

    // Create activity for owner change
    await this.prisma.activity.create({
      data: {
        client_id: clientId,
        lead_id: leadId,
        type: 'owner_changed',
        content: `Owner changed to ${owner.full_name}`,
        meta: {
          old_owner_id: lead.owner_user_id,
          new_owner_id: dto.owner_user_id,
        },
        created_by_user_id: userId,
      },
    });

    return updatedLead;
  }

  async updateLeadCrmFields(clientId: string, leadId: string, dto: UpdateLeadCrmFieldsDto, userId: string) {
    // Verify lead exists
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    // If stage is being updated, verify it belongs to client
    if (dto.crm_stage_id) {
      const stage = await this.prisma.client_pipeline_stage.findFirst({
        where: {
          id: dto.crm_stage_id,
          pipeline: {
            client_id: clientId,
          },
        },
      });

      if (!stage) {
        throw new NotFoundException(`Stage ${dto.crm_stage_id} not found`);
      }
    }

    // If owner is being updated, verify user exists
    if (dto.owner_user_id) {
      const owner = await this.prisma.user.findUnique({
        where: { id: dto.owner_user_id },
      });

      if (!owner) {
        throw new NotFoundException(`User ${dto.owner_user_id} not found`);
      }
    }

    // Update lead
    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        crm_stage_id: dto.crm_stage_id,
        owner_user_id: dto.owner_user_id,
        last_contacted_at: dto.last_contacted_at ? new Date(dto.last_contacted_at) : undefined,
        next_task_due_at: dto.next_task_due_at ? new Date(dto.next_task_due_at) : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        crm_stage: {
          include: {
            pipeline: true,
          },
        },
        enriched_lead: true,
      },
    });
  }

  // Get leads by stage for a client
  async getLeadsByStage(clientId: string, stageId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    // Verify stage belongs to client
    const stage = await this.prisma.client_pipeline_stage.findFirst({
      where: {
        id: stageId,
        pipeline: {
          client_id: clientId,
        },
      },
    });

    if (!stage) {
      throw new NotFoundException(`Stage ${stageId} not found`);
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where: { crm_stage_id: stageId },
        include: {
          owner: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          enriched_lead: true,
          _count: {
            select: {
              tasks: true,
              activities: true,
            },
          },
        },
        orderBy: { last_seen_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where: { crm_stage_id: stageId } }),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
