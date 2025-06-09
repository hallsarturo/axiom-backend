import { Router } from 'express';
import { printHello } from './controller.js';

const router = Router();

router.get('/user', printHello);
//router.get('/user/:id', printHello)

export { router };
