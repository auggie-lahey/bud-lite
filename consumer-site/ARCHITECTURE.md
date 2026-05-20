# nostr-archive: Architecture

## Overview

A decentralized archival system where each user maintains a **personal archive** stored on Blossom and indexed via Nostr events. Group archives emerge as curated subsets of personal archives, governed by decentralized lists (DLists) with community voting.

**No server required.** Everything runs in the browser via NIP-07 signing + Blossom uploads + relay publishing.

## Current State (v0.1)

- Consumer site is a vanilla JS overlay on an existing SPA
- Upload flow: browser uploads to Blossom, publishes kind:1115 bridge + kind:1116 index events
- Folder structure managed via NIP-34 GRASP patches (kind:1617) — this is being replaced
- Settings stored in localStorage
- NIP-07 extension handles signing (nos2x, Alby, etc.)

## NIP-5A: Nsite Manifests (replacing GRASP)

Instead of git repos + NIP-34 patches, archive structure is stored as **kind:35128 nsite manifest events**.

### Why NIP-5A instead of GRASP

| GRASP (NIP-34) | Nsite (NIP-5A) |
|---|---|
| Requires git operations | Pure nostr events |
| Needs ngit CLI or server | Browser-native |
| Patch merge needs daemon | Replaceable event, latest wins |
| File tree = git working tree | File tree = `path` tags |
| Complex multi-step commits | Single event publish |

### How it works

Each user publishes a **kind:35128** (addressable) manifest event:

```
kind: 35128
d-tag: "archive" (or user-chosen identifier)
tags:
  ["path", "/research/paper.pdf", "<blossom-sha256>"]
  ["path", "/maps/sf-local.png", "<blossom-sha256>"]
  ["path", "/audio/podcast-ep1.mp3", "<blossom-sha256>"]
  ["server", "https://blossom.primal.net"]
  ["title", "My Archive"]
  ["x", "<aggregate-hash>", "aggregate"]
content: JSON with metadata per path (titles, summaries, timestamps, topics)
```

**Replaceable semantics**: publishing a new manifest with the same `d` tag replaces the old one. The entire folder tree is in one event.

### Aggregate hash

Computed deterministically from `path` tags:
1. For each path tag: `<sha256> <absolute-path>\n`
2. Sort lines lexicographically
3. SHA-256 the concatenated lines
4. Store as `["x", "<hash>", "aggregate"]`

Enables version change detection without comparing full events.

### Content field

The manifest `content` is JSON with per-path metadata:

```json
{
  "schema": "nostr-archive/v1",
  "entries": {
    "/research/paper.pdf": {
      "title": "Attention Is All You Need",
      "summary": "Transformer architecture paper",
      "added": 1715673600,
      "source": { "kind": "document/pdf", "url": "https://arxiv.org/abs/1706.03762" },
      "topics": ["AI", "research", "transformers"],
      "bridge_event_id": "abc123...",
      "index_event_id": "def456...",
      "mime": "application/pdf",
      "size": 543210
    },
    "/maps/sf-local.png": {
      "title": "SF Bay Trail Map",
      "added": 1715673700,
      "source": { "kind": "image", "url": "https://example.com/map" },
      "topics": ["maps", "local", "sf-bay"],
      "bridge_event_id": "789abc...",
      "index_event_id": "012def...",
      "mime": "image/png",
      "size": 1234567
    }
  }
}
```

### Upload flow (new)

