import { getSession } from '@/lib/auth/server'
import { NextRequest, NextResponse } from 'next/server';
import { wishlistRepo, requesterFromSession } from '@/lib/repo';

// GET - Check if crew or project is in wishlist
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ isWishlisted: false });
    }

    const { searchParams } = new URL(req.url);
    const crewId = searchParams.get('crewId');
    const projectId = searchParams.get('projectId');

    if (!crewId && !projectId) {
      return NextResponse.json(
        { error: 'Either Crew ID or Project ID is required' },
        { status: 400 }
      );
    }

    const requester = requesterFromSession(session);
    let wishlist = null;

    // Check for crew wishlist
    if (crewId) {
      wishlist = await wishlistRepo.findCrewWishlist(session.user.id, crewId, requester);
    }

    // Check for project wishlist
    if (projectId) {
      wishlist = await wishlistRepo.findProjectWishlist(session.user.id, projectId, requester);
    }

    return NextResponse.json({ isWishlisted: !!wishlist });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    return NextResponse.json(
      { error: 'Failed to check wishlist status' },
      { status: 500 }
    );
  }
}
