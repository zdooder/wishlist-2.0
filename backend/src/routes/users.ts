import express, { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, adminAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's profile with blocked users
router.get('/profile', auth, (async (req: any, res) => {
  try {
    const blockedUsers = await prisma.userBlock.findMany({
      where: { blockerId: req.user.id },
      include: {
        blockedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      ...req.user,
      blockedUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
}) as RequestHandler);

// Get all users (admin only)
router.get('/', adminAuth, (async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        isActive: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
}) as RequestHandler);

// Approve user (admin only)
router.post('/:id/approve', adminAuth, (async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error approving user' });
  }
}) as RequestHandler);

// Block user
router.post('/block/:email', auth, (async (req: any, res) => {
  try {
    const { email } = req.params;
    const blockerId = req.user.id;

    // Find user by email
    const userToBlock = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToBlock.id === blockerId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    // Check if already blocked
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: userToBlock.id
        }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ message: 'User is already blocked' });
    }

    const block = await prisma.userBlock.create({
      data: {
        blockerId,
        blockedId: userToBlock.id
      }
    });

    res.json(block);
  } catch (error) {
    console.log(`error blocking user: ${error}`);
    res.status(500).json({ message: 'Error blocking user' });
  }
}) as RequestHandler);

// Unblock user
router.delete('/block/:userId', auth, (async (req: any, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    await prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: userId
        }
      }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking user' });
  }
}) as RequestHandler);

// Get blocked users
router.get('/blocked', auth, (async (req: any, res) => {
  try {
    const blockedUsers = await prisma.userBlock.findMany({
      where: { blockerId: req.user.id },
      include: {
        blockedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.json(blockedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blocked users' });
  }
}) as RequestHandler);

// Get count of pending approvals (admin only)
router.get('/pending-count', adminAuth, (async (req, res) => {
  try {
    const count = await prisma.user.count({
      where: { isApproved: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals count' });
  }
}) as RequestHandler);

// Delete user (admin only)
router.delete('/:id', adminAuth, (async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user's blocks first
    await prisma.userBlock.deleteMany({
      where: {
        OR: [
          { blockerId: id },
          { blockedId: id }
        ]
      }
    });

    // Delete user's wishlists and related items
    const wishlists = await prisma.wishlist.findMany({
      where: { userId: id },
      select: { id: true }
    });

    for (const wishlist of wishlists) {
      await prisma.item.deleteMany({
        where: { wishlistId: wishlist.id }
      });
    }

    await prisma.wishlist.deleteMany({
      where: { userId: id }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
}) as RequestHandler);

// Deactivate user (admin only)
router.post('/:id/deactivate', adminAuth, (async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update user to inactive
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        isActive: true
      }
    });

    // Invalidate all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: id }
    });

    res.json(user);
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Error deactivating user' });
  }
}) as RequestHandler);

// Reactivate user (admin only)
router.post('/:id/reactivate', adminAuth, (async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        isActive: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({ message: 'Error reactivating user' });
  }
}) as RequestHandler);

// Toggle admin status (admin only)
router.post('/:id/toggle-admin', adminAuth, (async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user status
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isAdmin: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle admin status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin: !user.isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        isActive: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: 'Error toggling admin status' });
  }
}) as RequestHandler);

export default router; 