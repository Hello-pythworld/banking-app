import { Router } from 'express';
import * as accountController from './accountController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', accountController.getAccounts);
router.get('/:id', accountController.getAccountById);
router.post('/', accountController.createAccount);
router.delete('/:id', accountController.closeAccount);
router.post('/:id/deposit', accountController.deposit);
router.post('/:id/withdraw', accountController.withdraw);
router.post('/:id/transfer', accountController.transfer);

export default router;
