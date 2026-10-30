import { Router } from 'express';
import { generateReport, listReports, getReportById, deleteReport } from '../controllers/report.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, generateReportSchema } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/generate', validate(generateReportSchema), generateReport);
router.get('/', listReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);

export default router;

