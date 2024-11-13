import express from 'express';
import { responseSuccess } from '../response-handler';
import { agent } from '../veramo/setup';
import { ICredentialRequestInput } from '@veramo/selective-disclosure';

const router = express.Router();

router
  .post('/credentials/verify', async (req, res, next) => {
    try {
      const result = await agent.verifyVerifiableCredential({ credential: req.body });
      responseSuccess(res, { verified: result.verified });
    } catch (error) {
      next(error);
    }
  })
  .post('/presentations/verify', async (req, res, next) => {
    try {
      const presentation = req.body;
      const result = await agent.verifyVerifiablePresentation({
        presentation,
        challenge: presentation.proof.challenge,
      });
      responseSuccess(res, { verified: result.verified });
    } catch (error) {
      next(error);
    }
  })
  .post('/presentations/request', async (req, res, next) => {
    try {
      const { body } = req;
      const issuerDID = body.issuer;

      await agent.didManagerGet({ did: issuerDID });

      const sdr = await agent.createSelectiveDisclosureRequest({
        data: {
          tag: new Date().toISOString(),
          issuer: issuerDID,
          claims: <ICredentialRequestInput[]>body.claims,
        }
      });
      responseSuccess(res, { sdr });
    } catch (error) {
      next(error);
    }
  });

export default router;
