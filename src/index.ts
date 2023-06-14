import { scanArchiveFiles } from "./archiveFile";
import { startAtLedger, mode, archive } from "../config.json";

// PROBLEM IN LEDGER 46451840 for stellar archive
//   start to look at archive 46451921
// PROBLEM IN LEDGER 46443300 for satoshipay archive

// PROBLEM IN LEDGER 46647565 for stellar archive
//  cannot decode XDR
//  start to look at archive 46647616
//  I started to scan at 46689366

async function main() {
  let ledger = startAtLedger;
  while (true) {
    await scanArchiveFiles(ledger, archive as any, mode as any);

    ledger -= 64;
  }
}

main();
