import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { banzuke } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/banzuke - Get all banzuke
router.get('/', async (req: Request, res: Response) => {
  try {
    const allBanzuke = await db.select().from(banzuke);
    res.json(allBanzuke);
  } catch (error) {
    console.error('Error fetching banzuke:', error);
    res.status(500).json({ error: 'Failed to fetch banzuke' });
  }
});

// GET /api/banzuke/:id - Get banzuke by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(banzuke).where(eq(banzuke.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Banzuke not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching banzuke:', error);
    res.status(500).json({ error: 'Failed to fetch banzuke' });
  }
});

// POST /api/banzuke - Create new banzuke
router.post('/', async (req: Request, res: Response) => {
  try {
    const banzukeData = req.body;
    const result = await db.insert(banzuke).values(banzukeData).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating banzuke:', error);
    res.status(500).json({ error: 'Failed to create banzuke' });
  }
});

// POST /api/banzuke/bulk - Bulk create banzuke
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { banzuke: banzukeList } = req.body;

    if (!Array.isArray(banzukeList) || banzukeList.length === 0) {
      return res.status(400).json({ error: 'Invalid banzuke data' });
    }

    const result = await db.insert(banzuke).values(banzukeList).returning();
    res.status(201).json({
      message: `Successfully created ${result.length} banzuke`,
      created: result.length,
      banzuke: result
    });
  } catch (error) {
    console.error('Error bulk creating banzuke:', error);
    res.status(500).json({ error: 'Failed to bulk create banzuke' });
  }
});

// PUT /api/banzuke/:id - Update banzuke
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.update(banzuke)
      .set(updateData)
      .where(eq(banzuke.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Banzuke not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating banzuke:', error);
    res.status(500).json({ error: 'Failed to update banzuke' });
  }
});

// DELETE /api/banzuke/:id - Delete banzuke
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(banzuke).where(eq(banzuke.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Banzuke not found' });
    }

    res.json({ message: 'Banzuke deleted successfully' });
  } catch (error) {
    console.error('Error deleting banzuke:', error);
    res.status(500).json({ error: 'Failed to delete banzuke' });
  }
});

export default router;