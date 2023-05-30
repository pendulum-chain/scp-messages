import { ScpHistoryEntry } from "ts-stellar-xdr/lib/allTypes";
import fetch from "node-fetch";
import { gunzipSync } from "node:zlib";
import { printScpHistoryEntry } from "./prettyPrints";

export function readArchiveFile(file: ArrayBuffer): ScpHistoryEntry[] {
  const result: ScpHistoryEntry[] = [];
  const uint8Array = new Uint8Array(file);

  let i = 0;
  while (i < file.byteLength) {
    const length =
      uint8Array[i + 3] + uint8Array[i + 2] * 256 + uint8Array[i + 1] * 65536 + (uint8Array[i] & 0x7f) * 256 * 65536;
    i += 4;

    const slice = file.slice(i, i + length);
    result.push(ScpHistoryEntry.fromXdr(slice));

    i += length;
  }

  return result;
}

export async function downloadArchiveFile(ledger: number): Promise<void> {
  //const fetch = await import("node-fetch");

  const checkPoint = Math.floor(ledger / 64) * 64 - 1;

  const checkPoint1 = Math.floor(checkPoint / 256 / 256 / 256)
    .toString(16)
    .padStart(2, "0");
  const checkPoint2 = (Math.floor(checkPoint / 256 / 256) & 0xff).toString(16).padStart(2, "0");
  const checkPoint3 = (Math.floor(checkPoint / 256) & 0xff).toString(16).padStart(2, "0");
  const checkPoint4 = (checkPoint & 0xff).toString(16).padStart(2, "0");

  const url = `https://history.stellar.org/prd/core-live/core_live_001/scp/${checkPoint1}/${checkPoint2}/${checkPoint3}/scp-${checkPoint1}${checkPoint2}${checkPoint3}${checkPoint4}.xdr.gz`;
  console.log(url);
  try {
    const result = await fetch(url);
    const fileContent = await result.arrayBuffer();

    const realResult = gunzipSync(fileContent);

    const historyEntries = readArchiveFile(new Uint8Array(realResult).buffer);
    historyEntries.forEach(printScpHistoryEntry);
  } catch {}

  console.log("Archive file download done");
}
