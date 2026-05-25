import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Genders ────────────────────────────────────────────────
  const male = await prisma.gender.upsert({
    where: { code: 'M' },
    update: {},
    create: { code: 'M', namePt: 'Masculino', nameEn: 'Male', nameFr: 'Masculin', nameEs: 'Masculino', nameDe: 'Männlich', nameIt: 'Maschile' },
  });
  const female = await prisma.gender.upsert({
    where: { code: 'F' },
    update: {},
    create: { code: 'F', namePt: 'Feminino', nameEn: 'Female', nameFr: 'Féminin', nameEs: 'Femenino', nameDe: 'Weiblich', nameIt: 'Femminile' },
  });
  console.log('✅ Genders seeded');

  // ── Grades ─────────────────────────────────────────────────
  const gradesData = [
    { namePt: 'Pré-Mini', nameEn: 'Pre-Mini', minAge: 5, maxAge: 6, avgCombatDuration: 3, displayOrder: 1 },
    { namePt: 'Mini', nameEn: 'Mini', minAge: 7, maxAge: 8, avgCombatDuration: 3, displayOrder: 2 },
    { namePt: 'Benjamin', nameEn: 'Benjamin', minAge: 9, maxAge: 10, avgCombatDuration: 4, displayOrder: 3 },
    { namePt: 'Infantil', nameEn: 'Junior', minAge: 11, maxAge: 12, avgCombatDuration: 4, displayOrder: 4 },
    { namePt: 'Cadete', nameEn: 'Cadet', minAge: 13, maxAge: 14, avgCombatDuration: 5, displayOrder: 5 },
    { namePt: 'Pré-Junior', nameEn: 'Pre-Junior', minAge: 15, maxAge: 17, avgCombatDuration: 6, displayOrder: 6 },
    { namePt: 'Júnior', nameEn: 'Junior U21', minAge: 15, maxAge: 17, avgCombatDuration: 6, displayOrder: 7 },
    { namePt: 'Sénior', nameEn: 'Senior', minAge: 18, maxAge: null, avgCombatDuration: 8, displayOrder: 8 },
    { namePt: 'Master', nameEn: 'Master', minAge: 35, maxAge: null, avgCombatDuration: 6, displayOrder: 9 },
  ];

  const grades: Record<string, { id: string }> = {};
  for (const g of gradesData) {
    const grade = await prisma.grade.upsert({
      where: { id: g.namePt },
      update: {},
      create: { id: g.namePt, ...g },
    });
    grades[g.namePt] = grade;
  }
  console.log('✅ Grades seeded');

  // ── Weight Categories ──────────────────────────────────────
  // Format: [symbol, weightValue, strWeight, displayPt, displayEn, vestType]
  const weightData: {
    gradeKey: string;
    genderCode: string;
    weights: [string, number, string, string, string, number][];
  }[] = [
    // BENJAMIN Masculino
    {
      gradeKey: 'Benjamin', genderCode: 'M',
      weights: [
        ['-', 22, '-22', 'Menos de 22 Kg', 'Under 22 Kg', 1],
        ['', 24, '22-24', '22-24 Kg', '22-24 Kg', 1],
        ['', 27, '24-27', '24-27 Kg', '24-27 Kg', 2],
        ['', 30, '27-30', '27-30 Kg', '27-30 Kg', 2],
        ['', 33, '30-33', '30-33 Kg', '30-33 Kg', 3],
        ['', 37, '33-37', '33-37 Kg', '33-37 Kg', 3],
        ['', 41, '37-41', '37-41 Kg', '37-41 Kg', 4],
        ['+', 41, '+41', 'Mais de 41 Kg', 'Over 41 Kg', 4],
      ],
    },
    // BENJAMIN Feminino
    {
      gradeKey: 'Benjamin', genderCode: 'F',
      weights: [
        ['-', 20, '-20', 'Menos de 20 Kg', 'Under 20 Kg', 1],
        ['', 22, '20-22', '20-22 Kg', '20-22 Kg', 1],
        ['', 24, '22-24', '22-24 Kg', '22-24 Kg', 2],
        ['', 27, '24-27', '24-27 Kg', '24-27 Kg', 2],
        ['', 30, '27-30', '27-30 Kg', '27-30 Kg', 3],
        ['', 33, '30-33', '30-33 Kg', '30-33 Kg', 3],
        ['', 37, '33-37', '33-37 Kg', '33-37 Kg', 4],
        ['+', 37, '+37', 'Mais de 37 Kg', 'Over 37 Kg', 4],
      ],
    },
    // INFANTIL Masculino
    {
      gradeKey: 'Infantil', genderCode: 'M',
      weights: [
        ['-', 25, '-25', 'Menos de 25 Kg', 'Under 25 Kg', 1],
        ['', 28, '25-28', '25-28 Kg', '25-28 Kg', 1],
        ['', 32, '28-32', '28-32 Kg', '28-32 Kg', 2],
        ['', 37, '32-37', '32-37 Kg', '32-37 Kg', 2],
        ['', 42, '37-42', '37-42 Kg', '37-42 Kg', 3],
        ['', 47, '42-47', '42-47 Kg', '42-47 Kg', 3],
        ['', 52, '47-52', '47-52 Kg', '47-52 Kg', 4],
        ['+', 52, '+52', 'Mais de 52 Kg', 'Over 52 Kg', 4],
      ],
    },
    // INFANTIL Feminino
    {
      gradeKey: 'Infantil', genderCode: 'F',
      weights: [
        ['-', 23, '-23', 'Menos de 23 Kg', 'Under 23 Kg', 1],
        ['', 26, '23-26', '23-26 Kg', '23-26 Kg', 1],
        ['', 29, '26-29', '26-29 Kg', '26-29 Kg', 2],
        ['', 33, '29-33', '29-33 Kg', '29-33 Kg', 2],
        ['', 37, '33-37', '33-37 Kg', '33-37 Kg', 3],
        ['', 41, '37-41', '37-41 Kg', '37-41 Kg', 3],
        ['', 46, '41-46', '41-46 Kg', '41-46 Kg', 4],
        ['+', 46, '+46', 'Mais de 46 Kg', 'Over 46 Kg', 4],
      ],
    },
    // CADETE Masculino
    {
      gradeKey: 'Cadete', genderCode: 'M',
      weights: [
        ['-', 33, '-33', 'Menos de 33 Kg', 'Under 33 Kg', 1],
        ['', 37, '33-37', '33-37 Kg', '33-37 Kg', 1],
        ['', 41, '37-41', '37-41 Kg', '37-41 Kg', 2],
        ['', 45, '41-45', '41-45 Kg', '41-45 Kg', 2],
        ['', 49, '45-49', '45-49 Kg', '45-49 Kg', 3],
        ['', 53, '49-53', '49-53 Kg', '49-53 Kg', 3],
        ['', 57, '53-57', '53-57 Kg', '53-57 Kg', 4],
        ['', 61, '57-61', '57-61 Kg', '57-61 Kg', 4],
        ['', 65, '61-65', '61-65 Kg', '61-65 Kg', 1],
        ['+', 65, '+65', 'Mais de 65 Kg', 'Over 65 Kg', 1],
      ],
    },
    // CADETE Feminino
    {
      gradeKey: 'Cadete', genderCode: 'F',
      weights: [
        ['-', 29, '-29', 'Menos de 29 Kg', 'Under 29 Kg', 1],
        ['', 33, '29-33', '29-33 Kg', '29-33 Kg', 1],
        ['', 37, '33-37', '33-37 Kg', '33-37 Kg', 2],
        ['', 41, '37-41', '37-41 Kg', '37-41 Kg', 2],
        ['', 44, '41-44', '41-44 Kg', '41-44 Kg', 3],
        ['', 47, '44-47', '44-47 Kg', '44-47 Kg', 3],
        ['', 51, '47-51', '47-51 Kg', '47-51 Kg', 4],
        ['', 55, '51-55', '51-55 Kg', '51-55 Kg', 4],
        ['', 59, '55-59', '55-59 Kg', '55-59 Kg', 1],
        ['+', 59, '+59', 'Mais de 59 Kg', 'Over 59 Kg', 1],
      ],
    },
    // SÉNIOR Masculino (WT official)
    {
      gradeKey: 'Sénior', genderCode: 'M',
      weights: [
        ['-', 54, '-54', 'Menos de 54 Kg', 'Under 54 Kg', 1],
        ['', 58, '54-58', '54-58 Kg', '54-58 Kg', 1],
        ['', 63, '58-63', '58-63 Kg', '58-63 Kg', 2],
        ['', 68, '63-68', '63-68 Kg', '63-68 Kg', 2],
        ['', 74, '68-74', '68-74 Kg', '68-74 Kg', 3],
        ['', 80, '74-80', '74-80 Kg', '74-80 Kg', 3],
        ['', 87, '80-87', '80-87 Kg', '80-87 Kg', 4],
        ['+', 87, '+87', 'Mais de 87 Kg', 'Over 87 Kg', 4],
      ],
    },
    // SÉNIOR Feminino (WT official)
    {
      gradeKey: 'Sénior', genderCode: 'F',
      weights: [
        ['-', 46, '-46', 'Menos de 46 Kg', 'Under 46 Kg', 1],
        ['', 49, '46-49', '46-49 Kg', '46-49 Kg', 1],
        ['', 53, '49-53', '49-53 Kg', '49-53 Kg', 2],
        ['', 57, '53-57', '53-57 Kg', '53-57 Kg', 2],
        ['', 62, '57-62', '57-62 Kg', '57-62 Kg', 3],
        ['', 67, '62-67', '62-67 Kg', '62-67 Kg', 3],
        ['', 73, '67-73', '67-73 Kg', '67-73 Kg', 4],
        ['+', 73, '+73', 'Mais de 73 Kg', 'Over 73 Kg', 4],
      ],
    },
  ];

  let weightCount = 0;
  for (const { gradeKey, genderCode, weights } of weightData) {
    const grade = grades[gradeKey];
    const gender = genderCode === 'M' ? male : female;
    if (!grade) continue;

    for (let i = 0; i < weights.length; i++) {
      const [symbol, weightValue, strWeight, displayPt, displayEn, vestType] = weights[i];
      await prisma.weightCategory.upsert({
        where: { id: `${gradeKey}-${genderCode}-${strWeight}` },
        update: {},
        create: {
          id: `${gradeKey}-${genderCode}-${strWeight}`,
          gradeId: grade.id,
          genderId: gender.id,
          symbol: symbol as string,
          weightValue,
          strWeight: strWeight as string,
          displayNamePt: displayPt as string,
          displayNameEn: displayEn as string,
          vestType: vestType as number,
          isOfficial: true,
          displayOrder: i + 1,
        },
      });
      weightCount++;
    }
  }
  console.log(`✅ Weight categories seeded (${weightCount} categories)`);

  // ── Platform Settings ──────────────────────────────────────
  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      platformName: 'Taekwombats',
      costPerAthlete: 2.50,
      referralPointsPerReferral: 10,
      referralPointsMinAthletes: 200,
      referralDiscountPct: 10.00,
      pointsOnRegistration: 5,
      platformEmail: 'admin@taekwombats.com',
    },
  });
  console.log('✅ Platform settings seeded');

  // ── Admin User ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@Taekwombats2025!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@taekwombats.com' },
    update: {},
    create: {
      email: 'admin@taekwombats.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Taekwombats',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin user seeded (admin@taekwombats.com)');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
