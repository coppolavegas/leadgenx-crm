import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InboxModule } from '../inbox/inbox.module';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './services/outreach.service';
import { MessageLogService } from './services/message-log.service';
import { WebhookService } from './services/webhook.service';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => InboxModule)],
  controllers: [OutreachController],
  providers: [OutreachService, MessageLogService, WebhookService],
  exports: [OutreachService, MessageLogService, WebhookService],
})
export class OutreachModule {}
