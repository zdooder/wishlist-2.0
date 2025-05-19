import express, { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create wishlist
router.post('/', auth, (async (req: any, res) => {
  try {
    const { name, description } = req.body;
    const wishlist = await prisma.wishlist.create({
      data: {
        name,
        description,
        userId: req.user.id
      }
    });
    res.status(201).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error creating wishlist' });
  }
}) as RequestHandler);

// Get user's wishlists
router.get('/my-wishlists', auth, (async (req: any, res) => {
  try {
    const wishlists = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        items: true
      }
    });
    res.json(wishlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlists' });
  }
}) as RequestHandler);

// Get all wishlists (excluding blocked users and inactive users)
router.get('/', auth, (async (req: any, res) => {
  try {
    // Get blocked users
    const blockedUsers = await prisma.userBlock.findMany({
      where: { blockerId: req.user.id },
      select: { blockedId: true }
    });

    const blockedIds = blockedUsers.map((block: { blockedId: string }) => block.blockedId);

    // Get wishlists excluding blocked users and inactive users
    const wishlists = await prisma.wishlist.findMany({
      where: {
        userId: {
          notIn: blockedIds
        },
        user: {
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        },
        items: true
      }
    });

    res.json(wishlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlists' });
  }
}) as RequestHandler);

// Get wishlist by ID
router.get('/:id', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if user is blocked
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: req.user.id, blockedId: { equals: id } },
          { blockerId: { equals: id }, blockedId: req.user.id }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            reservedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
}) as RequestHandler);

// Update wishlist
router.put('/:id', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id }
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    if (wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedWishlist = await prisma.wishlist.update({
      where: { id },
      data: { name, description }
    });

    res.json(updatedWishlist);
  } catch (error) {
    console.log(`error updating wishlist: ${error}`);
    res.status(500).json({ message: 'Error updating wishlist' });
  }
}) as RequestHandler);

// Delete wishlist
router.delete('/:id', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id }
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    if (wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.wishlist.delete({
      where: { id }
    });

    res.json({ message: 'Wishlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting wishlist' });
  }
}) as RequestHandler);

export default router; 