import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { torikumi } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/torikumi - Get all torikumi
router.get('/', async (req: Request, res: Response) => {
  try {
    const allTorikumi = await db.select().from(torikumi);
    res.json(allTorikumi);
  } catch (error) {
    console.error('Error fetching torikumi:', error);
    res.status(500).json({ error: 'Failed to fetch torikumi' });
  }
});

// GET /api/torikumi/:id - Get torikumi by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(torikumi).where(eq(torikumi.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Torikumi not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching torikumi:', error);
    res.status(500).json({ error: 'Failed to fetch torikumi' });
  }
});

// POST /api/torikumi - Create new torikumi
router.post('/', async (req: Request, res: Response) => {
  try {
    const torikumiData = req.body;
    const result = await db.insert(torikumi).values(torikumiData).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating torikumi:', error);
    res.status(500).json({ error: 'Failed to create torikumi' });
  }
});

// POST /api/torikumi/bulk - Bulk create torikumi
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { torikumi: torikumiList } = req.body;

    if (!Array.isArray(torikumiList) || torikumiList.length === 0) {
      return res.status(400).json({ error: 'Invalid torikumi data' });
    }

    const result = await db.insert(torikumi).values(torikumiList).returning();
    res.status(201).json({
      message: `Successfully created ${result.length} torikumi`,
      created: result.length,
      torikumi: result
    });
  } catch (error) {
    console.error('Error bulk creating torikumi:', error);
    res.status(500).json({ error: 'Failed to bulk create torikumi' });
  }
});

// PUT /api/torikumi/:id - Update torikumi
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.update(torikumi)
      .set(updateData)
      .where(eq(torikumi.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Torikumi not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating torikumi:', error);
    res.status(500).json({ error: 'Failed to update torikumi' });
  }
});

// DELETE /api/torikumi/:id - Delete torikumi
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(torikumi).where(eq(torikumi.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Torikumi not found' });
    }

    res.json({ message: 'Torikumi deleted successfully' });
  } catch (error) {
    console.error('Error deleting torikumi:', error);
    res.status(500).json({ error: 'Failed to delete torikumi' });
  }
});

export default router;