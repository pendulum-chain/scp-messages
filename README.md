# Analyze SCP Messages

This tool downloads the SCP (Stellar Consensus Protocol) messages from the history archive and

- displays them nicely and makes the use of the SCP more obvious
- analyzes the SCP messages to check whether consensus has been reached (using the definition of SCP)

## How to use

1. Edit `config.json` to set

- the ledger number to start scanning (scanning happens in reverse order from later ledgers to earlier ledgers)
- the operation mode: either "consensus-check" to check whether consensus can be determined from the archive messages or "display" to display the archive messages
- the archive: either "stellar" or "satoshipay" – determines what archvie to use

2. Run `npm start`

## Examples

Two examples outputs:

```
LEDGER 46515656
ScpQuorumSets
  Quorum Set
    threshold: 5
    inner quorum set:
        threshold: 2
        validators: BlockDaemon1 BlockDaemon2 BlockDaemon3
    inner quorum set:
        threshold: 2
        validators: SDF3 SDF1 SDF2
    inner quorum set:
        threshold: 2
        validators: Coinqvest2 Coinqvest3 Coinqvest1
    inner quorum set:
        threshold: 2
        validators: SatoshiPay3 SatoshiPay2 SatoshiPay1
    inner quorum set:
        threshold: 2
        validators: FranklinTempleton1 FranklinTempleton3 FranklinTempleton2
    inner quorum set:
        threshold: 3
        validators: Lobster5 Lobster4 Lobster1 Lobster2 Lobster3
    inner quorum set:
        threshold: 2
        validators: PublicNode1 PublicNode3 PublicNode2
LedgerScpMessages (22)
  Prepare message from Lobster5
    quorumSet: quorumHash1
    b = (1, value1), p = (0, ⊥), p' = (0, ⊥), c.n = 0, h.n = 0
  Prepare message from BlockDaemon3
    quorumSet: quorumHash1
    b = (1, value1), p = (0, ⊥), p' = (0, ⊥), c.n = 0, h.n = 0
  Prepare message from PublicNode3
    quorumSet: quorumHash1
    b = (1, value1), p = (0, ⊥), p' = (0, ⊥), c.n = 0, h.n = 0
  Prepare message from Lobster4
    quorumSet: quorumHash1
    b = (1, value1), p = (1, value1), p' = (0, ⊥), c.n = 0, h.n = 0
  Prepare message from BlockDaemon1
    quorumSet: quorumHash1
    b = (1, value1), p = (1, value1), p' = (0, ⊥), c.n = 1, h.n = 1
  Prepare message from SatoshiPay3
    quorumSet: quorumHash1
    b = (1, value1), p = (1, value1), p' = (0, ⊥), c.n = 1, h.n = 1
  Prepare message from BlockDaemon2
    quorumSet: quorumHash1
    b = (1, value1), p = (1, value1), p' = (0, ⊥), c.n = 1, h.n = 1
  Prepare message from SatoshiPay2
    quorumSet: quorumHash1
    b = (1, value1), p = (1, value1), p' = (0, ⊥), c.n = 1, h.n = 1
  Prepare message from SatoshiPay1
    quorumSet: quorumHash1
    b = (1, value1), p = (1, value1), p' = (0, ⊥), c.n = 1, h.n = 1
  Confirm message from SDF3
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from Coinqvest2
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from FranklinTempleton1
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from Coinqvest3
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from PublicNode1
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from Lobster1
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from SDF2
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from FranklinTempleton2
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from PublicNode2
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from Lobster3
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from Coinqvest1
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Confirm message from Lobster2
    quorumSet: quorumHash1
    b = (1, value1), p.n = 1, c.n = 1, h.n = 1
  Externalize message from SDF1
    quorumSet: quorumHash1
    c = (1, value1), h.n = 1
```

As well as

```
LEDGER 46516145
ScpQuorumSets
  Quorum Set
    threshold: 5
    inner quorum set:
        threshold: 2
        validators: BlockDaemon1 BlockDaemon2 BlockDaemon3
    inner quorum set:
        threshold: 2
        validators: SDF3 SDF1 SDF2
    inner quorum set:
        threshold: 2
        validators: Coinqvest2 Coinqvest3 Coinqvest1
    inner quorum set:
        threshold: 2
        validators: SatoshiPay3 SatoshiPay2 SatoshiPay1
    inner quorum set:
        threshold: 2
        validators: FranklinTempleton1 FranklinTempleton3 FranklinTempleton2
    inner quorum set:
        threshold: 3
        validators: Lobster5 Lobster4 Lobster1 Lobster2 Lobster3
    inner quorum set:
        threshold: 2
        validators: PublicNode1 PublicNode3 PublicNode2
LedgerScpMessages (23)
  Prepare message from PublicNode3
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 0, h.n = 0
  Prepare message from Lobster5
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 0, h.n = 1
  Prepare message from Lobster4
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 0, h.n = 1
  Prepare message from BlockDaemon3
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 0, h.n = 1
  Prepare message from FranklinTempleton3
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 2, h.n = 2
  Prepare message from BlockDaemon1
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 2, h.n = 2
  Prepare message from SatoshiPay3
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 2, h.n = 2
  Prepare message from BlockDaemon2
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 2, h.n = 2
  Prepare message from SatoshiPay2
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 2, h.n = 2
  Prepare message from SatoshiPay1
    quorumSet: quorumHash1
    b = (2, value1), p = (2, value1), p' = (0, ⊥), c.n = 2, h.n = 2
  Confirm message from SDF3
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from Coinqvest2
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from FranklinTempleton1
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from Coinqvest3
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from PublicNode1
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from Lobster1
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from SDF2
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from FranklinTempleton2
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from PublicNode2
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from Lobster3
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from Coinqvest1
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Confirm message from Lobster2
    quorumSet: quorumHash1
    b = (2, value1), p.n = 2, c.n = 2, h.n = 2
  Externalize message from SDF1
    quorumSet: quorumHash1
    c = (2, value1), h.n = 2
```
