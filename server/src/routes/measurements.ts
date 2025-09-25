import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { measurements } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/measurements - Get all measurements
router.get('/', async (req: Request, res: Response) => {
  try {
    const allMeasurements = await db.select().from(measurements);
    res.json(allMeasurements);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// GET /api/measurements/:id - Get measurement by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(measurements).where(eq(measurements.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching measurement:', error);
    res.status(500).json({ error: 'Failed to fetch measurement' });
  }
});

// POST /api/measurements - Create new measurement
router.post('/', async (req: Request, res: Response) => {
  try {
    const measurement = req.body;
    const result = await db.insert(measurements).values(measurement).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating measurement:', error);
    res.status(500).json({ error: 'Failed to create measurement' });
  }
});

// POST /api/measurements/bulk - Bulk create measurements
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { measurements: measurementList } = req.body;

    if (!Array.isArray(measurementList) || measurementList.length === 0) {
      return res.status(400).json({ error: 'Invalid measurements data' });
    }

    const result = await db.insert(measurements).values(measurementList).returning();
    res.status(201).json({
      message: `Successfully created ${result.length} measurements`,
      created: result.length,
      measurements: result
    });
  } catch (error) {
    console.error('Error bulk creating measurements:', error);
    res.status(500).json({ error: 'Failed to bulk create measurements' });
  }
});

// PUT /api/measurements/:id - Update measurement
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.update(measurements)
      .set(updateData)
      .where(eq(measurements.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating measurement:', error);
    res.status(500).json({ error: 'Failed to update measurement' });
  }
});

// DELETE /api/measurements/:id - Delete measurement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.delete(measurements).where(eq(measurements.id, id)).returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    res.json({ message: 'Measurement deleted successfully' });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    res.status(500).json({ error: 'Failed to delete measurement' });
  }
});

export default router;