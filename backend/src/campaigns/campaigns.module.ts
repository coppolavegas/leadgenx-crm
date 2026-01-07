import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { AuthModule } from '../auth/auth.module';
import { BriefParserService } from './services/brief-parser.service';
import { TemplateService } from './services/template.service';
import { WebsiteAnalyzerService } from './services/website-analyzer.service';

@Module({
  imports: [PrismaModule, DiscoveryModule, EnrichmentModule, AuthModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, BriefParserService, TemplateService, WebsiteAnalyzerService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
