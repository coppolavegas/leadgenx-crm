import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AutoGenxModule } from '../autogenx/autogenx.module';
import { CrmController } from './crm.controller';
import { PipelineService } from './services/pipeline.service';
import { ActivityService } from './services/activity.service';
import { TaskService } from './services/task.service';
import { MemberService } from './services/member.service';
import { LeadCrmService } from './services/lead-crm.service';

@Module({
  imports: [PrismaModule, AutoGenxModule],
  controllers: [CrmController],
  providers: [
    PipelineService,
    ActivityService,
    TaskService,
    MemberService,
    LeadCrmService,
  ],
  exports: [
    PipelineService,
    ActivityService,
    TaskService,
    MemberService,
    LeadCrmService,
  ],
})
export class CrmModule {}
