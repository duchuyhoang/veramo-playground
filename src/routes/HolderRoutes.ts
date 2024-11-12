import express from 'express';
import { responseSuccess } from '../response-handler';
import { agent } from '../veramo/setup';

const router = express.Router();

router
  .get('/credentials/list', async (req, res, next) => {
    try {
      const holderDID = req.query.holder as string;
      const credentials = await agent.getVerifiableCredentials({ holder: holderDID })
      responseSuccess(res, credentials);
    } catch (error) {
      next(error);
    }
  })
  .post('/credentials/store', async (req, res, next) => {
    try {
      const record = await agent.storeVerifiableCredential({ verifiableCredential: req.body });
      responseSuccess(res, { id: record.id, hash: record.hash });
    } catch (error) {
      next(error);
    }
  })
  .delete('/credentials/delete/:id', async (req, res, next) => {
    try {
      await agent.deleteVerifiableCredential({ credentialId: req.params.id });
      responseSuccess(res, { id: req.params.id });
    } catch (error) {
      next(error);
    }
  })
  .post('/presentations/prove', async (req, res, next) => {
    try {
      const holder = req.body.holder;
      const payload = await agent.handleMessage({ raw: req.body.sdr });
      const credentialsForSdr = await agent.getVerifiableCredentialsForSdr({
        sdr: {
          claims: (payload.data as any)?.claims as any || [],
        }
      });

      const credentials = credentialsForSdr.map((credentialForSdr) =>
        credentialForSdr.credentials.filter((credential) => credential.verifiableCredential.credentialSubject.id === holder)
      ).flat()

      const presentation = await agent.issueVerifiablePresentation({
        holder: credentials[0].verifiableCredential.credentialSubject.id || '',
        credentialIds: credentials.map((credential) => credential.verifiableCredential.id || ''),
      })
      responseSuccess(res, presentation);
    } catch (error) {
      next(error);
    }
  })
  .post('/presentations/present', async (req, res, next) => {
    try {

    } catch (error) {
      next(error);
    }
  })
  .post('/credentials/derive', (req, res, next) => {
    try {
      throw new Error('No implementation');
    } catch (error) {
      next(error);
    }
  })
  .post('/credentials/transfer', (req, res, next) => {
    try {
      throw new Error('No implementation');
    } catch (error) {
      next(error);
    }
  });

export default router;
