import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadRoutingService } from './lead-routing.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadRoutingService],
  exports: [LeadsService],
})
export class LeadsModule {}
