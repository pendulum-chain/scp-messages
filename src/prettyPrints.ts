import {
  Hash,
  LedgerScpMessages,
  PublicKey,
  ScpBallot,
  ScpEnvelope,
  ScpHistoryEntry,
  ScpHistoryEntryV0,
  ScpNomination,
  ScpQuorumSet,
  ScpStatement,
  ScpStatementConfirm,
  ScpStatementExternalize,
  ScpStatementPledges,
  ScpStatementPrepare,
  Value,
} from "ts-stellar-xdr/lib/allTypes";

import { keypair } from "ts-stellar-sdk";
import { orderMessages } from "./orderMessages";

const KNOWN_VALIDATORS: Record<string, string> = {
  GAAV2GCVFLNN522ORUYFV33E76VPC22E72S75AQ6MBR5V45Z5DWVPWEU: "BlockDaemon1",
  GAVXB7SBJRYHSG6KSQHY74N7JAFRL4PFVZCNWW2ARI6ZEKNBJSMSKW7C: "BlockDaemon2",
  GAYXZ4PZ7P6QOX7EBHPIZXNWY4KCOBYWJCA4WKWRKC7XIUS3UJPT6EZ4: "BlockDaemon3",

  GD6SZQV3WEJUH352NTVLKEV2JM2RH266VPEM7EH5QLLI7ZZAALMLNUVN: "Coinqvest1",
  GADLA6BJK6VK33EM2IDQM37L5KGVCY5MSHSHVJA4SCNGNUIEOTCR6J5T: "Coinqvest2",
  GAZ437J46SCFPZEDLVGDMKZPLFO77XJ4QVAURSJVRZK2T5S7XUFHXI2Z: "Coinqvest3",

  GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V: "FranklinTempleton1",
  GCMSM2VFZGRPTZKPH5OABHGH4F3AVS6XTNJXDGCZ3MKCOSUBH3FL6DOB: "FranklinTempleton2",
  GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A: "FranklinTempleton3",

  GCFONE23AB7Y6C5YZOMKUKGETPIAJA4QOYLS5VNS4JHBGKRZCPYHDLW7: "Lobster1",
  GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ: "Lobster2",
  GD5QWEVV4GZZTQP46BRXV5CUMMMLP4JTGFD7FWYJJWRL54CELY6JGQ63: "Lobster3",
  GA7TEPCBDQKI7JQLQ34ZURRMK44DVYCIGVXQQWNSWAEQR6KB4FMCBT7J: "Lobster4",
  GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7: "Lobster5",

  GBLJNN3AVZZPG2FYAYTYQKECNWTQYYUUY2KVFN2OUKZKBULXIXBZ4FCT: "PublicNode1",
  GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2: "PublicNode2",
  GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z: "PublicNode3",

  GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE: "SatoshiPay1",
  GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUBY4G5MYP3M47PCVI55MNT: "SatoshiPay2",
  GAK6Z5UVGUVSEK6PEOCAYJISTT5EJBB34PN3NOLEQG2SUKXRVV2F6HZY: "SatoshiPay3",

  GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH: "SDF1",
  GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK: "SDF2",
  GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ: "SDF3",
};

interface PrintContext {
  quorumHashes: Record<string, string>;
  values: Record<string, string>;
  sender: string;
}

export function printScpHistoryEntry(scpHistoryEntry: ScpHistoryEntry) {
  if (scpHistoryEntry.type !== 0) throw new Error(`Unknown ScpHistoryEntry type ${scpHistoryEntry.type}`);
  printScpHistoryEntryV0(scpHistoryEntry.value);
}

function printScpHistoryEntryV0(scpHistoryEntryV0: ScpHistoryEntryV0) {
  console.log(`\nLEDGER ${scpHistoryEntryV0.ledgerMessages.ledgerSeq}`);
  console.log("ScpQuorumSets");
  scpHistoryEntryV0.quorumSets.forEach((quorumSet) => printScpQuorumSet(quorumSet, "  "));
  console.log(`LedgerScpMessages (${scpHistoryEntryV0.ledgerMessages.messages.length})`);
  printLedgerScpMessages(scpHistoryEntryV0.ledgerMessages);
}

function printScpQuorumSet(scpQuorumSet: ScpQuorumSet, indentation: string = "") {
  if (indentation === "  ") {
    console.log("  Quorum Set");
  }

  indentation += "  ";

  console.log(`${indentation}threshold: ${scpQuorumSet.threshold}`);
  if (scpQuorumSet.validators.length > 0) {
    let validators = `${indentation}validators: `;
    scpQuorumSet.validators.forEach((validator) => (validators += printPublicKey(validator) + " "));
    console.log(validators);
  }

  scpQuorumSet.innerSets.forEach((innerSet) => {
    console.log(`${indentation}inner quorum set:`);
    printScpQuorumSet(innerSet, `${indentation}  `);
  });
}

