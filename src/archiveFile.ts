import { ScpHistoryEntry } from "ts-stellar-xdr/lib/allTypes";
import fetch from "node-fetch";
import { gunzipSync } from "node:zlib";
import { checkScpHistoryEntryConsensus } from "./checkConsensus";
import { printScpHistoryEntry } from "./prettyPrints";

const MAINNET_PASSPHRARE = "Public Global Stellar Network ; September 2015";
const ARCHIVE_URLS = {
  stellar: "https://history.stellar.org/prd/core-live/core_live_001",
  satoshipay: "https://stellar-history-us-iowa.satoshipay.io",
};

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

export async function scanArchiveFiles(
  ledger: number,
  archive: keyof typeof ARCHIVE_URLS,
  mode: "display" | "consensus-check"
): Promise<void> {
  const checkPoint = Math.floor(ledger / 64) * 64 - 1;

  const checkPoint1 = Math.floor(checkPoint / 256 / 256 / 256)
    .toString(16)
    .padStart(2, "0");
  const checkPoint2 = (Math.floor(checkPoint / 256 / 256) & 0xff).toString(16).padStart(2, "0");
  const checkPoint3 = (Math.floor(checkPoint / 256) & 0xff).toString(16).padStart(2, "0");
  const checkPoint4 = (checkPoint & 0xff).toString(16).padStart(2, "0");

  const url = `${ARCHIVE_URLS[archive]}/scp/${checkPoint1}/${checkPoint2}/${checkPoint3}/scp-${checkPoint1}${checkPoint2}${checkPoint3}${checkPoint4}.xdr.gz`;
  console.log(url);
  try {
    const result = await fetch(url);
    const fileContent = await result.arrayBuffer();

    const realResult = gunzipSync(fileContent);

    console.log("Fetching archive file done");
    const historyEntries = readArchiveFile(new Uint8Array(realResult).buffer);
    historyEntries.reverse();
    let sequenceNumber = checkPoint;
    console.log("History entries read");
    for (const entry of historyEntries) {
      switch (mode) {
        case "display":
          printScpHistoryEntry(entry);
          break;

        case "consensus-check":
          const result = await checkScpHistoryEntryConsensus(entry, sequenceNumber--, MAINNET_PASSPHRARE);
          if (!result) {
            console.log("\n\n");
            printScpHistoryEntry(entry);
            process.exit();
          }
          break;
      }
    }
  } catch (error) {
    console.log("An error ocurred", error);
  }

  console.log("Archive file download done");
}
