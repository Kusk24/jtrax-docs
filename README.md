# JTrax documentation vault

This repository holds the decisions, feature notes, and operating procedures shared by the JTrax school applications. Open the repository as an Obsidian vault to follow links between notes. Each application keeps its own setup and test instructions in its README.

## Find a note

From the repository root, generate the local index with `python3 _workspace/reindex.py` and open `INDEX.md`. The index is generated locally and excluded from Git. On GitHub, browse the directories directly.

| Directory | Contents |
| --- | --- |
| [Architecture](architecture) and [decisions](decisions) | System design, alternatives considered, and the reasons behind accepted decisions |
| [Features](features) and [bugs](bugs) | School workflows, implementation history, and known failure modes |
| [Operations](ops) | Deployment, backups, recovery, and support procedures |
| [Research](research) | Investigations and dated findings |

For production, start with the [Lightsail deployment](ops/jtrax-on-lightsail.md) and [Litestream restore procedure](ops/backups-with-litestream.md). For backend changes, see the [Gin and modular monolith decision](decisions/0009-gin-feature-packages.md).

## Contribute

Pull the latest `main` before editing this shared vault. Update the existing note when a workflow changes. Use the [templates](_templates) for new notes, link related decisions, and regenerate the index after adding or renaming a note. Keep credentials, student records, generated indexes, and personal Obsidian state out of commits.
