import { PrismaClient, Role, CompetitionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // 2. Seed Flagship Competition
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
            code: 'STREET',
            name: 'Street & Candid Moments',
            description: 'Unposed, authentic decisive moments captured in public urban environments.',
            rubricWeights: {
              composition: 0.15,
              lighting: 0.10,
              colorHarmony: 0.05,
              technicalExecution: 0.05,
              subjectStory: 0.30,
              originality: 0.20,
              emotionAtmosphere: 0.15,
              overallGestalt: 0.00,
            },
          },
          {
            code: 'MONOCHROME',
            name: 'Fine-Art Monochrome',
            description: 'Mastery of light, shadow, zone contrast, and tonal separation in black and white.',
            rubricWeights: {
              composition: 0.20,
              lighting: 0.30,
              colorHarmony: 0.00,
              technicalExecution: 0.15,
              subjectStory: 0.15,
              originality: 0.10,
              emotionAtmosphere: 0.05,
              overallGestalt: 0.05,
            },
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

  // 3. Seed Landscape Contest
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
            code: 'LANDSCAPE',
            name: 'Landscape & Nature',
            description: 'Vistas, mountain peaks, coastal drama, and geological majesty.',
            rubricWeights: {
              composition: 0.25,
              lighting: 0.20,
              colorHarmony: 0.20,
              technicalExecution: 0.15,
              subjectStory: 0.05,
              originality: 0.05,
              emotionAtmosphere: 0.05,
              overallGestalt: 0.05,
            },
          },
          {
            code: 'NIGHT',
            name: 'Night & Astrophotography',
            description: 'Cosmic night skies, milky way alignments, low-noise star fields.',
            rubricWeights: {
              composition: 0.20,
              lighting: 0.25,
              colorHarmony: 0.15,
              technicalExecution: 0.25,
              subjectStory: 0.05,
              originality: 0.05,
              emotionAtmosphere: 0.05,
              overallGestalt: 0.00,
            },
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
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
