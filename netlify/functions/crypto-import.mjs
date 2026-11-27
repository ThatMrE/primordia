// Daily import of gifts to the public crypto addresses into the Donations table.
import { importCrypto } from '../../scripts/crypto.mjs';

export default async () => {
  try {
    console.log(JSON.stringify(await importCrypto()));
  } catch (error) {
    console.error(`Crypto import failed: ${error.message}`);
  }
};

export const config = { schedule: '@daily' };
