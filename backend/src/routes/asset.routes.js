import { Router } from 'express';
import { uploadAssets, listAssets, getAssetById, deleteAsset, getDashboardStats, streamAssetFile } from '../controllers/asset.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Apply auth protection across all asset routes
router.use(authMiddleware);

router.post('/upload', upload.array('files', 10), uploadAssets);
router.get('/', listAssets);
router.get('/stats/summary', getDashboardStats);
router.get('/:id', getAssetById);
router.get('/:id/file', streamAssetFile);
router.delete('/:id', deleteAsset);

export default router;

