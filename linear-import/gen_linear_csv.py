#!/usr/bin/env python3
"""Parse the approved backlog plan and emit one Linear-import CSV per project."""
import csv
import re
import sys
from pathlib import Path

PLAN = Path("/home/noel-vega/.claude/plans/with-the-current-state-recursive-raven.md")
OUT = Path("/tmp/claude-1000/-home-noel-vega-github-com-noel-vega-ordersail/"
           "ba98a444-49d9-4ce8-abac-422650c875c1/scratchpad/linear-import")

PROJECTS = {
    "Production readiness",
    "Observability & alerting",
    "Payments & billing",
    "Merchant dashboard & onboarding",
    "Storefront customer experience",
    "POS in-store operations",
    "Marketing site",
}
PRIORITY = {"P0": "High", "P1": "Medium", "P2": "Low"}

issue_re = re.compile(r"^\d+\.\s+\[(P[012])\]\s+(.*)$")

def main():
    lines = PLAN.read_text().splitlines()
    project = None
    milestone = None
    in_part2 = False
    rows = {p: [] for p in PROJECTS}

    for line in lines:
        if line.strip() == "## Part 2 — Per-project backlogs":
            in_part2 = True
            continue
        if line.startswith("## Part 3"):
            break
        if not in_part2:
            continue

        if line.startswith("## "):
            name = line[3:].strip()
            project = name if name in PROJECTS else None
            milestone = None
            continue
        if line.startswith("### "):
            milestone = line[4:].strip().lstrip("#").strip()
            continue

        m = issue_re.match(line.strip())
        if not m or project is None:
            continue

        prio_tag, rest = m.group(1), m.group(2).strip()
        # split "title ... · label1, label2" on the LAST ' · '
        if " · " in rest:
            title, labels_raw = rest.rsplit(" · ", 1)
        else:
            title, labels_raw = rest, ""
        title = title.strip()
        labels = [l.strip() for l in labels_raw.split(",") if l.strip()]

        desc = (f"Milestone: {milestone}\n\n"
                f"Seed issue from the launch backlog plan. Flesh out using the "
                f"Feature/Bug template before starting.")

        rows[project].append({
            "Title": title,
            "Description": desc,
            "Priority": PRIORITY[prio_tag],
            "Labels": ",".join(labels),
            "Project": project,
            "Milestone": milestone.split(" — ")[0] if " — " in milestone else milestone,
        })

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for project, items in rows.items():
        slug = re.sub(r"[^a-z0-9]+", "-", project.lower()).strip("-")
        path = OUT / f"{slug}.csv"
        with path.open("w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["Title", "Description", "Priority", "Labels", "Project", "Milestone"])
            w.writeheader()
            w.writerows(items)
        total += len(items)
        print(f"{project:16} {len(items):3}  -> {path}")
    print(f"\nTotal issues: {total}")

if __name__ == "__main__":
    sys.exit(main())
