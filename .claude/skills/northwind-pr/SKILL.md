---
name: northwind-pr
description: Write a pull request description for a Northwind Payments ticket in the team's required format. Use when the user asks to write, draft, or open a PR description, or invokes /northwind-pr.
---

# /northwind-pr

Write a pull request description for a Northwind Payments ticket. Read the actual state of the branch before writing a word. Never fill in a section by guessing.

## 1. Gather the facts

Run these in order. Do not skip any.

```bash
git branch --show-current          # derive the ticket ID from the branch name
git log main..HEAD --oneline       # what was committed and in what order
git diff main...HEAD --stat        # which files changed and by how much
git diff main...HEAD               # the full diff — read it before writing
```

Derive the ticket ID from the branch name: `NWP-101-export-options` → `NWP-101`.

Read the ticket at `docs/tickets/<TICKET-ID>.md`. If it does not exist, say so and stop — the acceptance criteria section cannot be filled without it.

If a spec exists at `docs/specs/<TICKET-ID>-*.md`, read it and note where the build departed from the plan.

## 2. Write the description

Use exactly these five sections. No placeholders, no `<!-- comments -->` left behind.

---

**Title (for the PR, not in the body):** `<TICKET-ID>: <what it does in plain language>`

---

### Ticket

`Closes <TICKET-ID>`

### What changed

One paragraph. What can the app do now that it could not before? Do not list files — the diff already does that. Write for a reviewer who has not seen the ticket.

### How I verified it

List only the verification steps that were actually performed in this session. For each one, name the command and paste or describe the output:

- `npm test` — state the number of passing tests and, if new tests were added, name what they cover.
- Browser: name the URL visited, what you clicked, and what appeared on screen.
- Manual API test: name the request and the response.

If a step in the template checklist was not completed, leave its checkbox unchecked and say why (e.g. "dev server not started — Node.js was installed after the build").

**Do not write that you ran something you did not run.** A reviewer who finds an invented verification step loses trust in the whole description.

The template checkboxes to include:
- [ ] `npm test` passes
- [ ] New behavior is covered by a test
- [ ] Checked it in the browser

### Acceptance criteria

Copy the checkboxes from the ticket verbatim. Tick each one that is fully met. For any criterion that is partially met, tick it and add a one-line note on which half is done. Leave unchecked anything that is not done, and say so plainly — the reviewer will find it either way.

### Deliberately not done

List anything that is intentionally out of scope for this PR: stretch goals from the ticket, follow-up tickets, known rough edges, tests that were not written. A stated limit is not a weakness; an unstated one discovered in review is.

If nothing was left out, write: *Nothing — all acceptance criteria are met.*

---

## 3. Offer to open the PR

Print the finished description. Then offer to run:

```bash
gh pr create \
  --repo tenex-labs/anthropic-claude-code-training-public \
  --base main \
  --head "<login>:<branch>" \
  --title "<TICKET-ID>: <what it does>" \
  --body-file <tempfile>
```

Ask before running it. Opening a PR is the user's decision.

## Rules

- **Read before writing.** Every claim in the description must be traceable to the diff, the ticket, or a command output from this session.
- **Plain language.** "Ops can now pick which columns to export" beats "implemented column selection functionality."
- **No invented verification.** This is the rule that matters most. If it is not in the session history, it is not in the description.
- **Partial is honest; missing is not.** A half-done criterion stated clearly scores better than one silently skipped.
- **No emoji, no filler, no summary of the summary.**
