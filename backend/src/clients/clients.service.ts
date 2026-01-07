import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createClientDto: CreateClientDto) {
    this.logger.log(`Creating client for organization ${organizationId}`);

    const client = await this.prisma.client.create({
      data: {
        organization_id: organizationId,
        ...createClientDto,
      },
    });

    this.logger.log(`Client created: ${client.id}`);
    return client;
  }

  async findAll(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: { campaigns: true },
        },
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        organization_id: organizationId,
      },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            vertical: true,
            created_at: true,
            last_run_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(organizationId: string, id: string, updateClientDto: UpdateClientDto) {
    // Check if client exists and belongs to organization
    await this.findOne(organizationId, id);

    const client = await this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });

    this.logger.log(`Client updated: ${client.id}`);
    return client;
  }

  async remove(organizationId: string, id: string) {
    // Check if client exists and belongs to organization
    await this.findOne(organizationId, id);

    await this.prisma.client.delete({
      where: { id },
    });

    this.logger.log(`Client deleted: ${id}`);
    return { message: 'Client deleted successfully' };
  }
}
