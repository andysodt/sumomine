import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { basho, insertBashoSchema } from '../db/schema.js';
import { z } from 'zod';

const router = Router();

// Get all basho
router.get('/', async (req, res) => {
  try {
    const allBasho = await db.select().from(basho);
    res.json(allBasho);
  } catch (error) {
    console.error('Error fetching basho:', error);
    res.status(500).json({ error: 'Failed to fetch basho' });
  }
});

// Get basho by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(basho).where(eq(basho.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Basho not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching basho:', error);
    res.status(500).json({ error: 'Failed to fetch basho' });
  }
});

// Create new basho (with upsert logic)
router.post('/', async (req, res) => {
  try {
    const validatedData = insertBashoSchema.parse(req.body);

    // Check if basho already exists
    const existing = await db.select().from(basho).where(eq(basho.id, validatedData.id));

    let result;
    if (existing.length > 0) {
      // Update existing basho
      result = await db
        .update(basho)
        .set(validatedData)
        .where(eq(basho.id, validatedData.id))
        .returning();
    } else {
      // Insert new basho
      result = await db.insert(basho).values(validatedData).returning();
    }

    res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating basho:', error);
    res.status(500).json({ error: 'Failed to create basho' });
  }
});

// Update basho
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertBashoSchema.parse(req.body);

    const result = await db
      .update(basho)
      .set(validatedData)
      .where(eq(basho.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Basho not found' });
    }

    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating basho:', error);
    res.status(500).json({ error: 'Failed to update basho' });
  }
});

// Delete basho
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.delete(basho).where(eq(basho.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Basho not found' });
    }

    res.json({ message: 'Basho deleted successfully' });
  } catch (error) {
    console.error('Error deleting basho:', error);
    res.status(500).json({ error: 'Failed to delete basho' });
  }
});

export default router;