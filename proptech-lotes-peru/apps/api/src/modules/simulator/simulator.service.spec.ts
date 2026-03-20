import { SimulatorService } from './simulator.service';

describe('SimulatorService', () => {
  let service: SimulatorService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        findMany: jest.fn(),
      },
      zone: {
        findUnique: jest.fn(),
      },
    };
    service = new SimulatorService(mockPrisma);
  });

  describe('calculateAffordability', () => {
    it('should calculate effective budget from down payment + monthly * term', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Test Project',
          minPrice: 20000,
          maxPrice: 50000,
          safetyScore: 80,
          downPaymentMin: 4000,
          monthlyPaymentEst: 500,
          priceM2Min: 150,
          valorizationEstimate: 10,
          city: { name: 'Lima' },
          zone: { name: 'Test Zone' },
          developer: { id: '1', name: 'Test Dev', slug: 'test-dev', isVerified: true },
          images: [],
        },
      ]);

      const result = await service.calculateAffordability({
        downPayment: 5000,
        monthlyPayment: 600,
        termMonths: 36,
      });

      expect(result.input.totalBudget).toBe(5000 + 600 * 36); // 26600
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].score).toBeGreaterThan(0);
      expect(result.recommendations[0].reasons.length).toBeGreaterThan(0);
    });

    it('should return empty when no projects match', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await service.calculateAffordability({
        totalBudget: 1000,
      });

      expect(result.recommendations.length).toBe(0);
    });
  });

  describe('calculateValorization', () => {
    it('should return valorization estimates for a zone', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue({
        name: 'Cañete',
        city: { name: 'Lima' },
        projects: [
          { priceM2Min: 200, priceM2Max: 350, valorizationEstimate: 10 },
          { priceM2Min: 180, priceM2Max: 300, valorizationEstimate: 8 },
        ],
      });

      const result = await service.calculateValorization({
        zoneSlug: 'canete-asia',
        horizonMonths: 24,
      });

      expect(result).toHaveProperty('estimates');
      expect(result).toHaveProperty('disclaimer');
      expect((result as any).estimates.expected.priceM2).toBeGreaterThan(0);
      expect((result as any).currentAvgPriceM2).toBe(190);
    });

    it('should return error when zone not found', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      const result = await service.calculateValorization({
        zoneSlug: 'nonexistent',
        horizonMonths: 12,
      });

      expect(result).toEqual({ error: 'Zona no encontrada' });
    });
  });
});
