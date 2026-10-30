import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required')
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  content: z.string().min(1, 'Message content cannot be empty'),
  assetIds: z.array(z.string().uuid()).optional()
});

export const createSessionSchema = z.object({
  title: z.string().min(1, 'Session title cannot be empty')
});

export const generateReportSchema = z.object({
  title: z.string().min(1, 'Report title is required'),
  assetIds: z.array(z.string().uuid()).optional(),
  customPrompt: z.string().optional()
});

/**
 * Middleware wrapper for Zod validation
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }
  };
}

