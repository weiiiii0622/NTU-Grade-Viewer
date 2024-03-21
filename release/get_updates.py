import os
import sys

version = sys.argv[1]

# version = "1.0.2"
history = open("./release/HISTORY.md", encoding="utf-8").read()

st = history.index("##")
end = history[st + 1 :].index("##")
updates = history[st:end]
assert updates.startswith(f"## v{version}"), "Version doesn't match!"

with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
    f.write(f"updates={ updates }")
