import db from '../config/db.js';
import { generateReportSynthesis } from '../services/gemini.service.js';

/**
 * Generate a new multimodal synthesis report
 */
export async function generateReport(req, res) {
  try {
    const userId = req.user.id;
    const { title, assetIds = [], customPrompt = '' } = req.body;

    // Retrieve attached assets scoped to current user
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

    // Call Gemini 2.5 Pro synthesis service
    const synthesizedContent = await generateReportSynthesis({
      title,
      assets: attachedAssets,
      userRequirements: customPrompt
    });

    // Save report in PostgreSQL
    const insertRes = await db.query(
      `INSERT INTO reports (user_id, title, content, source_asset_ids)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, synthesizedContent, JSON.stringify(assetIds)]
    );

    return res.status(201).json({
      success: true,
      message: 'Synthesis report generated successfully.',
      report: insertRes.rows[0]
    });
  } catch (err) {
    console.error('[Report Controller] Generate Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate synthesis report.'
    });
  }
}

/**
 * List all reports for the user
 */
export async function listReports(req, res) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, title, source_asset_ids, created_at, SUBSTRING(content FROM 1 FOR 300) AS preview FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      reports: result.rows || []
    });
  } catch (err) {
    console.error('[Report Controller] List Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports archive.'
    });
  }
}

/**
 * Get single report by ID
 */
export async function getReportById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      report: result.rows[0]
    });
  } catch (err) {
    console.error('[Report Controller] GetById Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve report.'
    });
  }
}

/**
 * Delete a report
 */
export async function deleteReport(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM reports WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully.'
    });
  } catch (err) {
    console.error('[Report Controller] Delete Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete report.'
    });
  }
}

