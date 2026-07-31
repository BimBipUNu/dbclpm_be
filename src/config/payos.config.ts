import { PayOS } from "@payos/node";
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "PAYOS_CLIENT_ID_HERE";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "PAYOS_API_KEY_HERE";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "PAYOS_CHECKSUM_KEY_HERE";

export const payOS = new PayOS({
  clientId: PAYOS_CLIENT_ID,
  apiKey: PAYOS_API_KEY,
  checksumKey: PAYOS_CHECKSUM_KEY
});
