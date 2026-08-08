# Live progress bridge

The two repositories stay independent:

- `leetcode-progress` owns solutions, attempts, notes, traces, and their git history.
- `PLAYBOOK-theDSAEngine` owns curriculum, evidence rules, recommendations, training,
  and UI.

Their only live boundary is `leetcode-progress/progress.json`. Its `schemaVersion` is
currently `1.0.0`; `progress.schema.json` is the canonical JSON Schema. Playbook rejects
unknown schema versions and malformed hashes or provenance instead of silently importing
partial data.

## Update flow

1. A non-bot push lands in `leetcode-progress`.
2. `publish-progress.yml` scans actual solution files and full git history, writes and
   commits `progress.json`, then sends a `progress-updated` repository dispatch.
3. Playbook's `sync-progress.yml` checks out both repositories, imports only the contract,
   validates/typechecks/tests/builds the result, and commits
   `src/data/progress.generated.ts` when it changed.
4. That Playbook commit triggers the existing deployment rebuild. The coverage screen
   displays `Synced through commit abc1234 · 4 minutes ago` from contract provenance.

## One-time GitHub configuration

In `leetcode-progress`, create a fine-grained repository secret named
`PLAYBOOK_REPO_TOKEN`. Its token must be scoped to
`RaghhavMalani/PLAYBOOK-theDSAEngine` with repository **Contents: read and write**, which
allows the Repository Dispatch endpoint. The source repository's Actions settings must
also allow its standard `GITHUB_TOKEN` to write contents so the generated contract commit
can be pushed. Branch protection must permit the GitHub Actions bot commit, or the
publisher should be granted the corresponding bypass.

No token is copied into Playbook. Playbook's own workflow uses its scoped `GITHUB_TOKEN`
to commit the imported snapshot.

## Contract semantics

- A problem is solved only when its directory contains a recognized solution source
  (`.py`, `.cpp`, `.java`, `.js`, or `.c`). README/notes-only directories remain attempts
  in the raw repository and are not promoted to solved.
- `solutionHashes` maps each repository-relative source path to its current SHA-256.
- `lastSolvedAt` is the newest commit touching a solution file for that problem.
- `reSolveHistory` contains every later solution-touching commit after the initial solve,
  oldest first, with the languages touched by that commit.
- Trace availability recognizes normal generated traces, auto traces, and the legacy
  per-problem `visualization.html` location.

## Offline fallback

With both clones next to each other, run this from Playbook:

```bash
npm run sync:progress -- ../leetcode-progress
```

`scripts/sync-progress.mjs` asks the source repository's generator for an in-memory
contract and writes only Playbook's generated TypeScript snapshot. If local git history
cannot be read, it falls back to the source repository's committed `progress.json`. To
replay the exact committed live boundary explicitly, use:

```bash
npm run sync:progress:contract -- ../leetcode-progress/progress.json
```
