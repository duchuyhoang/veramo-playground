import express from 'express';
import { responseSuccess } from '../response-handler';
import { agent } from '../veramo/setup';

const router = express.Router();

router
  .post('/credentials/issue', async (req, res, next) => {
    try {
      const { body } = req;
      const issuerDID = body.issuer;
      const holderDID = body.holder;
      const schemaUrl = body.schemaUrl;
      const credentialSubject = body.credentialSubject;
      const expirationDate = body.expirationDate;

      await Promise.all([
        agent.didManagerGet({ did: issuerDID }),
        agent.didManagerGet({ did: holderDID }),
      ]);

      const verifiableCredential = await agent.issueVerifiableCredential({
        schemaUrl,
        holder: holderDID,
        credential: {
          issuer: { id: issuerDID },
          // type: [],
          credentialSubject,
          expirationDate: expirationDate ? new Date(expirationDate).toJSON() : undefined,
        },
      });
      return responseSuccess(res, verifiableCredential);
    } catch (error) {
      next(error);
    }
  })
  .post('/credentials/revoke', async (req, res, next) => {
    try {
      const result = await agent.revokeVerifiableCredential({
        issuerDID: req.body.issuerDID,
        credentialId: req.body.credentialId,
      });
      responseSuccess(res, result);
    } catch (error) {
      next(error);
    }
  });

export default router;
