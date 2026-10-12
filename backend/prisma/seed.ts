import { PrismaClient, Role, CompetitionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { STANDARD_CATEGORIES } from '../src/config/categories.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('PixelPrize2026!', 10);

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pixelprize.org' },
    update: {},
    create: {
      email: 'admin@pixelprize.org',
      username: 'admin',
      name: 'Pixel Prize Admin',
      passwordHash,
      role: Role.ADMIN,
      bio: 'Platform Administrator overseeing computational aesthetics integrity.',
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@pixelprize.org' },
    update: {},
    create: {
      email: 'organizer@pixelprize.org',
      username: 'tokyophoto',
      name: 'Tokyo Photographic Society',
      passwordHash,
      role: Role.ORGANIZER,
      bio: 'International photography society hosting competitive fine-art salon exhibits.',
    },
  });

  const juror = await prisma.user.upsert({
    where: { email: 'juror@pixelprize.org' },
    update: {},
    create: {
      email: 'juror@pixelprize.org',
      username: 'master_juror',
      name: 'Elena Rostova',
      passwordHash,
      role: Role.JUROR,
      bio: 'Magnum Photos fellow and international documentary juror.',
    },
  });

  const participant = await prisma.user.upsert({
    where: { email: 'photographer@pixelprize.org' },
    update: {},
    create: {
      email: 'photographer@pixelprize.org',
      username: 'kenji_lens',
      name: 'Kenji Sato',
      passwordHash,
      role: Role.PARTICIPANT,
      bio: 'Street & architectural photographer based in Shibuya, Tokyo.',
    },
  });

  console.log('✅ Seeded users:', {
    admin: admin.email,
    organizer: organizer.email,
    juror: juror.email,
    participant: participant.email,
  });

  // 2. Seed Flagship Competition: Urban Monochromes
  const competition = await prisma.competition.upsert({
    where: { slug: 'urban-monochromes-2026' },
    update: {},
    create: {
      title: 'Urban Monochromes: Street Life in B&W',
      slug: 'urban-monochromes-2026',
      description: 'Celebrating high-contrast black and white street scenes, authentic human moments, and tonal dynamic range.',
      bannerUrl: 'https://media.pixelprize.org/banners/urban-mono.webp',
      status: CompetitionStatus.OPEN,
      submissionStartDate: new Date('2026-10-01T00:00:00Z'),
      submissionEndDate: new Date('2026-11-30T23:59:59Z'),
      resultsPublishDate: new Date('2026-12-05T18:00:00Z'),
      maxEntriesPerUser: 2,
      requireExif: true,
      prizeSummary: '$2,500 Cash Purse + Leica Feature',
      organizerId: organizer.id,
      categories: {
        create: [
          {
            code: STANDARD_CATEGORIES.STREET.code,
            name: STANDARD_CATEGORIES.STREET.name,
            description: STANDARD_CATEGORIES.STREET.description,
            rubricWeights: STANDARD_CATEGORIES.STREET.rubricWeights,
          },
          {
            code: STANDARD_CATEGORIES.MONOCHROME.code,
            name: STANDARD_CATEGORIES.MONOCHROME.name,
            description: STANDARD_CATEGORIES.MONOCHROME.description,
            rubricWeights: STANDARD_CATEGORIES.MONOCHROME.rubricWeights,
          },
          {
            code: STANDARD_CATEGORIES.ARCHITECTURE.code,
            name: STANDARD_CATEGORIES.ARCHITECTURE.name,
            description: STANDARD_CATEGORIES.ARCHITECTURE.description,
            rubricWeights: STANDARD_CATEGORIES.ARCHITECTURE.rubricWeights,
          },
        ],
      },
      jurorAssignments: {
        create: [
          {
            jurorId: juror.id,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded competition:', competition.title);

  // 3. Seed Landscape & Wilderness Contest
  const landscapeComp = await prisma.competition.upsert({
    where: { slug: 'untamed-horizons-2026' },
    update: {},
    create: {
      title: 'Untamed Horizons: Global Landscapes',
      slug: 'untamed-horizons-2026',
      description: 'Expansive vistas, geological drama, natural atmospheric lighting, and pristine wilderness.',
      bannerUrl: 'https://media.pixelprize.org/banners/landscape.webp',
      status: CompetitionStatus.OPEN,
      submissionStartDate: new Date('2026-10-10T00:00:00Z'),
      submissionEndDate: new Date('2026-12-15T23:59:59Z'),
      resultsPublishDate: new Date('2026-12-20T18:00:00Z'),
      maxEntriesPerUser: 3,
      requireExif: true,
      prizeSummary: '$5,000 Grand Prize + National Geographic Showcase',
      organizerId: organizer.id,
      categories: {
        create: [
          {
            code: STANDARD_CATEGORIES.LANDSCAPE.code,
            name: STANDARD_CATEGORIES.LANDSCAPE.name,
            description: STANDARD_CATEGORIES.LANDSCAPE.description,
            rubricWeights: STANDARD_CATEGORIES.LANDSCAPE.rubricWeights,
          },
          {
            code: STANDARD_CATEGORIES.NIGHT.code,
            name: STANDARD_CATEGORIES.NIGHT.name,
            description: STANDARD_CATEGORIES.NIGHT.description,
            rubricWeights: STANDARD_CATEGORIES.NIGHT.rubricWeights,
          },
          {
            code: STANDARD_CATEGORIES.WILDLIFE.code,
            name: STANDARD_CATEGORIES.WILDLIFE.name,
            description: STANDARD_CATEGORIES.WILDLIFE.description,
            rubricWeights: STANDARD_CATEGORIES.WILDLIFE.rubricWeights,
          },
        ],
      },
      jurorAssignments: {
        create: [
          {
            jurorId: juror.id,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded competition:', landscapeComp.title);

  // 4. Seed Masters Salon: General, Portrait & Macro
  const mastersComp = await prisma.competition.upsert({
    where: { slug: 'grand-masters-salon-2026' },
    update: {},
    create: {
      title: 'Grand Masters Salon: Human & Optical Form',
      slug: 'grand-masters-salon-2026',
      description: 'Celebrating high-fidelity human portraits, macro optics, and open creative aesthetic mastery.',
      bannerUrl: 'https://media.pixelprize.org/banners/masters.webp',
      status: CompetitionStatus.OPEN,
      submissionStartDate: new Date('2026-10-15T00:00:00Z'),
      submissionEndDate: new Date('2026-12-31T23:59:59Z'),
      resultsPublishDate: new Date('2027-01-10T18:00:00Z'),
      maxEntriesPerUser: 4,
      requireExif: true,
      prizeSummary: '$10,000 Hasselblad Fellowship',
      organizerId: organizer.id,
      categories: {
        create: [
          {
            code: STANDARD_CATEGORIES.GENERAL.code,
            name: STANDARD_CATEGORIES.GENERAL.name,
            description: STANDARD_CATEGORIES.GENERAL.description,
            rubricWeights: STANDARD_CATEGORIES.GENERAL.rubricWeights,
          },
          {
            code: STANDARD_CATEGORIES.PORTRAIT.code,
            name: STANDARD_CATEGORIES.PORTRAIT.name,
            description: STANDARD_CATEGORIES.PORTRAIT.description,
            rubricWeights: STANDARD_CATEGORIES.PORTRAIT.rubricWeights,
          },
          {
            code: STANDARD_CATEGORIES.MACRO.code,
            name: STANDARD_CATEGORIES.MACRO.name,
            description: STANDARD_CATEGORIES.MACRO.description,
            rubricWeights: STANDARD_CATEGORIES.MACRO.rubricWeights,
          },
        ],
      },
      jurorAssignments: {
        create: [
          {
            jurorId: juror.id,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded competition:', mastersComp.title);
  console.log('🎉 Seeding completed successfully! All 9 TAD66K categories populated.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
