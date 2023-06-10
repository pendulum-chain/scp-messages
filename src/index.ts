import { scanArchiveFiles } from "./archiveFile";
import { startAtLedger, mode, archive } from "../config.json";

// PROBLEM IN LEDGER 46451840 for stellar archive
//   start to look at archive 46451921
// PROBLEM IN LEDGER 46443300 for satoshipay archive

async function main() {
  let ledger = startAtLedger;
  while (true) {
    await scanArchiveFiles(ledger, archive as any, mode as any);

    ledger -= 64;
  }
}

main();
