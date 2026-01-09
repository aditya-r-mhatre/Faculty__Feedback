import connectDB from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Student from '@/models/Student';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { deptId } = body || {};

    const baseQuery: any = {};
    if (deptId) baseQuery.dept = deptId;

    const result = await Student.updateMany(
    {
        ...baseQuery,
        year: { $in: ['FE', 'SE', 'TE', 'BE'] },
    },
    [
        {
        $set: {
            year: {
            $switch: {
                branches: [
                { case: { $eq: ['$year', 'FE'] }, then: 'SE' },
                { case: { $eq: ['$year', 'SE'] }, then: 'TE' },
                { case: { $eq: ['$year', 'TE'] }, then: 'BE' },
                { case: { $eq: ['$year', 'BE'] }, then: 'BE' }, // BE stays BE
                ],
                default: '$year',
            },
            },
        },
        },
    ],
    { updatePipeline: true }
    );


    return NextResponse.json({
      message: 'Promotion completed',
      modified: result.modifiedCount,
    });
  } catch (err: any) {
    console.error('Promotion error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
