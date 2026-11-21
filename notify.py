"""Push new Puck Pool Reports to the organizer's phone via the ntfy app (topic puckpool-614c7aa1d6ed-me)."""
import json, subprocess, sys, urllib.request
TOPIC = "puckpool-614c7aa1d6ed-me"
SITE = "https://dcdoucet.github.io/puck-pool/"

def push(title, body, click):
    req = urllib.request.Request(f"https://ntfy.sh/{TOPIC}", data=body.encode(), method="POST",
                                 headers={"Title": title, "Click": click, "Tags": "ice_hockey"})
    urllib.request.urlopen(req, timeout=20)

if len(sys.argv) > 1 and sys.argv[1] == "test":
    push("Puck Pool", "✅ Test: Puck Pool Reports will show up here.\n" + SITE, SITE); sys.exit()

cur = json.load(open("news.json"))
try: prev = json.loads(subprocess.run(["git", "show", "HEAD~1:news.json"], capture_output=True, text=True, check=True).stdout)
except Exception: prev = cur
old = {n["id"] for n in prev}
for n in cur:
    if n["id"] not in old:
        link = SITE
        push("Puck Pool Report", f"🏒 {n['h']}\n{link}", link)
        print("pushed", n["id"], n["h"])
