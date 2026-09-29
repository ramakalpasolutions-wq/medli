import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/labs/[id]/tests/[testId]/toggle
export async function PATCH(req, { params }) {
  const { id: labId, testId } = params;
  const { isActive } = await req.json();

  const test = await prisma.labTest.update({
    where: { id: testId, labId },
    data: { isActive: !!isActive },
  });

  return NextResponse.json({ success: true, data: test });
}