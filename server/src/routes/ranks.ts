import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { ranks } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/ranks - Get all ranks
router.get('/', async (req: Request, res: Response) => {
  try {
    const allRanks = await db.select().from(ranks);
    res.json(allRanks);
  } catch (error) {
    console.error('Error fetching ranks:', error);
    res.status(500).json({ error: 'Failed to fetch ranks' });
  }
});

// GET /api/ranks/:id - Get rank by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(ranks).where(eq(ranks.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Rank not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

// POST /api/ranks - Create new rank
router.post('/', async (req: Request, res: Response) => {
  try {
    const rank = req.body;
    const result = await db.insert(ranks).values(rank).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating rank:', error);
    res.status(500).json({ error: 'Failed to create rank' });
  }
});

// POST /api/ranks/bulk - Bulk create ranks
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { ranks: rankList } = req.body;

    if (!Array.isArray(rankList) || rankList.length === 0) {
      return res.status(400).json({ error: 'Invalid ranks data' });
    }

    const result = await db.insert(ranks).values(rankList).returning();
    res.status(201).json({
      message: `Successfully created ${result.length} ranks`,
      created: result.length,
      ranks: result
    });
  } catch (error) {
    console.error('Error bulk creating ranks:', error);
    res.status(500).json({ error: 'Failed to bulk create ranks' });
  }
});

// PUT /api/ranks/:id - Update rank
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.update(ranks)
      .set(updateData)
      .where(eq(ranks.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Rank not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating rank:', error);
    res.status(500).json({ error: 'Failed to update rank' });
  }
});

// DELETE /api/ranks/:id - Delete rank
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(ranks).where(eq(ranks.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Rank not found' });
    }

    res.json({ message: 'Rank deleted successfully' });
  } catch (error) {
    console.error('Error deleting rank:', error);
    res.status(500).json({ error: 'Failed to delete rank' });
  }
});

export default router;