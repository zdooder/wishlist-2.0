import express, { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { processImageUrl } from '../utils/imageUtils';
import { auth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Add item to wishlist
router.post('/', auth, (async (req: any, res) => {
  try {
    const { name, description, price, url, imageUrl, imageData, wishlistId } = req.body;

    // Check if user owns the wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { id: wishlistId }
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    if (wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Process image URL if provided
    let finalImageData = imageData;
    if (imageUrl && !imageData) {
      finalImageData = await processImageUrl(imageUrl);
      if (!finalImageData) {
        return res.status(400).json({ message: 'Failed to process image URL' });
      }
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        price,
        url,
        imageData: finalImageData,
        wishlistId
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.log(`error creating item: ${error}`);
    res.status(500).json({ message: 'Error creating item' });
  }
}) as RequestHandler);

// Update item
router.put('/:id', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, url, imageUrl, imageData } = req.body;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { 
        wishlist: true,
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is either the wishlist owner or the item owner (reservedBy)
    if (item.wishlist.userId !== req.user.id && item.reservedById !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Process image URL if provided
    let finalImageData = imageData;
    if (imageUrl && !imageData) {
      finalImageData = await processImageUrl(imageUrl);
      if (!finalImageData) {
        return res.status(400).json({ message: 'Failed to process image URL' });
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: { name, description, price, url, imageData: finalImageData },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.log(`error updating item: ${error}`);
    res.status(500).json({ message: 'Error updating item' });
  }
}) as RequestHandler);

// Delete item
router.delete('/:id', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { wishlist: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.wishlist.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.item.delete({
      where: { id }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.log(`error deleting item: ${error}`);
    res.status(500).json({ message: 'Error deleting item' });
  }
}) as RequestHandler);

// Add comment to item
router.post('/:id/comments', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        itemId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.log(`error adding comment: ${error}`);
    res.status(500).json({ message: 'Error adding comment' });
  }
}) as RequestHandler);

// Reserve item
router.post('/:id/reserve', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if item is already reserved
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reservedById) {
      return res.status(400).json({ message: 'Item is already reserved' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        reservedById: req.user.id
      },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.log(`error reserving item: ${error}`);
    res.status(500).json({ message: 'Error reserving item' });
  }
}) as RequestHandler);

// Mark item as purchased
router.put('/:id/purchase', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.isPurchased) {
      return res.status(400).json({ message: 'Item is already purchased' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        isPurchased: true,
        reservedById: req.user.id
      },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.log(`error marking item as purchased: ${error}`);
    res.status(500).json({ message: 'Error marking item as purchased' });
  }
}) as RequestHandler);

// Clear item reservation
router.delete('/:id/reserve', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.reservedById) {
      return res.status(400).json({ message: 'Item is not reserved' });
    }

    if (item.reservedById !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        reservedById: null
      },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.log(`error clearing reservation: ${error}`);
    res.status(500).json({ message: 'Error clearing reservation' });
  }
}) as RequestHandler);

// Clear purchased status
router.delete('/:id/purchase', auth, (async (req: any, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.isPurchased) {
      return res.status(400).json({ message: 'Item is not purchased' });
    }

    if (item.reservedById !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        isPurchased: false
      },
      include: {
        reservedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.log(`error clearing purchase status: ${error}`);
    res.status(500).json({ message: 'Error clearing purchase status' });
  }
}) as RequestHandler);

// Update comment
router.put('/:itemId/comments/:commentId', auth, (async (req: any, res) => {
  try {
    const { itemId, commentId } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedComment);
  } catch (error) {
    console.log(`error updating comment: ${error}`);
    res.status(500).json({ message: 'Error updating comment' });
  }
}) as RequestHandler);

// Delete comment
router.delete('/:itemId/comments/:commentId', auth, (async (req: any, res) => {
  try {
    const { itemId, commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.log(`error deleting comment: ${error}`);
    res.status(500).json({ message: 'Error deleting comment' });
  }
}) as RequestHandler);

export default router; 