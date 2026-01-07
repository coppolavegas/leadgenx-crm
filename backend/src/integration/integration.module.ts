import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { EventSigningService } from './services/event-signing.service';
import { EventPublishingService } from './services/event-publishing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationController],
  providers: [EventSigningService, EventPublishingService],
  exports: [EventSigningService, EventPublishingService],
})
export class IntegrationModule {}
