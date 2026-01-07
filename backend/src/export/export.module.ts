import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { WebhooksController } from './webhooks.controller';
import { ExportService } from './export.service';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ExportController, WebhooksController],
  providers: [ExportService, WebhookService, PrismaService],
  exports: [WebhookService],
})
export class ExportModule {}
