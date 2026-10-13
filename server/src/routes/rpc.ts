import express from 'express';
import { authenticate } from '@/middleware/auth';
import { db } from '@/database/connection';

const router = express.Router();

router.post('/:function', authenticate, async (req, res) => {
  const { function: fn } = req.params;
  const args = req.body;
  
  try {
    const argKeys = Object.keys(args);
    const argValues = Object.values(args);
    
    if (argKeys.length === 0) {
      const result = await db.query(`SELECT * FROM ${fn}()`);
      return res.json({ result: (result as any).rows?.[0] });
    }
    
    const params = argKeys.map((_, i) => `$${i + 1}`).join(', ');
    const query = `SELECT * FROM ${fn}(${params})`;
    const result = await db.query(query, argValues);
    
    res.json({ result: (result as any).rows?.[0] });
  } catch (error: any) {
    console.error(`RPC ${fn} error:`, error.message);
    res.json({ result: null, error: error.message });
  }
});

export default router;