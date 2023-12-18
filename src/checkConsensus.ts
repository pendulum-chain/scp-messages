import {
    EnvelopeType,
    Hash,
    LedgerScpMessages,
    ScpHistoryEntry,
    ScpHistoryEntryV0,
    ScpQuorumSet,
    ScpStatement,
    Uint32,
} from "ts-stellar-xdr/lib/allTypes";
import {keypair} from "ts-stellar-sdk";
import {orderMessages} from "./orderMessages";
import {createHash} from "node:crypto";
import {Unsigned} from "ts-stellar-xdr/lib/utils/int64";
import {KNOWN_VALIDATORS_ORG, printLedgerScpMessages, printScpHistoryEntry} from "./prettyPrints";

const BINARY_SCP_ENVELOPE_TYPE = EnvelopeType.toXdr("envelopeTypeScp");

export async function checkScpHistoryEntryConsensus(
    scpHistoryEntry: ScpHistoryEntry,
    expectedSequenceNumber: Uint32,
    networkPassphrase: string
): Promise<boolean> {
    if (scpHistoryEntry.type !== 0) throw new Error(`Unknown ScpHistoryEntry type ${scpHistoryEntry.type}`);
    try {
        await checkScpHistoryEntryV0Consensus(scpHistoryEntry.value, expectedSequenceNumber, networkPassphrase);
        return true;
    } catch (error) {
        console.log(`   ERROR: ledger ${scpHistoryEntry.value.ledgerMessages.ledgerSeq}: Consensus not found`);
        console.log(`   ${error}`);
        return false;
    }
}

async function checkScpHistoryEntryV0Consensus(
    scpHistoryEntryV0: ScpHistoryEntryV0,
    expectedSequenceNumber: Uint32,
    networkPassphrase: string
) {
    console.log(`ledger ${scpHistoryEntryV0.ledgerMessages.ledgerSeq}`);
    const {quorumSets, ledgerMessages} = scpHistoryEntryV0;

    const quorumSetLookup: Record<string, ScpQuorumSet> = {};
    quorumSets.forEach((quorumSet) => {
        const binaryQuorumSet = ScpQuorumSet.toXdr(quorumSet);
        const quorumSetHash = createHash("sha256").update(Buffer.from(binaryQuorumSet)).digest().buffer;
        const quorumSetHashString = stringifyHash(quorumSetHash);
        quorumSetLookup[quorumSetHashString] = quorumSet;
    });


    await validateLedgerMessages(ledgerMessages, expectedSequenceNumber, networkPassphrase);
    if (!checkConsensusMain(ledgerMessages, quorumSetLookup)) {
        throw new Error("Could not verify that consensus was found");
    }
    console.log(`    ledger ${scpHistoryEntryV0.ledgerMessages.ledgerSeq}: consensus found`);
}

function stringifyHash(hash: Hash): string {
    return Array.from(new Uint8Array(hash)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
}

function lookupQuorumSet(
    {pledges}: ScpStatement,
    quorumSetLookup: Record<string, ScpQuorumSet>
): ScpQuorumSet | undefined {
    let quorumHash: Hash;
    switch (pledges.type) {
        case "scpStPrepare":
            quorumHash = pledges.value.quorumSetHash;
            break;
        case "scpStConfirm":
            quorumHash = pledges.value.quorumSetHash;
            break;
        case "scpStExternalize":
            quorumHash = pledges.value.commitQuorumSetHash;
            break;
        case "scpStNominate":
            quorumHash = pledges.value.quorumSetHash;
            break;
    }

    const quorumHashString = stringifyHash(quorumHash);
    return quorumSetLookup[quorumHashString];
}

async function validateLedgerMessages(
    ledgerMessages: LedgerScpMessages,
    expectedSequenceNumber: Uint32,
    networkPassphrase: string
) {
    const {ledgerSeq, messages} = ledgerMessages;

    if (ledgerSeq !== expectedSequenceNumber) {
        throw new Error(
            `Archive entry for wrong sequence number (found: ${ledgerSeq}, expected: ${expectedSequenceNumber})`
        );
    }

    const networkId = createHash("sha256").update(networkPassphrase).digest().buffer;
    const expectedSequenceNumberUint64 = Unsigned.fromNumber(expectedSequenceNumber);

    messages.forEach(async (message) => {
        const {signature, statement} = message;
        const nodePublicKey = new keypair.PublicKey(statement.nodeId.value);
        const binaryStatement = ScpStatement.toXdr(statement);

        const signatureMaterial = Uint8Array.from([
            ...new Uint8Array(networkId),
            ...new Uint8Array(BINARY_SCP_ENVELOPE_TYPE),
            ...new Uint8Array(binaryStatement),
        ]);
        const signatureIsValid = await nodePublicKey.verifySignature(signatureMaterial, signature);
        if (!signatureIsValid) {
            throw new Error("Signature is invalid");
        }

        const {slotIndex} = statement;
        if (!slotIndex.equals(expectedSequenceNumberUint64)) {
            throw new Error(
                `Archive entry for wrong sequence number (found: ${slotIndex}, expected: ${expectedSequenceNumberUint64})`
            );
        }
    });
}

function stringifyPublicKey(rawPublicKey: ArrayBuffer) {
    return new keypair.PublicKey(rawPublicKey).getPublicKeyString();
}

function arrayBuffersAreEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) return false;

    let aArray = new Uint8Array(a);
    let bArray = new Uint8Array(b);
    for (let i = 0; i < aArray.length; i++) {
        if (aArray[i] !== bArray[i]) return false;
    }

    return true;
}

