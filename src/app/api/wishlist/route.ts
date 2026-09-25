import { getSession } from '@/lib/auth/server'
import { NextRequest, NextResponse } from 'next/server';
import { wishlistRepo, projectRepo, crewProfileRepo, requesterFromSession } from '@/lib/repo';

// GET - Fetch user's wishlist
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requester = requesterFromSession(session);
    const wishlists = await wishlistRepo.findManyByUserId(session.user.id, requester);

    return NextResponse.json({ wishlists });
  } catch (error) {
    console.error('[WISHLIST GET] Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST - Add crew or project to wishlist
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { crewId, projectId } = await req.json();

    // Validate that either crewId or projectId is provided
    if (!crewId && !projectId) {
      return NextResponse.json(
        { error: 'Either Crew ID or Project ID is required' },
        { status: 400 }
      );
    }

    const requester = requesterFromSession(session);

    // Handle crew wishlist (for employers)
    if (crewId) {
      // Check if crew exists
      const crew = await crewProfileRepo.findById(crewId);

      if (!crew) {
        return NextResponse.json(
          { error: 'Crew not found' },
          { status: 404 }
        );
      }

      // Check if already wishlisted
      const existing = await wishlistRepo.findCrewWishlist(session.user.id, crewId, requester);

      if (existing) {
        return NextResponse.json(
          { error: 'Already in wishlist' },
          { status: 400 }
        );
      }

      // Add to wishlist
      const wishlist = await wishlistRepo.add(session.user.id, { crewId }, requester);

      return NextResponse.json({ 
        message: 'Added to wishlist',
        wishlist 
      }, { status: 201 });
    }

    // Handle project wishlist (for crew)
    if (projectId) {
      // Check if project exists
      const project = await projectRepo.findById(projectId);

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Check if already wishlisted
      const existing = await wishlistRepo.findProjectWishlist(session.user.id, projectId, requester);

      if (existing) {
        return NextResponse.json(
          { error: 'Already in wishlist' },
          { status: 400 }
        );
      }

      // Add to wishlist
      const wishlist = await wishlistRepo.add(session.user.id, { projectId }, requester);

      return NextResponse.json({ 
        message: 'Added to wishlist',
        wishlist 
      }, { status: 201 });
    }
  } catch (error) {
    console.error('[WISHLIST POST] Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove crew or project from wishlist
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Delete from wishlist
    const requester = requesterFromSession(session);
    const whereClause: any = {
      userId: session.user.id,
    };

    if (crewId) {
      whereClause.crewId = crewId;
    }
    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (crewId) {
      await wishlistRepo.removeCrew(session.user.id, crewId, requester);
    }
    if (projectId) {
      await wishlistRepo.removeProject(session.user.id, projectId, requester);
    }

    return NextResponse.json({ 
      message: 'Removed from wishlist' 
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
