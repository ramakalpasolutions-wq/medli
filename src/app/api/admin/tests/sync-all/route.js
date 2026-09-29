import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/tests/sync-all
// Called after super-admin uploads new default tests
export async function POST() {
  const labs = await prisma.lab.findMany({ select: { id: true } });
  const templates = await prisma.testTemplate.findMany({
    where: { isActive: true },
  });

  let totalSynced = 0;

  for (const lab of labs) {
    const existing = await prisma.labTest.findMany({
      where: { labId: lab.id },
      select: { code: true },
    });
    const codeSet = new Set(existing.map(t => t.code));

    for (const tpl of templates) {
      if (!codeSet.has(tpl.code)) {
        await prisma.labTest.create({
          data: {
            labId: lab.id,
            templateId: tpl.id,
            name: tpl.name,
            code: tpl.code,
            category: tpl.category,
            mrp: tpl.mrp,
            isActive: false,
            isCustom: false,
          },
        });
        totalSynced++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Synced ${totalSynced} tests across ${labs.length} labs`,
  });
}