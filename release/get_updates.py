import os
import re
import sys

version = sys.argv[1]

history = open("./release/HISTORY.md", encoding="utf-8").read()

st = history.index("## v")
end = history[st + 1 :].index("## v")
updates = history[st:end]
assert updates.startswith(f"## v{version}"), "Version doesn't match!"

if os.getenv("MODE") == "TEXT":
    updates_ln = updates.splitlines()
    pattern = re.compile(r"(#+\s+)|(-\s+)|(\*\s+)")

    # todo: add emoji?
    def remove_syntax(ln: str):
        return pattern.sub("", ln)

    updates = "".join(map(remove_syntax, updates_ln))


with open(os.getenv("GITHUB_OUTPUT", ""), "a", encoding="utf-8") as f:
    f.write(f"updates<<EOF\n{ updates }\nEOF")