function printPublicKey(publicKey: PublicKey) {
  const publicKeyObject = new keypair.PublicKey(publicKey.value);
  const publicKeyString = publicKeyObject.getPublicKeyString();

  if (KNOWN_VALIDATORS[publicKeyString] === undefined) {
    // throw new Error(`Unknown public key: ${publicKeyString}`);
    return publicKeyString;
  }

  return KNOWN_VALIDATORS[publicKeyString];
}

function printLedgerScpMessages(ledgerScpMessages: LedgerScpMessages) {
  const printContext: PrintContext = {
    quorumHashes: {},
    values: {},
    sender: "",
  };

  orderMessages(ledgerScpMessages).forEach((message) => printScpEnvelope(message, printContext));
}

function printScpEnvelope(scpEnvelope: ScpEnvelope, printContext: PrintContext) {
  printScpStatement(scpEnvelope.statement, printContext);
}

function printScpStatement(scpStatement: ScpStatement, printContext: PrintContext) {
  printContext.sender = printPublicKey(scpStatement.nodeId);
  printScpStatementPledges(scpStatement.pledges, printContext);
}

function printScpStatementPledges(scpStatementPledges: ScpStatementPledges, printContext: PrintContext) {
  switch (scpStatementPledges.type) {
    case "scpStPrepare":
      printScpStatementPrepare(scpStatementPledges.value, printContext);
      break;
    case "scpStConfirm":
      printScpStatementConfirm(scpStatementPledges.value, printContext);
      break;
    case "scpStExternalize":
      printScpStatementExternalize(scpStatementPledges.value, printContext);
      break;
    case "scpStNominate":
      printScpNomination(scpStatementPledges.value, printContext);
      break;
  }
}

function printScpStatementPrepare(scpStatementPrepare: ScpStatementPrepare, printContext: PrintContext) {
  console.log(`  Prepare message from ${printContext.sender}`);
  printHash(scpStatementPrepare.quorumSetHash, "    ", printContext);

  console.log(
    `    b = ${printScpBallot(scpStatementPrepare.ballot, printContext)}, p = ${printScpBallot(
      scpStatementPrepare.prepared,
      printContext
    )}, p' = ${printScpBallot(scpStatementPrepare.preparedPrime, printContext)}, c.n = ${
      scpStatementPrepare.nC
    }, h.n = ${scpStatementPrepare.nH}`
  );
}

function printScpStatementConfirm(scpStatementConfirm: ScpStatementConfirm, printContext: PrintContext) {
  console.log(`  Confirm message from ${printContext.sender}`);
  printHash(scpStatementConfirm.quorumSetHash, "    ", printContext);

  console.log(
    `    b = ${printScpBallot(scpStatementConfirm.ballot, printContext)}, p.n = ${
      scpStatementConfirm.nPrepared
    }, c.n = ${scpStatementConfirm.nCommit}, h.n = ${scpStatementConfirm.nH}`
  );
}

function printScpStatementExternalize(scpStatementExternalize: ScpStatementExternalize, printContext: PrintContext) {
  console.log(`  Externalize message from ${printContext.sender}`);
  printHash(scpStatementExternalize.commitQuorumSetHash, "    ", printContext);

  console.log(
    `    c = ${printScpBallot(scpStatementExternalize.commit, printContext)}, h.n = ${scpStatementExternalize.nH}`
  );
}

function printScpNomination(scpStatementNominate: ScpNomination, printContext: PrintContext) {
  console.log(`  Nominate message from ${printContext.sender}`);
  printHash(scpStatementNominate.quorumSetHash, "    ", printContext);
}

function printHash(hash: Hash, indentation: string, printContext: PrintContext) {
  const uint8Array = new Uint8Array(hash);
  let hashString = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    hashString += uint8Array[i].toString(16).padStart(2, "0");
  }

  if (printContext.quorumHashes[hashString] === undefined) {
    printContext.quorumHashes[hashString] = `quorumHash${Object.keys(printContext.quorumHashes).length + 1}`;
  }

  console.log(`${indentation}quorumSet: ${printContext.quorumHashes[hashString]}`);
}

function printScpBallot(scpBallot: ScpBallot | undefined, printContext: PrintContext) {
  if (scpBallot === undefined) {
    return `(0, \u22A5)`;
  }

  return `(${scpBallot.counter}, ${valueToString(scpBallot.value, printContext)})`;
}

function valueToString(value: Value, printContext: PrintContext): string {
  const uint8Array = new Uint8Array(value);
  let valueString = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    valueString += uint8Array[i].toString(16).padStart(2, "0");
  }

  if (printContext.values[valueString] === undefined) {
    printContext.values[valueString] = `value${Object.keys(printContext.values).length + 1}`;
  }

  return printContext.values[valueString];
}
