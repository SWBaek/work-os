import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Other routes will be added here

export default router;
