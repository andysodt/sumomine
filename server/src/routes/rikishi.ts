import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { rikishi, insertRikishiSchema } from '../db/schema.js';
import { z } from 'zod';

const router = Router();

// Get all rikishi
router.get('/', async (req, res) => {
  try {
    const allRikishi = await db.select().from(rikishi);
    res.json(allRikishi);
  } catch (error) {
    console.error('Error fetching rikishi:', error);
    res.status(500).json({ error: 'Failed to fetch rikishi' });
  }
});

// Get rikishi by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(rikishi).where(eq(rikishi.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Rikishi not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching rikishi:', error);
    res.status(500).json({ error: 'Failed to fetch rikishi' });
  }
});

// Create new rikishi
router.post('/', async (req, res) => {
  try {
    const validatedData = insertRikishiSchema.parse(req.body);
    const result = await db.insert(rikishi).values(validatedData).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating rikishi:', error);
    res.status(500).json({ error: 'Failed to create rikishi' });
  }
});

// Bulk create rikishi
router.post('/bulk', async (req, res) => {
  try {
    const { rikishi: rikishiData } = req.body;

    if (!Array.isArray(rikishiData) || rikishiData.length === 0) {
      return res.status(400).json({ error: 'Invalid data: expected array of rikishi' });
    }

    // Validate each rikishi record
    const validatedData = rikishiData.map(r => insertRikishiSchema.parse(r));

    // Insert in batches to avoid query limits
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < validatedData.length; i += batchSize) {
      const batch = validatedData.slice(i, i + batchSize);
      const batchResult = await db.insert(rikishi).values(batch).returning();
      results.push(...batchResult);
    }

    res.status(201).json({
      message: `Successfully created ${results.length} rikishi`,
      created: results.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error bulk creating rikishi:', error);
    res.status(500).json({ error: 'Failed to create rikishi' });
  }
});

// Update rikishi
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertRikishiSchema.parse(req.body);

    const result = await db
      .update(rikishi)
      .set(validatedData)
      .where(eq(rikishi.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Rikishi not found' });
    }

    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating rikishi:', error);
    res.status(500).json({ error: 'Failed to update rikishi' });
  }
});

// Delete rikishi
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.delete(rikishi).where(eq(rikishi.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Rikishi not found' });
    }

    res.json({ message: 'Rikishi deleted successfully' });
  } catch (error) {
    console.error('Error deleting rikishi:', error);
    res.status(500).json({ error: 'Failed to delete rikishi' });
  }
});

export default router;