import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { GuardsModule } from './auth/guards/guards.module';
import { UsersModule } from './users/users.module';
import { ClubsModule } from './clubs/clubs.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { BracketsModule } from './brackets/brackets.module';
import { InvoicesModule } from './invoices/invoices.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { CheckinModule } from './checkin/checkin.module';
import { CombatsModule } from './combats/combats.module';
import { RefereesModule } from './referees/referees.module';
import { ProtestsModule } from './protests/protests.module';
import { RegulationsModule } from './regulations/regulations.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    MailModule,
    EventsModule,
    AuthModule,
    GuardsModule,
    UsersModule,
    ClubsModule,
    TournamentsModule,
    RegistrationsModule,
    BracketsModule,
    InvoicesModule,
    UploadsModule,
    AdminModule,
    ApiKeysModule,
    CheckinModule,
    CombatsModule,
    RefereesModule,
    ProtestsModule,
    RegulationsModule,
    PushModule,
  ],
})
export class AppModule {}
