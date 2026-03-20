import { Controller, Post, Body } from '@nestjs/common';
import { SimulatorService, AffordabilityInput, ValorizationInput } from './simulator.service';

@Controller('simulator')
export class SimulatorController {
  constructor(private simulatorService: SimulatorService) {}

  @Post('affordability')
  async calculateAffordability(@Body() input: AffordabilityInput) {
    return this.simulatorService.calculateAffordability(input);
  }

  @Post('valorization')
  async calculateValorization(@Body() input: ValorizationInput) {
    return this.simulatorService.calculateValorization(input);
  }
}
