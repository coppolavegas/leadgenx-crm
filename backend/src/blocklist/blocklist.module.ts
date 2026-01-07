import { Module } from '@nestjs/common';
import { BlocklistController } from './blocklist.controller';
import { BlocklistService } from './blocklist.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BlocklistController],
  providers: [BlocklistService, PrismaService],
  exports: [BlocklistService],
})
export class BlocklistModule {}