1. User selects file or enters URL
2. Browser uploads to Blossom → gets sha256
3. Browser queries relays for existing kind:35128 manifest (user's pubkey + d:archive)
4. If exists, parse current manifest content + path tags
5. Add new path entry to manifest
6. Compute aggregate hash
7. Sign updated manifest via NIP-07
8. Publish to relays (replaces old manifest)
9. Also publish kind:1115 bridge + kind:1116 index events (unchanged)

### Reading the archive

1. Query relays: `{ kinds: [35128], authors: [<pubkey>], "#d": ["archive"], limit: 1 }`
2. Parse `path` tags → folder tree
3. Parse `content` JSON → metadata per item
4. Render tree with titles, sizes, dates

---

## Personal vs Group Archives

### Personal Archive

- Lives under user's own pubkey
- Signed by user's NIP-07 key
- All items visible at `/npub1user...`
- Some items may be private (future: NIP-44 encryption)

### Group Archive (via DLists)

Group archive = decentralized list that references items from members' personal archives.

```
User personal archive (kind:35128, signed by user)
    │
    ├── /research/paper.pdf → shared to group
    ├── /maps/sf-local.png → NOT shared (personal only)
    └── /audio/podcast.mp3 → shared to group
            │
            ▼
DList (decentralized list, signed by list maintainer or contributors)
    │
    ├── entry: /research/paper.pdf (from user A) → 3 votes ✓ → canonical
    ├── entry: /audio/podcast.mp3 (from user A) → 1 vote → pending
    └── entry: /video/tutorial.mp4 (from user B) → 0 votes → pending
```

### Voting flow

1. User shares item from personal archive to DList
2. Item enters "pending" state
3. Other group members upvote/downvote
4. At threshold (e.g., 2 upvotes), item becomes "canonical" group content
5. Downvotes can remove items

### Group archive URL

```
/npub1user...           → user's full personal archive
/naddr1...              → group archive (DList)
                          shows: canonical items + pending items with vote buttons
```

---

## DList Integration Roadmap

### What DLists need to provide

DLists are a work-in-progress by other devs. When ready, they'll need:

1. **List event format**: likely an addressable event (kind TBD) with entries referencing:
   - Source pubkey
   - Path within source's manifest
   - Optional: blossom sha256 for independent verification

2. **Vote events**: kind for upvote/downvote on list entries, with:
   - Reference to list (a tag)
   - Reference to specific entry (e tag)
   - Vote value (+1 / -1)

3. **Membership**: who can vote — defined by list maintainer or open

### What we need to build when DLists land

#### 1. "Share to group" button in personal archive UI
- On each item in personal archive, add "Share" action
- Opens group selector (which DList to share to)
- Publishes a list entry event referencing the item

#### 2. Group archive page at `/naddr1...`
- Query the DList for entries
- For each entry, look up source manifest + path metadata
- Display in two sections:
  - **Canonical** (meets vote threshold)
  - **Pending** (below threshold, with vote buttons)

#### 3. Vote UI
- Upvote/downvote buttons on pending items
- Publishes vote events to relays
- Real-time count via relay subscription

#### 4. RAG/Qdrant integration
- Index all canonical group items
- Use topic tags, location tags for retrieval filtering
- Per-item metadata from manifest content JSON

### Data flow for group sharing

```
User A's browser:
  1. Read personal manifest (kind:35128)
  2. Select item /research/paper.pdf
  3. Publish list entry: { source: userA_pubkey, path: "/research/paper.pdf", list: group_naddr }
  4. Relays store entry

User B's browser:
  1. Navigate to /naddr1_group_list
  2. Query list entries
  3. See User A's item as "pending"
  4. Click upvote → publish vote event
  5. Count reaches threshold → item moves to "canonical"
```

### Estimated integration effort

| Component | Effort | Dependencies |
|-----------|--------|-------------|
| Share button in personal UI | Small | DList spec finalized |
| Group archive page | Medium | DList spec + vote format |
| Vote UI + counting | Medium | Vote event spec |
| RAG indexing pipeline | Large | Group archive working + vector DB setup |

---

## Event Types Summary

| Kind | Type | Purpose |
|------|------|---------|
| 35128 | Addressable | Nsite manifest — personal archive folder tree |
| 1115 | Regular | Bridge event — links blobs to archive item |
| 1116 | Regular | Index event — searchable metadata for one item |
| 10625 | Replaceable | Archiver root — discovery (optional, for server-side) |
| 1621 | Regular | Issue — flag URL for archiving (current "Flag URL" feature) |
| TBD | Addressable | DList — group archive membership + entries |
| TBD | Regular | Vote — upvote/downvote on DList entries |

---

## File Structure (consumer-site)

```
consumer-site/
  index.html          — SPA overlay with all browser-side logic
  ARCHITECTURE.md     — this file
```

All logic is inline in `index.html` (vanilla JS, no build step). Future: extract into modules.
