import {
  LedgerScpMessages,
  ScpBallot,
  ScpEnvelope,
  ScpStatementConfirm,
  ScpStatementExternalize,
  ScpStatementPrepare,
  Value,
} from "ts-stellar-xdr/lib/allTypes";

export function orderMessages(
  ledgerScpMessages: LedgerScpMessages
): ScpEnvelope[] {
  const orderedLedgerScpMessages = [...ledgerScpMessages.messages];
  orderedLedgerScpMessages.sort(compareScpEnvelopes);

  return orderedLedgerScpMessages;
}

function compareScpEnvelopes(
  { statement: { pledges: a } }: ScpEnvelope,
  { statement: { pledges: b } }: ScpEnvelope
): number {
  if (a.type === "scpStNominate" || b.type === "scpStNominate")
    throw new Error("Can't order nominate messages");

  if (a.type === "scpStPrepare" && b.type === "scpStPrepare")
    return compareScpStatementPrepares(a.value, b.value);
  if (a.type === "scpStConfirm" && b.type === "scpStConfirm")
    return compareScpStatementConfirms(a.value, b.value);
  if (a.type === "scpStExternalize" && b.type === "scpStExternalize")
    return compareScpStatementExternalizes(a.value, b.value);

  if (a.type === "scpStPrepare") return -1;
  if (b.type === "scpStPrepare") return 1;
  if (a.type === "scpStConfirm") return -1;
  return 1;
}

function compareScpStatementPrepares(
  a: ScpStatementPrepare,
  b: ScpStatementPrepare
): number {
  let ballotDifference = compareScpBallot(a.ballot, b.ballot);
  if (ballotDifference !== 0) return ballotDifference;

  ballotDifference = compareScpBallot(a.prepared, b.prepared);
  if (ballotDifference !== 0) return ballotDifference;

  ballotDifference = compareScpBallot(a.preparedPrime, b.preparedPrime);
  if (ballotDifference !== 0) return ballotDifference;

  const aH: ScpBallot = { counter: a.nH, value: a.ballot.value };
  const bH: ScpBallot = { counter: b.nH, value: b.ballot.value };

  return compareScpBallot(aH, bH);
}

function compareScpStatementConfirms(
  a: ScpStatementConfirm,
  b: ScpStatementConfirm
): number {
  let ballotDifference = compareScpBallot(a.ballot, b.ballot);
  if (ballotDifference !== 0) return ballotDifference;

  const aPrepared: ScpBallot = { counter: a.nPrepared, value: a.ballot.value };
  const bPrepared: ScpBallot = { counter: b.nPrepared, value: b.ballot.value };

  ballotDifference = compareScpBallot(aPrepared, bPrepared);
  if (ballotDifference !== 0) return ballotDifference;

  const aH: ScpBallot = { counter: a.nH, value: a.ballot.value };
  const bH: ScpBallot = { counter: b.nH, value: b.ballot.value };

  return compareScpBallot(aH, bH);
}

function compareScpStatementExternalizes(
  a: ScpStatementExternalize,
  b: ScpStatementExternalize
): number {
  return 0;
}

function compareScpBallot(
  a: ScpBallot | undefined,
  b: ScpBallot | undefined
): number {
  if (a === undefined || b === undefined) {
    if (b !== undefined) {
      return -1;
    }

    if (a !== undefined) {
      return 1;
    }

    return 0;
  }

  if (a.counter < b.counter) return -1;
  if (a.counter > b.counter) return 1;

  const aValueString = valueToString(a.value);
  const bValueString = valueToString(b.value);

  if (aValueString < bValueString) return -1;
  if (aValueString > bValueString) return 1;

  return 0;
}

function valueToString(value: Value): string {
  const uint8Array = new Uint8Array(value);
  let valueString = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    valueString += uint8Array[i].toString(16).padStart(2, "0");
  }

  return valueString;
}