function checkConsensusMain(ledgerMessages: LedgerScpMessages, quorumSetLookup: Record<string, ScpQuorumSet>): boolean {
    const orderedLedgerMessages = orderMessages(ledgerMessages);
    orderedLedgerMessages.reverse();

    const externalizeMessage = orderedLedgerMessages[0];
    if (externalizeMessage === undefined || externalizeMessage.statement.pledges.type !== "scpStExternalize") {
        throw new Error("No externalize message in history archive found");
    }

    const quorumSetsByNode: Record<string, ScpQuorumSet> = {};
    orderedLedgerMessages.forEach(({statement}) => {
        const nodeAddress = stringifyPublicKey(statement.nodeId.value);
        if (quorumSetsByNode[nodeAddress] === undefined) {
            const quorumSet = lookupQuorumSet(statement, quorumSetLookup);
            if (quorumSet === undefined) {
                throw new Error("Unknown preimage for quorum set hash");
            }
            quorumSetsByNode[nodeAddress] = quorumSet;
        }
    });

    const externalizedValue = externalizeMessage.statement.pledges.value.commit.value;
    const minBallotNumber = externalizeMessage.statement.pledges.value.commit.counter;
    let maxBallotNumber = minBallotNumber;

    let uniquenH: number | undefined = undefined;
    orderedLedgerMessages.forEach(({statement}) => {
        const {pledges} = statement;
        let value: ArrayBuffer | undefined = undefined;
        let nH: number | undefined = undefined;
        switch (pledges.type) {
            case "scpStExternalize":
                value = pledges.value.commit.value;
                nH = pledges.value.nH;
                break;
            case "scpStConfirm":
                value = pledges.value.ballot.value;
                nH = pledges.value.nH;
                break;
        }

        if (value !== undefined && !arrayBuffersAreEqual(value, externalizedValue)) {
            throw new Error(
                `There are SCP messages for conflicting values: ${new Uint8Array(value)}, ${new Uint8Array(externalizedValue)}`
            );
        }

        if (nH !== undefined) {
            if (uniquenH === undefined) {
                uniquenH = nH;
            } else if (uniquenH !== nH) {
                // throw new Error(`There are SCP messages with different nH values: ${nH}, ${uniquenH}`);
            }
        }
    });

    orderedLedgerMessages.forEach(({statement: {pledges}}) => {
        if (pledges.type === "scpStConfirm") {
            maxBallotNumber = Math.max(maxBallotNumber, pledges.value.nH);
        }
        if (pledges.type === "scpStExternalize") {
            maxBallotNumber = Math.max(maxBallotNumber, pledges.value.commit.counter);
        }
    });

    for (let ballotNumber = minBallotNumber; ballotNumber <= maxBallotNumber; ballotNumber++) {
        let confirmingNodes = new Set<string>();
        orderedLedgerMessages.forEach(({statement}) => {
            const {pledges} = statement;
            let nodeAccepts = false;
            switch (pledges.type) {
                case "scpStExternalize":
                    if (pledges.value.commit.counter <= ballotNumber) nodeAccepts = true;
                    break;
                case "scpStConfirm":
                    if (pledges.value.nCommit <= ballotNumber && ballotNumber <= pledges.value.nH) nodeAccepts = true;
                    break;
            }

            if (nodeAccepts) {
                const nodeAccountId = stringifyPublicKey(statement.nodeId.value);
                confirmingNodes.add(nodeAccountId);
            }
        });

        // if (containsQuorum(confirmingNodes, quorumSetsByNode)) {
        if (palletConsensusCheck(confirmingNodes)) {
            return true;
        } else {
            printLedgerScpMessages(ledgerMessages)
        }
    }

    return false;
}

