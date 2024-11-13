import express from 'express';
import { responseSuccess } from '../response-handler';
import { agent } from '../veramo/setup';
import { ICredentialRequestInput } from '@veramo/selective-disclosure';

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
      const verifier = req.body.verifier;
      const holder = req.body.holder;
      const proofFormat = req.body.proofFormat;
      const challenge = req.body.challenge;
      const payload = await agent.handleMessage({ raw: req.body.sdr });
      const claims: ICredentialRequestInput[] = (payload.data as any)?.claims || [];
      
      const credentialsForSdr = await agent.getVerifiableCredentialsForSdr({ sdr: { claims } });

      const verifiableCredentials = credentialsForSdr.map(
        (credentialForSdr) =>
          credentialForSdr
            .credentials
            .filter((credential) => credential.verifiableCredential.credentialSubject.id === holder)
            .map((credential) => {
              if (claims.length) {
                const credentialSubject = claims.reduce((prevVal: { [key: string]: string }, claim) => {
                  if (claim.claimType in credential.verifiableCredential.credentialSubject) {
                    prevVal[claim.claimType] = credential.verifiableCredential.credentialSubject[claim.claimType];
                  }
                  return prevVal;
                }, {});
                credential.verifiableCredential.credentialSubject = credentialSubject;
              }
              return credential.verifiableCredential;
            })
      ).flat();

      if (!verifiableCredentials) {
        throw new Error('Credential not found');
      }

      const presentation = await agent.issueVerifiablePresentation({
        verifier,
        holder,
        proofFormat,
        challenge,
        credentials: verifiableCredentials,
      })
      responseSuccess(res, presentation);
    } catch (error) {
      next(error);
    }
  })
  .post('/presentations/present', async (req, res, next) => {
    try {
      const record = await agent.storeVerifiablePresentation({
        verifiablePresentation: req.body.presentation
      });
      responseSuccess(res, { id: record.id, hash: record.hash });
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
