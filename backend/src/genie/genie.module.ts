import { Module } from '@nestjs/common';
import { GenieController } from './genie.controller';
import { GenieService } from './genie.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GenieController],
  providers: [GenieService],
  exports: [GenieService],
})
export class GenieModule {}
