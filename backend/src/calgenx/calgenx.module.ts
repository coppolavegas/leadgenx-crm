import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

// Controllers
import { CalGenXController } from './calgenx.controller';
import { PublicBookingController } from './public-booking.controller';
import { PublicIcalController } from './public-ical.controller';
import { GoogleCalendarController } from './controllers/google-calendar.controller';

// Services
import { AppointmentTypeService } from './services/appointment-type.service';
import { AvailabilityService } from './services/availability.service';
import { AppointmentService } from './services/appointment.service';
import { BookingLinkService } from './services/booking-link.service';
import { SlotGenerationService } from './services/slot-generation.service';
import { IcalFeedService } from './services/ical-feed.service';
import { IcalGeneratorService } from './services/ical-generator.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { GoogleCalendarApiService } from './services/google-calendar-api.service';

// Guards
import { CalGenXFeatureGuard } from './guards/calgenx-feature.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CommonModule,
    ConfigModule,
    CacheModule.register({
      ttl: 60000, // 60 seconds default TTL
      max: 100, // Max 100 items in cache
    }),
  ],
  controllers: [
    CalGenXController,
    PublicBookingController,
    PublicIcalController,
    GoogleCalendarController,
  ],
  providers: [
    // Services
    AppointmentTypeService,
    AvailabilityService,
    AppointmentService,
    BookingLinkService,
    SlotGenerationService,
    IcalFeedService,
    IcalGeneratorService,
    GoogleOAuthService,
    GoogleCalendarApiService,
    // Guards
    CalGenXFeatureGuard,
  ],
  exports: [
    // Export services in case other modules need them
    AppointmentService,
    SlotGenerationService,
    IcalFeedService,
  ],
})
export class CalGenXModule implements OnModuleInit {
  constructor(
    private readonly slotGenerationService: SlotGenerationService,
    private readonly appointmentService: AppointmentService,
    private readonly googleCalendarApi: GoogleCalendarApiService,
  ) {}

  /**
   * Wire up lazy dependencies to avoid circular dependencies
   */
  onModuleInit() {
    // Inject Google Calendar API into services that need it
    this.slotGenerationService.setGoogleCalendarApi(this.googleCalendarApi);
    this.appointmentService.setGoogleCalendarApi(this.googleCalendarApi);
  }
}
