import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineDto, UpdatePipelineDto, CreateStageDto, UpdateStageDto } from '../dto/pipeline.dto';

@Injectable()
export class PipelineService {
  constructor(private prisma: PrismaService) {}

  // ============ PIPELINES ============

  async createPipeline(clientId: string, dto: CreatePipelineDto) {
    // If this pipeline is marked as default, unset any existing default
    if (dto.is_default) {
      await this.prisma.client_pipeline.updateMany({
        where: { client_id: clientId, is_default: true },
        data: { is_default: false },
      });
    }

    return this.prisma.client_pipeline.create({
      data: {
        client_id: clientId,
        name: dto.name,
        description: dto.description,
        is_default: dto.is_default ?? false,
        position: dto.position ?? 0,
      },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async listPipelines(clientId: string) {
    return this.prisma.client_pipeline.findMany({
      where: { client_id: clientId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { stages: true },
        },
      },
      orderBy: [{ is_default: 'desc' }, { position: 'asc' }],
    });
  }

  async getPipeline(clientId: string, pipelineId: string) {
    const pipeline = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: { leads: true },
            },
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    return pipeline;
  }

  async updatePipeline(clientId: string, pipelineId: string, dto: UpdatePipelineDto) {
    // Check pipeline exists and belongs to client
    const existing = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
    });

    if (!existing) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    // If setting as default, unset other defaults
    if (dto.is_default) {
      await this.prisma.client_pipeline.updateMany({
        where: { client_id: clientId, is_default: true },
        data: { is_default: false },
      });
    }

    return this.prisma.client_pipeline.update({
      where: { id: pipelineId },
      data: {
        name: dto.name,
        description: dto.description,
        is_default: dto.is_default,
        position: dto.position,
      },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async deletePipeline(clientId: string, pipelineId: string) {
    // Check pipeline exists and belongs to client
    const existing = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
    });

    if (!existing) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    // Check if any leads are using stages from this pipeline
    const stageIds = await this.prisma.client_pipeline_stage.findMany({
      where: { pipeline_id: pipelineId },
      select: { id: true },
    });

    if (stageIds.length > 0) {
      const leadsCount = await this.prisma.lead.count({
        where: { crm_stage_id: { in: stageIds.map((s) => s.id) } },
      });

      if (leadsCount > 0) {
        throw new BadRequestException(
          `Cannot delete pipeline: ${leadsCount} lead(s) are using stages from this pipeline`,
        );
      }
    }

    await this.prisma.client_pipeline.delete({
      where: { id: pipelineId },
    });

    return { message: 'Pipeline deleted successfully' };
  }

  // ============ STAGES ============

  async createStage(clientId: string, pipelineId: string, dto: CreateStageDto) {
    // Verify pipeline belongs to client
    const pipeline = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    return this.prisma.client_pipeline_stage.create({
      data: {
        pipeline_id: pipelineId,
        name: dto.name,
        position: dto.position,
        color: dto.color ?? '#6E4AFF',
      },
    });
  }

  async listStages(clientId: string, pipelineId: string) {
    // Verify pipeline belongs to client
    const pipeline = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    return this.prisma.client_pipeline_stage.findMany({
      where: { pipeline_id: pipelineId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async updateStage(clientId: string, pipelineId: string, stageId: string, dto: UpdateStageDto) {
    // Verify pipeline belongs to client
    const pipeline = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    // Verify stage belongs to pipeline
    const stage = await this.prisma.client_pipeline_stage.findFirst({
      where: { id: stageId, pipeline_id: pipelineId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage ${stageId} not found in pipeline ${pipelineId}`);
    }

    return this.prisma.client_pipeline_stage.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        position: dto.position,
        color: dto.color,
      },
    });
  }

  async deleteStage(clientId: string, pipelineId: string, stageId: string) {
    // Verify pipeline belongs to client
    const pipeline = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    // Verify stage belongs to pipeline
    const stage = await this.prisma.client_pipeline_stage.findFirst({
      where: { id: stageId, pipeline_id: pipelineId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage ${stageId} not found in pipeline ${pipelineId}`);
    }

    // Check if any leads are in this stage
    const leadsCount = await this.prisma.lead.count({
      where: { crm_stage_id: stageId },
    });

    if (leadsCount > 0) {
      throw new BadRequestException(
        `Cannot delete stage: ${leadsCount} lead(s) are currently in this stage`,
      );
    }

    await this.prisma.client_pipeline_stage.delete({
      where: { id: stageId },
    });

    return { message: 'Stage deleted successfully' };
  }

  // ============ BOARD VIEW ============

  async getPipelineBoard(clientId: string, pipelineId: string) {
    // Verify pipeline belongs to client
    const pipeline = await this.prisma.client_pipeline.findFirst({
      where: { id: pipelineId, client_id: clientId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    // Get all leads in each stage
    const stagesWithLeads = await Promise.all(
      pipeline.stages.map(async (stage) => {
        const leads = await this.prisma.lead.findMany({
          where: { crm_stage_id: stage.id },
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
        });

        return {
          ...stage,
          leads,
          leads_count: leads.length,
        };
      }),
    );

    return {
      pipeline,
      stages: stagesWithLeads,
    };
  }
}
