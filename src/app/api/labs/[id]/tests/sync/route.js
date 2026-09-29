import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/labs/[id]/tests/sync
// Pulls any new TestTemplates that the lab doesn't have yet
export async function POST(req, { params }) {
  const { id: labId } = params;

  // Find templates the lab doesn't have yet
  const existingCodes = await prisma.labTest.findMany({
    where: { labId },
    select: { code: true },
  });
  const existingCodeSet = new Set(existingCodes.map(t => t.code));

  const allTemplates = await prisma.testTemplate.findMany({
    where: { isActive: true },
  });

  const newTemplates = allTemplates.filter(t => !existingCodeSet.has(t.code));

  let created = 0;
  for (const tpl of newTemplates) {
    await prisma.labTest.create({
      data: {
        labId,
        templateId: tpl.id,
        name: tpl.name,
        code: tpl.code,
        category: tpl.category,
        mrp: tpl.mrp,
        isActive: false, // Lab decides
        isCustom: false,
      },
    });
    created++;
  }

  return NextResponse.json({
    success: true,
    message: `Synced ${created} new default tests`,
  });
}