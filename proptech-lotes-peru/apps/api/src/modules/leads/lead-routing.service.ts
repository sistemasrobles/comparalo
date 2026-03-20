import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { logger } from '../../common/utils/logger';

@Injectable()
export class LeadRoutingService {
  constructor(private prisma: PrismaService) {}

  async routeLead(lead: any) {
    if (!lead.projectId) return;

    const rules = await this.prisma.routingRule.findMany({
      where: {
        projectId: lead.projectId,
        isActive: true,
      },
    });

    for (const rule of rules) {
      try {
        switch (rule.type) {
          case 'EMAIL':
            await this.sendEmail(rule.target, lead);
            break;
          case 'WEBHOOK':
            await this.sendWebhook(rule.target, lead);
            break;
          case 'WHATSAPP':
            // Just generate the link and log it (no automated sending)
            const whatsappUrl = this.generateWhatsAppLink(rule.target, lead);
            logger.info(`WhatsApp link for lead ${lead.id}: ${whatsappUrl}`);
            break;
        }

        await this.prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            type: `ROUTED_${rule.type}`,
            data: { target: rule.target, ruleId: rule.id },
          },
        });
      } catch (error) {
        logger.error(`Failed to route lead ${lead.id} via ${rule.type}:`, { error });
      }
    }
  }

  private async sendEmail(to: string, lead: any): Promise<void> {
    // In production, integrate with SendGrid, SES, etc.
    logger.info(`[EMAIL] Would send lead notification to ${to} for lead ${lead.name} (${lead.phone})`);
  }

  private async sendWebhook(url: string, lead: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            budget: lead.budget,
            paymentMethod: lead.paymentMethod,
            projectId: lead.projectId,
            createdAt: lead.createdAt,
          },
        }),
      });
      logger.info(`[WEBHOOK] Sent to ${url}, status: ${response.status}`);
    } catch (error) {
      logger.error(`[WEBHOOK] Failed to send to ${url}:`, { error });
    }
  }

  generateWhatsAppLink(phone: string, lead: any): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hola, soy ${lead.name}. Estoy interesado en información sobre terrenos` +
      (lead.budget ? `. Mi presupuesto es de S/${lead.budget.toLocaleString()}` : '') +
      `. Mi teléfono es ${lead.phone}.`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }
}
