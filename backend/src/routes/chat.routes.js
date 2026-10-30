import { Router } from 'express';
import { createSession, listSessions, getSessionMessages, deleteSession, sendMessage } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, chatMessageSchema, createSessionSchema } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/sessions', validate(createSessionSchema), createSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id/messages', getSessionMessages);
router.delete('/sessions/:id', deleteSession);
router.post('/message', validate(chatMessageSchema), sendMessage);

export default router;

