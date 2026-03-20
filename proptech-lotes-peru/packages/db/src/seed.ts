import { PrismaClient, AccessType, LegalStatus, LeadStatus, LeadPaymentMethod, LeadTimeline, ReviewType, ReviewStatus, RoutingType, LotStatus, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.analyticsEvent.deleteMany();
  await prisma.leadEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.review.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.legalDocument.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.projectImage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.city.deleteMany();
  await prisma.developer.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.seoPage.deleteMany();
  await prisma.user.deleteMany();

  // =========== ADMIN USER ===========
  console.log('  Creating admin user...');
  await prisma.user.create({
    data: { email: 'admin@comparalotes.pe', password: hashPassword('Admin123!'), name: 'Admin ComparaLotes', role: UserRole.ADMIN },
  });

  // =========== DEVELOPERS ===========
  console.log('  Creating developers...');
  const [amadoryrios, zooma, gruporobles, ecoplaza] = await Promise.all([
    prisma.developer.create({
      data: {
        name: 'Amador y Rios Inmobiliaria', slug: 'amador-y-rios', ruc: '20610987654',
        description: 'Desarrollos que definen el estilo de vida amazónico. Urbanizaciones sostenibles y lotes de inversión estratégica en armonía con la selva peruana.',
        website: 'https://amadoryrios.pe', phone: '+51 981 166 282', email: 'contacto@amadoryrios.pe', yearsActive: 5, isVerified: true,
      },
    }),
    prisma.developer.create({
      data: {
        name: 'Zooma Inmobiliaria', slug: 'zooma', ruc: '20620123456',
        description: 'Lotes exclusivos en la costa, sierra y selva del Perú para que elijas dónde sembrar tu futuro.',
        website: 'https://zooma.pe', phone: '+51 967 385 368', email: 'ventas@zooma.pe', yearsActive: 3, isVerified: true,
      },
    }),
    prisma.developer.create({
      data: {
        name: 'Grupo Robles & Yasikov', slug: 'grupo-robles', ruc: '20630567890',
        description: 'Proyectos inmobiliarios ecoamigables de alta calidad, con lotes y cabañas en condominios exclusivos.',
        website: 'https://gruporobles.com.pe', phone: '+51 947 278 914', email: 'ventas@gruporobles.com.pe', yearsActive: 10, isVerified: true,
      },
    }),
    prisma.developer.create({
      data: {
        name: 'Ecoplaza Edificaciones', slug: 'ecoplaza', ruc: '20640987123',
        description: 'Las mejores opciones para tu inversión inmobiliaria. Mercados y centros comerciales en ubicaciones estratégicas del Perú.',
        website: 'https://ecoplazaedificaciones.com.pe', phone: '+51 1 500 0000', email: 'ventas@ecoplaza.pe', yearsActive: 8, isVerified: true,
      },
    }),
  ]);

  // =========== CITIES ===========
  console.log('  Creating cities...');
  const [lima, laLibertad, ancash, huanuco, loreto, pasco, junin, lambayeque, ica] = await Promise.all([
    prisma.city.create({ data: { name: 'Lima', slug: 'lima', region: 'Lima', lat: -12.0464, lng: -77.0428, seoTitle: 'Terrenos y Lotes en Lima | ComparaLotes', seoDescription: 'Terrenos en Lima desde S/15,000.', seoContent: 'Lima ofrece diversas oportunidades de inversión.' } }),
    prisma.city.create({ data: { name: 'La Libertad', slug: 'la-libertad', region: 'La Libertad', lat: -8.1116, lng: -79.0288, seoTitle: 'Terrenos en La Libertad | ComparaLotes', seoDescription: 'Lotes frente al mar en La Libertad.', seoContent: 'La Libertad combina playas, historia y desarrollo.' } }),
    prisma.city.create({ data: { name: 'Áncash', slug: 'ancash', region: 'Áncash', lat: -9.5293, lng: -77.5280, seoTitle: 'Terrenos en Áncash | ComparaLotes', seoDescription: 'Lotes urbanizados en Nuevo Chimbote.', seoContent: 'Áncash ofrece lotes urbanizados con obras completas.' } }),
    prisma.city.create({ data: { name: 'Huánuco', slug: 'huanuco', region: 'Huánuco', lat: -9.9306, lng: -76.2422, seoTitle: 'Terrenos en Huánuco | ComparaLotes', seoDescription: 'Lotes campestres en Codo del Pozuzo.', seoContent: 'Huánuco: terrenos campestres en biodiversidad única.' } }),
    prisma.city.create({ data: { name: 'Loreto', slug: 'loreto', region: 'Loreto', lat: -3.7491, lng: -73.2538, seoTitle: 'Terrenos en Loreto | ComparaLotes', seoDescription: 'Lotes campestres en Iquitos desde S/30,000.', seoContent: 'Loreto ofrece lotes con alta valorización.' } }),
    prisma.city.create({ data: { name: 'Pasco', slug: 'pasco', region: 'Pasco', lat: -10.6833, lng: -76.2564, seoTitle: 'Terrenos en Oxapampa | ComparaLotes', seoDescription: 'Condominios campestres en Oxapampa.', seoContent: 'Pasco: destino emergente para inversión en lotes.' } }),
    prisma.city.create({ data: { name: 'Junín', slug: 'junin', region: 'Junín', lat: -11.1588, lng: -75.9930, seoTitle: 'Terrenos en Junín | ComparaLotes', seoDescription: 'Lotes en La Merced y Chanchamayo.', seoContent: 'Junín ofrece lotes en la selva central.' } }),
    prisma.city.create({ data: { name: 'Lambayeque', slug: 'lambayeque', region: 'Lambayeque', lat: -6.7011, lng: -79.9060, seoTitle: 'Terrenos en Lambayeque | ComparaLotes', seoDescription: 'Lotes en Pimentel cerca a la playa.', seoContent: 'Lambayeque ofrece lotes urbanizados en zonas de playa.' } }),
    prisma.city.create({ data: { name: 'Ica', slug: 'ica', region: 'Ica', lat: -14.0678, lng: -75.7286, seoTitle: 'Terrenos en Ica | ComparaLotes', seoDescription: 'Proyectos en Ica y Chincha.', seoContent: 'Ica tiene gran crecimiento inmobiliario.' } }),
  ]);

  // =========== ZONES ===========
  console.log('  Creating zones...');
  const [zHuampani, zNuevoChimbote, zGuadalupito, zCodoPozuzo, zOxapampa, zIquitos, zChanchamayo, zPimentel, zChincha, zAte] = await Promise.all([
    prisma.zone.create({ data: { name: 'Huampaní - Chaclacayo', slug: 'huampani', cityId: lima.id } }),
    prisma.zone.create({ data: { name: 'Nuevo Chimbote', slug: 'nuevo-chimbote', cityId: ancash.id } }),
    prisma.zone.create({ data: { name: 'Guadalupito', slug: 'guadalupito', cityId: laLibertad.id } }),
    prisma.zone.create({ data: { name: 'Codo del Pozuzo', slug: 'codo-del-pozuzo', cityId: huanuco.id } }),
    prisma.zone.create({ data: { name: 'Oxapampa - Santa Cruz', slug: 'oxapampa', cityId: pasco.id } }),
    prisma.zone.create({ data: { name: 'Carretera Iquitos-Nauta', slug: 'iquitos-nauta', cityId: loreto.id } }),
    prisma.zone.create({ data: { name: 'Chanchamayo', slug: 'chanchamayo', cityId: junin.id } }),
    prisma.zone.create({ data: { name: 'Pimentel', slug: 'pimentel', cityId: lambayeque.id } }),
    prisma.zone.create({ data: { name: 'Chincha Alta', slug: 'chincha', cityId: ica.id } }),
    prisma.zone.create({ data: { name: 'Ate - Santa Clara', slug: 'ate-santa-clara', cityId: lima.id } }),
  ]);

  // =========== PROJECTS ===========
  console.log('  Creating real projects...');

  // --- AMADOR Y RIOS ---
  const ciudadPrada = await prisma.project.create({
    data: {
      name: 'Ciudad Prada', slug: 'ciudad-prada', developerId: amadoryrios.id, cityId: huanuco.id, zoneId: zCodoPozuzo.id,
      description: 'Ciudad Prada es un lugar donde la serenidad y la seguridad se fusionan. 1,157 hectáreas en 3 etapas, con sistemas de seguridad, centros educativos y de salud, espacios recreativos y deportivos. Ubicado en Codo del Pozuzo, a 15 min de la plaza de armas.',
      minPrice: 33000, maxPrice: 120000, priceM2Min: 110, priceM2Max: 130,
      lotSizeMin: 300, lotSizeMax: 930, totalLots: 500,
      downPaymentMin: 5000, monthlyPaymentEst: 1590, termMonthsEst: 48,
      lat: -9.7167, lng: -75.4333, addressText: 'Codo del Pozuzo, Puerto Inca, Huánuco',
      accessType: AccessType.TROCHA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 15, safetyScore: 62, valorizationEstimate: 12,
      services: { agua: false, luz: false, desague: false, internet: false, seguridad: true, areasVerdes: true, parques: true },
      isFeatured: true, isActive: true,
    },
  });

  const condominioGinebra = await prisma.project.create({
    data: {
      name: 'Condominio Ginebra', slug: 'condominio-ginebra', developerId: amadoryrios.id, cityId: pasco.id, zoneId: zOxapampa.id,
      description: 'Propuesta de vida en sintonía con la naturaleza, inspirada en paisajes europeos y la Selva Central. 20 hectáreas, 250 lotes campestres y cabañas (25-75m²). A 13 min del ingreso de Oxapampa. Lotes desde S/20,990, cabañas desde S/48,990.',
      minPrice: 20990, maxPrice: 48990, priceM2Min: 175, priceM2Max: 200,
      lotSizeMin: 120, lotSizeMax: 120, totalLots: 250,
      downPaymentMin: 3000, monthlyPaymentEst: 990, termMonthsEst: 36,
      lat: -10.578, lng: -75.398, addressText: 'Oxapampa, Sector Santa Cruz - a 13 min del ingreso',
      accessType: AccessType.PISTA_ASFALTADA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 5, safetyScore: 70, valorizationEstimate: 10,
      services: { agua: true, luz: true, desague: false, internet: false, cabanas: true, areasVerdes: true },
      isFeatured: true, isActive: true,
    },
  });

  const condominioAntioquia = await prisma.project.create({
    data: {
      name: 'Condominio Antioquia', slug: 'condominio-antioquia', developerId: amadoryrios.id, cityId: loreto.id, zoneId: zIquitos.id,
      description: 'Conecta lo moderno con lo natural. 38 hectáreas, 168 lotes campestres en la Amazonía. A 40 min del aeropuerto de Iquitos, carretera Iquitos-Nauta Km 49. Contado desde S/30,000, cuotas desde S/1,400/mes.',
      minPrice: 30000, maxPrice: 80000, priceM2Min: 100, priceM2Max: 160,
      lotSizeMin: 300, lotSizeMax: 500, totalLots: 168,
      downPaymentMin: 5000, monthlyPaymentEst: 1400, termMonthsEst: 36,
      lat: -4.0, lng: -73.45, addressText: 'Carretera Iquitos-Nauta Km 49, Loreto',
      accessType: AccessType.PISTA_ASFALTADA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 49, safetyScore: 65, valorizationEstimate: 15,
      services: { agua: true, luz: true, desague: false, internet: false, lagunas: true, senderos: true, seguridad: true },
      isFeatured: true, isActive: true,
    },
  });

  // --- ZOOMA ---
  const zante = await prisma.project.create({
    data: {
      name: 'Zante - Lotes en La Libertad', slug: 'zante-la-libertad', developerId: zooma.id, cityId: laLibertad.id, zoneId: zGuadalupito.id,
      description: 'Frente al mar, frente a tu futuro. Terrenos con acceso al Pacífico en Guadalupito. Entre Trujillo y Chimbote, zona agroindustrial y turística. Pórtico de ingreso, agua y luz. Preventa desde 500m².',
      minPrice: 35000, maxPrice: 95000, priceM2Min: 70, priceM2Max: 190,
      lotSizeMin: 500, lotSizeMax: 1000, totalLots: 200,
      downPaymentMin: 5000, monthlyPaymentEst: 1200, termMonthsEst: 48,
      lat: -8.883, lng: -78.617, addressText: 'Guadalupito, La Libertad',
      accessType: AccessType.PISTA_ASFALTADA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 35, safetyScore: 68, valorizationEstimate: 14,
      services: { agua: true, luz: true, desague: false, internet: false, frenteAlMar: true, zonaRecreativa: true, portico: true },
      isFeatured: true, isActive: true,
    },
  });

  // --- GRUPO ROBLES ---
  const fundoLosPinos = await prisma.project.create({
    data: {
      name: 'Fundo Los Pinos', slug: 'fundo-los-pinos', developerId: gruporobles.id, cityId: pasco.id, zoneId: zOxapampa.id,
      description: 'Lotes exclusivos en Huancabamba, Oxapampa. Biodiversidad y clima privilegiado. Cerca de Catarata Ananá, Ruinas de Punchao y aeropuerto. Zona con proyección turística. Separación desde S/5,000.',
      minPrice: 25000, maxPrice: 75000, priceM2Min: 50, priceM2Max: 120,
      lotSizeMin: 500, lotSizeMax: 1000, totalLots: 150,
      downPaymentMin: 5000, monthlyPaymentEst: 900, termMonthsEst: 36,
      lat: -10.443, lng: -75.431, addressText: 'Huancabamba, Oxapampa, Pasco',
      accessType: AccessType.TROCHA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 20, safetyScore: 60, valorizationEstimate: 18,
      services: { agua: false, luz: true, desague: false, internet: false, ecoamigable: true, turismo: true, cabanas: true },
      isFeatured: false, isActive: true,
    },
  });

  const valleOrquidea = await prisma.project.create({
    data: {
      name: 'Valle Orquídea', slug: 'valle-orquidea', developerId: gruporobles.id, cityId: junin.id, zoneId: zChanchamayo.id,
      description: 'Chanchamayo, Junín: "Capital Cafetalera del Perú". Parcela 87, Pampa Whaley, a 1 hora de La Merced. Condominio ecoamigable con lotes y cabañas. Separación desde S/5,000. En construcción.',
      minPrice: 20000, maxPrice: 65000, priceM2Min: 40, priceM2Max: 100,
      lotSizeMin: 500, lotSizeMax: 1000, totalLots: 120,
      downPaymentMin: 5000, monthlyPaymentEst: 800, termMonthsEst: 36,
      lat: -11.05, lng: -75.317, addressText: 'Parcela 87, Pampa Whaley, Chanchamayo, Junín',
      accessType: AccessType.TROCHA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 60, safetyScore: 58, valorizationEstimate: 16,
      services: { agua: false, luz: true, desague: false, internet: false, ecoamigable: true, cafe: true, cabanas: true },
      isFeatured: false, isActive: true,
    },
  });

  const golfPoseidon = await prisma.project.create({
    data: {
      name: 'El Golf de Poseidón', slug: 'el-golf-de-poseidon', developerId: gruporobles.id, cityId: laLibertad.id, zoneId: zGuadalupito.id,
      description: 'Despierta con el sonido de las olas. Guadalupito, La Libertad, a 35 min de Chimbote. Proyecto exclusivo frente al mar con crecimiento inmobiliario. Separación desde S/5,000.',
      minPrice: 30000, maxPrice: 85000, priceM2Min: 60, priceM2Max: 130,
      lotSizeMin: 500, lotSizeMax: 1000, totalLots: 180,
      downPaymentMin: 5000, monthlyPaymentEst: 1000, termMonthsEst: 36,
      lat: -8.875, lng: -78.625, addressText: 'Guadalupito, La Libertad',
      accessType: AccessType.PISTA_ASFALTADA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 35, safetyScore: 65, valorizationEstimate: 14,
      services: { agua: true, luz: true, desague: false, internet: false, frenteAlMar: true, ecoamigable: true, playa: true },
      isFeatured: true, isActive: true,
    },
  });

  // --- ECOPLAZA ---
  const ecoplazaChincha = await prisma.project.create({
    data: {
      name: 'Eco Plaza Chincha', slug: 'eco-plaza-chincha', developerId: ecoplaza.id, cityId: ica.id, zoneId: zChincha.id,
      description: 'Mercado comercial en preventa, Chincha Alta, Ica. Puestos de 6m² y 12m² en zona de alto tráfico. Ideal para emprendedores e inversionistas.',
      minPrice: 15000, maxPrice: 45000, priceM2Min: 2500, priceM2Max: 3750,
      lotSizeMin: 4, lotSizeMax: 12, totalLots: 200,
      downPaymentMin: 3000, monthlyPaymentEst: 500, termMonthsEst: 36,
      lat: -13.461, lng: -76.133, addressText: 'Prol. Calle San Carlos, Chincha Alta, Ica',
      accessType: AccessType.PISTA_ASFALTADA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 1, safetyScore: 80, valorizationEstimate: 10,
      services: { agua: true, luz: true, desague: true, internet: true, centroComercial: true, estacionamiento: true },
      isFeatured: false, isActive: true,
    },
  });

  const ecoplazaSantaClara = await prisma.project.create({
    data: {
      name: 'Eco Plaza Boulevard Santa Clara', slug: 'eco-plaza-santa-clara', developerId: ecoplaza.id, cityId: lima.id, zoneId: zAte.id,
      description: 'Mercado Boulevard en preventa, Av. Independencia 501, Santa Clara, Ate. Puestos de 4m² y 6m² en zona de alto tránsito. Ideal para negocios.',
      minPrice: 20000, maxPrice: 60000, priceM2Min: 5000, priceM2Max: 10000,
      lotSizeMin: 4, lotSizeMax: 6, totalLots: 300,
      downPaymentMin: 4000, monthlyPaymentEst: 600, termMonthsEst: 36,
      lat: -12.025, lng: -76.9, addressText: 'Av. Independencia 501, Santa Clara, Ate, Lima',
      accessType: AccessType.PISTA_ASFALTADA, legalStatus: LegalStatus.EN_TRAMITE,
      distanceToCityCenterKm: 15, safetyScore: 78, valorizationEstimate: 8,
      services: { agua: true, luz: true, desague: true, internet: true, centroComercial: true, altoTransito: true },
      isFeatured: false, isActive: true,
    },
  });

  const allProjects = [ciudadPrada, condominioGinebra, condominioAntioquia, zante, fundoLosPinos, valleOrquidea, golfPoseidon, ecoplazaChincha, ecoplazaSantaClara];

  // =========== IMAGES ===========
  console.log('  Creating images...');
  for (const p of allProjects) {
    await prisma.projectImage.createMany({
      data: [
        { projectId: p.id, url: `/images/projects/${p.slug}/main.jpg`, alt: p.name, isPrimary: true, order: 0 },
        { projectId: p.id, url: `/images/projects/${p.slug}/gallery-1.jpg`, alt: `${p.name} - Vista 2`, isPrimary: false, order: 1 },
        { projectId: p.id, url: `/images/projects/${p.slug}/gallery-2.jpg`, alt: `${p.name} - Vista 3`, isPrimary: false, order: 2 },
      ],
    });
  }

  // =========== LOTS ===========
  console.log('  Creating lots...');
  const lotProjects = [ciudadPrada, condominioGinebra, condominioAntioquia, zante, fundoLosPinos, valleOrquidea, golfPoseidon];
  for (const p of lotProjects) {
    for (let i = 1; i <= 5; i++) {
      const sz = p.lotSizeMin! + Math.floor((p.lotSizeMax! - p.lotSizeMin!) * (i / 5));
      const pm2 = p.priceM2Min! + Math.floor((p.priceM2Max! - p.priceM2Min!) * Math.random());
      await prisma.lot.create({
        data: {
          projectId: p.id,
          code: `${p.slug.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
          block: `Mz. ${String.fromCharCode(65 + Math.floor(i / 5))}`,
          area: sz, price: sz * pm2, priceM2: pm2,
          status: i <= 3 ? LotStatus.DISPONIBLE : (i === 4 ? LotStatus.RESERVADO : LotStatus.VENDIDO),
        },
      });
    }
  }

  // =========== LEADS ===========
  console.log('  Creating leads...');
  const names = [
    { name: 'Carlos Mendoza', phone: '987654321', email: 'carlos.m@gmail.com' },
    { name: 'María López', phone: '912345678', email: 'maria.lopez@hotmail.com' },
    { name: 'Jorge Ramírez', phone: '945678123', email: 'jorge.r@outlook.com' },
    { name: 'Ana Castillo', phone: '978123456', email: 'ana.castillo@gmail.com' },
    { name: 'Roberto Huamán', phone: '934567890', email: 'roberto.h@yahoo.com' },
    { name: 'Lucía Torres', phone: '956789012', email: 'lucia.t@gmail.com' },
    { name: 'Pedro Quispe', phone: '923456789', email: 'pedro.q@hotmail.com' },
    { name: 'Sandra Flores', phone: '967890123', email: 'sandra.f@gmail.com' },
    { name: 'Miguel Sánchez', phone: '945012345', email: 'miguel.s@outlook.com' },
    { name: 'Patricia Vargas', phone: '989012345', email: 'patricia.v@gmail.com' },
  ];
  const sts = [LeadStatus.NUEVO, LeadStatus.CONTACTADO, LeadStatus.CALIFICADO, LeadStatus.VISITA, LeadStatus.CERRADO];
  for (let i = 0; i < 30; i++) {
    const n = names[i % names.length];
    const pr = lotProjects[i % lotProjects.length];
    await prisma.lead.create({
      data: {
        name: n.name, phone: n.phone, email: n.email, projectId: pr.id,
        budget: pr.minPrice + Math.floor(Math.random() * (pr.maxPrice - pr.minPrice)),
        cityInterest: pr.name,
        paymentMethod: i % 2 === 0 ? LeadPaymentMethod.CONTADO : LeadPaymentMethod.CUOTAS,
        timeline: i % 3 === 0 ? LeadTimeline.INMEDIATO : (i % 3 === 1 ? LeadTimeline.TRES_MESES : LeadTimeline.SEIS_MESES),
        source: ['web', 'whatsapp', 'facebook', 'referido'][i % 4],
        utmSource: ['google', 'facebook', 'instagram', 'direct'][i % 4],
        consentGiven: true, status: sts[i % sts.length],
      },
    });
  }

  // =========== REVIEWS ===========
  console.log('  Creating reviews...');
  const rvs = [
    { title: 'Excelente inversión', comment: 'Proyecto bien ubicado, precios accesibles. Recomendado.', rating: 5 },
    { title: 'Buen proyecto', comment: 'Buena ubicación y servicios. La atención fue muy buena.', rating: 4 },
    { title: 'Muy recomendable', comment: 'Fuimos a visitar y nos encantó. Asesoría clara y profesional.', rating: 5 },
    { title: 'Buena opción', comment: 'Precios competitivos. Falta mejorar acceso en lluvias.', rating: 3 },
    { title: 'Gran oportunidad', comment: 'Compré hace 6 meses y ya se valorizó. Muy contento.', rating: 5 },
    { title: 'Buen servicio', comment: 'Equipo de ventas muy atento. Documentos legales en orden.', rating: 4 },
    { title: 'Naturaleza pura', comment: 'Lugar increíble, vegetación y aire fresco. Perfecto.', rating: 5 },
    { title: 'Precio justo', comment: 'Buen precio por lo que ofrecen. Cuotas manejables.', rating: 4 },
  ];
  for (let i = 0; i < 20; i++) {
    const rv = rvs[i % rvs.length];
    const pr = lotProjects[i % lotProjects.length];
    await prisma.review.create({
      data: {
        projectId: pr.id, type: ReviewType.VISITE,
        authorName: names[i % names.length].name, authorEmail: names[i % names.length].email,
        rating: rv.rating, title: rv.title, comment: rv.comment,
        status: ReviewStatus.APROBADO,
      },
    });
  }

  // =========== ROUTING RULES ===========
  console.log('  Creating routing rules...');
  await prisma.routingRule.createMany({
    data: [
      { developerId: amadoryrios.id, type: RoutingType.WHATSAPP, target: '+51981166282', isActive: true },
      { developerId: zooma.id, type: RoutingType.WHATSAPP, target: '+51967385368', isActive: true },
      { developerId: gruporobles.id, type: RoutingType.WHATSAPP, target: '+51947278914', isActive: true },
      { developerId: ecoplaza.id, type: RoutingType.EMAIL, target: 'ventas@ecoplaza.pe', isActive: true },
    ],
  });

  // =========== SEO PAGES ===========
  console.log('  Creating SEO pages...');
  await prisma.seoPage.createMany({
    data: [
      { path: '/terrenos/lima', title: 'Terrenos en Lima 2026', metaDescription: 'Lotes en Lima desde S/45,000.', content: '<h1>Terrenos en Lima</h1><p>Proyectos exclusivos como Eco Plaza Santa Clara.</p>', isActive: true },
      { path: '/terrenos/la-libertad', title: 'Terrenos Frente al Mar en La Libertad', metaDescription: 'Lotes en Guadalupito desde 500m².', content: '<h1>Terrenos en La Libertad</h1><p>Proyectos Zante y Golf de Poseidón frente al mar.</p>', isActive: true },
      { path: '/terrenos/oxapampa', title: 'Lotes Campestres en Oxapampa', metaDescription: 'Lotes desde S/20,990 con cabañas.', content: '<h1>Lotes en Oxapampa</h1><p>Condominio Ginebra y Fundo Los Pinos.</p>', isActive: true },
      { path: '/terrenos/iquitos', title: 'Terrenos en Iquitos', metaDescription: 'Lotes en Iquitos desde S/30,000.', content: '<h1>Terrenos en Iquitos</h1><p>Condominio Antioquia en carretera Iquitos-Nauta.</p>', isActive: true },
      { path: '/terrenos/huanuco', title: 'Lotes en Codo del Pozuzo', metaDescription: 'Ciudad Prada: lotes desde S/33,000.', content: '<h1>Terrenos en Huánuco</h1><p>Ciudad Prada, 1,157 hectáreas en Codo del Pozuzo.</p>', isActive: true },
    ],
  });

  // =========== ANALYTICS ===========
  console.log('  Creating analytics...');
  const evts = ['page_view', 'project_view', 'lead_submit', 'compare_view', 'simulator_use'];
  for (let i = 0; i < 50; i++) {
    const pr = allProjects[i % allProjects.length];
    const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 30));
    await prisma.analyticsEvent.create({
      data: { eventName: evts[i % evts.length], data: { slug: pr.slug, projectId: pr.id }, sessionId: `s-${Math.random().toString(36).substring(7)}`, createdAt: d },
    });
  }

  console.log('\n✅ Seed completado!');
  console.log('\n📊 Resumen:');
  console.log('   Admin: admin@comparalotes.pe / Admin123!');
  console.log('   4 Desarrolladores: Amador y Rios, Zooma, Grupo Robles, Ecoplaza');
  console.log(`   ${allProjects.length} Proyectos reales, 9 Ciudades, 10 Zonas`);
  console.log('   50 Lotes, 30 Leads, 20 Reviews, 50 Analytics');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
