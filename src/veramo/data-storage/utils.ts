import { DataSource } from 'typeorm';
import { OrPromise } from '@veramo/utils';

export async function getConnectedDb(dbConnection: OrPromise<DataSource>): Promise<DataSource> {
  if (dbConnection instanceof Promise) {
    return await dbConnection
  }
  if (!dbConnection.isInitialized) {
    return await (<DataSource>dbConnection).initialize();
  }
  return dbConnection;
}
