import express from 'express';
import { responseSuccess } from '../response-handler';
import { agent } from '../veramo/setup';

const router = express.Router();

router
  .get('/list', async (req, res, next) => {
    try {
      const result = await agent.didManagerFind();
      responseSuccess(res, result);
    } catch (error) {
      next(error);
    }
  })
  .post('/create', async (req, res, next) => {
    try {
      const alias = req.body.alias;
      const provider = req.body.provider;
      try {
        await agent.didManagerGetByAlias({ alias });
        throw new Error('This alias already exists');
      } catch (error) {
        const result = await agent.didManagerCreate({
          alias,
          provider: provider ? `did:${provider}` : undefined,
        });
        responseSuccess(res, result);
      }
    } catch (error) {
      next(error);
    }
  });

export default router;
