import { Router } from 'express';
import db from '../../models/index.js';
import jwt from 'jsonwebtoken'; 
import authenticate from '../../lib/authenticate.js';

const router = Router();

router.get('/')

export { router };