// This function simulates the consensus check that is done by the stellar-relay pallet
function palletConsensusCheck(nodeSet: Set<string>): boolean {
    // Calculate the total validator count for each organization
    let totalOrganizations: Record<string, number> = {};
    for (const [_, value] of Object.entries(KNOWN_VALIDATORS_ORG)) {
        if (totalOrganizations[value] !== undefined) {
            totalOrganizations[value] += 1;
        } else {
            totalOrganizations[value] = 1;
        }
    }


    // Iterate over all items in the KNOWN_VALIDATORS_ORG Record<string, string>
    let targetedOrganizations: Record<string, number> = {};
    nodeSet.forEach((node) => {
        for (const [key, value] of Object.entries(KNOWN_VALIDATORS_ORG)) {
            if (node === key) {
                if (targetedOrganizations[value] !== undefined) {
                    targetedOrganizations[value] += 1;
                } else {
                    targetedOrganizations[value] = 1;
                }
            }
        }
         // Reject if node is not in KNOWN_VALIDATORS_ORG
        if (!Object.keys(KNOWN_VALIDATORS_ORG).includes(node)){
            throw new Error(`Node ${node} is not in KNOWN_VALIDATORS_ORG`)
        }
    });

    // Check if at least 2/3 of organizations are targeted
    let targetedOrganizationsCount = Object.keys(targetedOrganizations).length;
    if (targetedOrganizationsCount < 5) {
        return false
    }

    // Check if at least 2/3 of organizations are contained with at least
    let counter = 0;
    for (const [org, count] of Object.entries(targetedOrganizations)) {
        const total = totalOrganizations[org] || 0;
        if (count * 2 > total) {
            counter += 1;
        }
        else {
            console.log("org", org, "count", count, "total", total)
        }
    }

    console.log("counter", counter, "targetedOrganizationsCount", targetedOrganizationsCount)
    if (counter < 5) {
        return false
    }


    return true
}

// checks whether the nodeSet contains a quorum
// method: strip away nodes that could definitely not belong to such a quorum
//         then check whether nodes remain -> they will then be such a quorum
function containsQuorum(nodeSet: Set<string>, quorumSetsByNode: Record<string, ScpQuorumSet>): boolean {
    while (true) {
        const newNodeSet: Set<string> = new Set();
        for (const node of nodeSet.values()) {
            const nodeQuorumSet = quorumSetsByNode[node];
            if (nodeQuorumSet === undefined) {
                throw new Error(`Unknown quorum set of node ${node}`);
            }
            if (containsQuorumSlice(nodeSet, nodeQuorumSet)) {
                newNodeSet.add(node);
            }
        }

        if (newNodeSet.size === nodeSet.size) {
            break;
        }
        nodeSet = newNodeSet;
    }
    return nodeSet.size > 0;
}

// checks whether one of the quorum slices defined by the quorumSet is fully contained in the nodeSet
function containsQuorumSlice(nodeSet: Set<string>, quorumSet: ScpQuorumSet): boolean {
    const containedNodes = quorumSet.validators.filter((validator) =>
        nodeSet.has(stringifyPublicKey(validator.value))
    ).length;

    const containedSubQuorumSets = quorumSet.innerSets.filter((subQuorumSet) =>
        containsQuorumSlice(nodeSet, subQuorumSet)
    ).length;

    return containedNodes + containedSubQuorumSets >= quorumSet.threshold;
}
