import db from '../config/db.js';
import { generateChatResponse } from '../services/gemini.service.js';

/**
 * Create a new chat session
 */
export async function createSession(req, res) {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const result = await db.query(
      `INSERT INTO chat_sessions (user_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, title ? title.trim() : 'OmniMind Session ' + new Date().toLocaleDateString()]
    );

    return res.status(201).json({
      success: true,
      session: result.rows[0]
    });
  } catch (err) {
    console.error('[Chat Controller] CreateSession Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create chat session.'
    });
  }
}

/**
 * List all chat sessions for the user
 */
export async function listSessions(req, res) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      sessions: result.rows || []
    });
  } catch (err) {
    console.error('[Chat Controller] ListSessions Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat sessions.'
    });
  }
}

/**
 * Get all messages for a specific session
 */
export async function getSessionMessages(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify session belongs to user
    const sessionRes = await db.query(
      'SELECT id, title, created_at FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!sessionRes.rows || sessionRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found or unauthorized.'
      });
    }

    const messagesRes = await db.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [id]
    );

    return res.status(200).json({
      success: true,
      session: sessionRes.rows[0],
      messages: messagesRes.rows || []
    });
  } catch (err) {
    console.error('[Chat Controller] GetMessages Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve session messages.'
    });
  }
}

/**
 * Delete a chat session
 */
export async function deleteSession(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query('DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2', [id, userId]);

    return res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully.'
    });
  } catch (err) {
    console.error('[Chat Controller] DeleteSession Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete chat session.'
    });
  }
}

/**
 * Send user prompt with optional selected multimodal assets,
 * invoke Gemini, record both turns, and respond with citations
 */
export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    let { sessionId, content, assetIds = [] } = req.body;

    // If no sessionId provided, auto-create a new session
    if (!sessionId) {
      const titlePrompt = content.length > 30 ? content.slice(0, 30) + '...' : content;
      const newSessionRes = await db.query(
        'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING *',
        [userId, titlePrompt]
      );
      sessionId = newSessionRes.rows[0].id;
    } else {
      // Verify session belongs to user
      const checkRes = await db.query(
        'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      if (!checkRes.rows || checkRes.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Specified chat session does not exist or unauthorized.'
        });
      }
    }

    // Retrieve full metadata for any referenced assets belonging to user
    let attachedAssets = [];
    if (assetIds && assetIds.length > 0) {
      for (const assetId of assetIds) {
        const assetRes = await db.query(
          'SELECT * FROM assets WHERE id = $1 AND user_id = $2',
          [assetId, userId]
        );
        if (assetRes.rows && assetRes.rows.length > 0) {
          attachedAssets.push(assetRes.rows[0]);
        }
      }
    }

    // Fetch conversation history for this session to maintain context
    const historyRes = await db.query(
      'SELECT sender, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    const history = historyRes.rows || [];

    // Store the user message in DB
    const userMsgRes = await db.query(
      `INSERT INTO chat_messages (session_id, sender, content, citations)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionId, 'user', content, JSON.stringify(attachedAssets.map(a => ({ id: a.id, title: a.title, modality: a.modality })))]
    );

    // Call Gemini Multimodal Reasoning Engine
    const aiResponse = await generateChatResponse({
      prompt: content,
      assets: attachedAssets,
      history
    });

    // Store AI response with citations in DB
    const aiMsgRes = await db.query(
      `INSERT INTO chat_messages (session_id, sender, content, citations)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionId, 'ai', aiResponse.content, JSON.stringify(aiResponse.citations || [])]
    );

    return res.status(200).json({
      success: true,
      sessionId,
      userMessage: userMsgRes.rows[0],
      aiMessage: aiMsgRes.rows[0]
    });
  } catch (err) {
    console.error('[Chat Controller] SendMessage Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process AI chat interaction.'
    });
  }
}

