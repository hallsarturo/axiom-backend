import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard configuration options
 *     description: Returns all available degree levels and subjects for user dashboard configuration. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of degree levels and subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 degreeLevels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       imgSrc:
 *                         type: string
 *                       imgAlt:
 *                         type: string
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       imgSrc:
 *                         type: string
 *                       imgAlt:
 *                         type: string
 *       401:
 *         description: Unauthorized - JWT required
 *       500:
 *         description: Couldn't retrieve dashboard info
 */

router.use('/', async (req, res) => {
    try {
        // get all elements from degree-level table
        const degreeLevels = await db.degree_levels.findAll({
            attributes: ['id', 'name', 'imgSrc', 'imgAlt'],
        });

        // get all elements from subjects
        const subjects = await db.subjects.findAll({
            attributes: ['id', 'name', 'imgSrc', 'imgAlt'],
        });

        res.status(200).json({ degreeLevels, subjects });
    } catch (err) {
        console.error("couldn't retrieve dashboard info", err);
        res.status(500).json({ error: "Couldn't retrieve dashboard info" });
    }
});

export { router };
