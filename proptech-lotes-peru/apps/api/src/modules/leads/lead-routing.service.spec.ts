import { LeadRoutingService } from './lead-routing.service';

describe('LeadRoutingService', () => {
  let service: LeadRoutingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      routingRule: {
        findMany: jest.fn(),
      },
      leadEvent: {
        create: jest.fn(),
      },
    };
    service = new LeadRoutingService(mockPrisma);
  });

  describe('generateWhatsAppLink', () => {
    it('should generate a proper WhatsApp link', () => {
      const lead = {
        name: 'Juan Pérez',
        phone: '+51999888777',
        budget: 30000,
      };

      const link = service.generateWhatsAppLink('51999888777', lead);
      expect(link).toContain('https://wa.me/51999888777');
      expect(link).toContain('Juan');
      expect(link).toContain('30');
    });
  });

  describe('routeLead', () => {
    it('should route lead to all active rules', async () => {
      mockPrisma.routingRule.findMany.mockResolvedValue([
        { id: '1', type: 'EMAIL', target: 'test@test.com' },
        { id: '2', type: 'WHATSAPP', target: '51999888777' },
      ]);
      mockPrisma.leadEvent.create.mockResolvedValue({});

      const lead = {
        id: 'lead1',
        projectId: 'proj1',
        name: 'Test Lead',
        phone: '+51999888777',
      };

      await service.routeLead(lead);

      expect(mockPrisma.routingRule.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj1', isActive: true },
      });
      expect(mockPrisma.leadEvent.create).toHaveBeenCalledTimes(2);
    });

    it('should skip routing if no projectId', async () => {
      const lead = { id: 'lead1', name: 'Test' };
      await service.routeLead(lead);
      expect(mockPrisma.routingRule.findMany).not.toHaveBeenCalled();
    });
  });
});
