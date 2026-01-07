import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { GooglePlacesProvider } from './providers/google-places.provider';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AutoGenxModule } from '../autogenx/autogenx.module';

@Module({
  imports: [HttpModule, ConfigModule, AuthModule, AutoGenxModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, GooglePlacesProvider, PrismaService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
