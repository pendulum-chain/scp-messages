import { downloadArchiveFile } from "./archiveFile";

async function main() {
  let archive = 46516145;

  while (true) {
    await downloadArchiveFile(archive);

    archive -= 64;
  }
}

main();
