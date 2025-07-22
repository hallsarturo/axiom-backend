import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

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
