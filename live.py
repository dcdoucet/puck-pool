"""Saturday live relay: poll the NHL every 20s and push changed games to ntfy so phones see goals fast.
Only sends on real events (game start, goal, period change, final) to stay under ntfy's free limits."""
import json, os, time, urllib.request
import nhl

TOPIC = "puckpool-614c7aa1d6ed-live"
BUDGET = int(os.environ.get("BUDGET_MIN") or 350) * 60
start, last = time.time(), {}

def post(games):
    body = json.dumps({"g": games}, separators=(",", ":")).encode()
    urllib.request.urlopen(urllib.request.Request(f"https://ntfy.sh/{TOPIC}", data=body, method="POST"), timeout=20)

while time.time() - start < BUDGET:
    try:
        cur = nhl.fetch()
    except Exception as e:
        print("fetch failed:", e); time.sleep(20); continue
    changed = {k: v for k, v in cur.items() if nhl.sig(v) != last.get(k)}
    if changed:
        batches = [changed] if len(json.dumps(changed)) < 3500 else [{k: v} for k, v in changed.items()]
        for b in batches:
            try:
                post(b)
                for k, v in b.items(): last[k] = nhl.sig(v)
                print(time.strftime("%H:%M:%S"), "sent", ", ".join(f"{k}:{nhl.sig(v)}" for k, v in b.items()), flush=True)
            except Exception as e:
                print("post failed:", e, flush=True)
    if cur and all(v["state"] in ("FINAL", "OFF") for v in cur.values()):
        print("all final"); break
    time.sleep(20)
