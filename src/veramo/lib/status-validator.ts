import { CredentialJwtOrJSON } from 'credential-status'
import { DataSource } from 'typeorm';
import { getConnectedDb } from '../data-storage/utils';
import { Credential } from '../entities/credential';

export const checkCredentialRevocation = async (dbConnection: Promise<DataSource>, credential: CredentialJwtOrJSON) => {
  if (typeof credential === 'object') {
    const credentialId = credential.credentialStatus?.id;
    if (!credentialId) {
      return { revoked: true };
    }

    const connection = await getConnectedDb(dbConnection);
    const repository = connection.getRepository(Credential);
    const verifiableCredential = await repository.findOne({
      where: { id: credentialId },
      select: ['hash', 'id', 'expirationDate', 'revoked']
    });

    if (
      !verifiableCredential
      || verifiableCredential.revoked
      || (verifiableCredential.expirationDate && verifiableCredential.expirationDate.getTime() < new Date().getTime())
    ) {
      return { revoked: true };
    }
  }


  return { revoked: false };
}