import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddMemberDto, UpdateMemberRoleDto } from '../dto/member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async addMember(clientId: string, dto: AddMemberDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.user_id },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.user_id} not found`);
    }

    // Check if user is already a member
    const existingMember = await this.prisma.client_member.findUnique({
      where: {
        client_id_user_id: {
          client_id: clientId,
          user_id: dto.user_id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this client');
    }

    return this.prisma.client_member.create({
      data: {
        client_id: clientId,
        user_id: dto.user_id,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            title: true,
          },
        },
      },
    });
  }

  async listMembers(clientId: string) {
    return this.prisma.client_member.findMany({
      where: { client_id: clientId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            title: true,
            last_login_at: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // owners first
        { created_at: 'asc' },
      ],
    });
  }

  async updateMemberRole(clientId: string, memberId: string, dto: UpdateMemberRoleDto) {
    // Verify member exists
    const member = await this.prisma.client_member.findFirst({
      where: {
        id: memberId,
        client_id: clientId,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    // Prevent removing the last owner
    if (member.role === 'owner' && dto.role !== 'owner') {
      const ownerCount = await this.prisma.client_member.count({
        where: {
          client_id: clientId,
          role: 'owner',
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner from the client');
      }
    }

    return this.prisma.client_member.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            title: true,
          },
        },
      },
    });
  }

  async removeMember(clientId: string, memberId: string) {
    // Verify member exists
    const member = await this.prisma.client_member.findFirst({
      where: {
        id: memberId,
        client_id: clientId,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    // Prevent removing the last owner
    if (member.role === 'owner') {
      const ownerCount = await this.prisma.client_member.count({
        where: {
          client_id: clientId,
          role: 'owner',
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner from the client');
      }
    }

    await this.prisma.client_member.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }

  // Check if user has access to client
  async userHasAccess(clientId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.client_member.findUnique({
      where: {
        client_id_user_id: {
          client_id: clientId,
          user_id: userId,
        },
      },
    });

    return !!member;
  }

  // Get user's role in client
  async getUserRole(clientId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.client_member.findUnique({
      where: {
        client_id_user_id: {
          client_id: clientId,
          user_id: userId,
        },
      },
    });

    return member?.role ?? null;
  }
}
