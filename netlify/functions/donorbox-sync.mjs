// Hourly pull of new Donorbox gifts into the Airtable Donations table.
import { syncDonorbox } from '../../scripts/donorbox.mjs';

export default async () => {
  try {
    const result = await syncDonorbox();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`Donorbox sync failed: ${error.message}`);
  }
};

export const config = { schedule: '@hourly' };
