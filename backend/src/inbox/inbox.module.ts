import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { TaskEngineService } from './task-engine.service';
import { SlaTrackingService } from './sla-tracking.service';
import { AutomationService } from './automation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InboxController],
  providers: [
    InboxService,
    TaskEngineService,
    SlaTrackingService,
    AutomationService,
  ],
  exports: [
    InboxService,
    TaskEngineService,
    SlaTrackingService,
    AutomationService,
  ],
})
export class InboxModule {}
