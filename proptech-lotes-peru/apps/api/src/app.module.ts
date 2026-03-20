import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SimulatorModule } from './modules/simulator/simulator.module';
import { CompareModule } from './modules/compare/compare.module';
import { AdminModule } from './modules/admin/admin.module';
import { CitiesModule } from './modules/cities/cities.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SeoModule } from './modules/seo/seo.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60') * 1000,
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    }]),
    // Core
    PrismaModule,
    RedisModule,
    // Feature modules
    AuthModule,
    ProjectsModule,
    LeadsModule,
    SimulatorModule,
    CompareModule,
    AdminModule,
    CitiesModule,
    ReviewsModule,
    SeoModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
