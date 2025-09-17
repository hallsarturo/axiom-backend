import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard/categories/{parentId}:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get child categories for a given parent category
 *     description: |
 *       Returns all child categories for the specified parent category ID.
 *       - If parentId is null or 0, returns top-level (level0) categories.
 *       - If parentId is a valid category ID, returns its direct children.
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the parent category. Use "null" or "0" for top-level categories.
 *     responses:
 *       200:
 *         description: List of child categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 children:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       level0:
 *                         type: string
 *                       level1:
 *                         type: string
 *                       level2:
 *                         type: string
 *                       level3:
 *                         type: string
 *                       level4:
 *                         type: string
 *                       parent_id:
 *                         type: integer
 *       404:
 *         description: Route not found or invalid parentId
 *       500:
 *         description: Couldn't retrieve category children
 */

router.get('/categories/:parentId', async (req, res) => {
    try {
        const { parentId } = req.params;
        const children = await db.philarchive_categories.findAll({
            where: { parent_id: parentId },
        });

        res.status(200).json({ children });
    } catch (err) {
        logger.error("couldn't retrieve category children", err);
        res.status(500).json({ error: "Couldn't retrieve category children" });
    }
});

export { router };
