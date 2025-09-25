import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { shikonas } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/shikonas - Get all shikonas
router.get('/', async (req: Request, res: Response) => {
  try {
    const allShikonas = await db.select().from(shikonas);
    res.json(allShikonas);
  } catch (error) {
    console.error('Error fetching shikonas:', error);
    res.status(500).json({ error: 'Failed to fetch shikonas' });
  }
});

// GET /api/shikonas/:id - Get shikona by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(shikonas).where(eq(shikonas.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Shikona not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching shikona:', error);
    res.status(500).json({ error: 'Failed to fetch shikona' });
  }
});

// POST /api/shikonas - Create new shikona
router.post('/', async (req: Request, res: Response) => {
  try {
    const shikona = req.body;
    const result = await db.insert(shikonas).values(shikona).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating shikona:', error);
    res.status(500).json({ error: 'Failed to create shikona' });
  }
});

// POST /api/shikonas/bulk - Bulk create shikonas
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { shikonas: shikonaList } = req.body;

    if (!Array.isArray(shikonaList) || shikonaList.length === 0) {
      return res.status(400).json({ error: 'Invalid shikonas data' });
    }

    const result = await db.insert(shikonas).values(shikonaList).returning();
    res.status(201).json({
      message: `Successfully created ${result.length} shikonas`,
      created: result.length,
      shikonas: result
    });
  } catch (error) {
    console.error('Error bulk creating shikonas:', error);
    res.status(500).json({ error: 'Failed to bulk create shikonas' });
  }
});

// PUT /api/shikonas/:id - Update shikona
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.update(shikonas)
      .set(updateData)
      .where(eq(shikonas.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Shikona not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating shikona:', error);
    res.status(500).json({ error: 'Failed to update shikona' });
  }
});

// DELETE /api/shikonas/:id - Delete shikona
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(shikonas).where(eq(shikonas.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Shikona not found' });
    }

    res.json({ message: 'Shikona deleted successfully' });
  } catch (error) {
    console.error('Error deleting shikona:', error);
    res.status(500).json({ error: 'Failed to delete shikona' });
  }
});

export default router;