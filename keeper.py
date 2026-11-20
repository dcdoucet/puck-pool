"""Always-on pool keeper (GitHub scheduled jobs are unreliable, so this loops and re-launches itself).
- every 5 min: archive picks from ntfy (it only caches 12h), save scores.json, capture pregame odds, commit
- Saturday game window: poll NHL every 20s and push changed games to the live ntfy topic
- after ~5.6h: dispatch a fresh run of itself, until Sunday morning."""
import json, os, subprocess, time, urllib.request, datetime
import nhl

TOPIC = "puckpool-614c7aa1d6ed"
LIVE = TOPIC + "-live"
UTC = datetime.timezone.utc
GAME_START = datetime.datetime(2026, 11, 21, 17, 30, tzinfo=UTC).timestamp()
GAME_END = datetime.datetime(2026, 11, 22, 8, 30, tzinfo=UTC).timestamp()
STOP = datetime.datetime(2026, 11, 22, 12, 0, tzinfo=UTC).timestamp()
BUDGET = int(os.environ.get("BUDGET_MIN") or 335) * 60
t0 = time.time()

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "puck-pool"}), timeout=25).read()

def sh(*a):
    return subprocess.run(a, capture_output=True, text=True)

def archive():
    try: old = json.load(open("picks.json"))
    except Exception: old = []
    seen = {e["id"]: e for e in old}
    for line in get(f"https://ntfy.sh/{TOPIC}/json?poll=1&since=all").decode().splitlines():
        try: e = json.loads(line)
        except Exception: continue
        if e.get("event") == "message": seen[e["id"]] = {"id": e["id"], "time": e["time"], "message": e["message"]}
    json.dump(sorted(seen.values(), key=lambda e: e["time"]), open("picks.json", "w"), indent=1)
    return len(seen)

def odds(scores):
    try: cur = json.load(open("odds.json"))
    except Exception: cur = {}
    d = json.loads(get("https://api-web.nhle.com/v1/partner-game/US/now"))
    src = (d.get("bettingPartner") or {}).get("name") or "sportsbook"
    for g in d.get("games", []):
        gid = str(g.get("gameId")); s = scores.get(gid)
        if not s or s["state"] not in ("FUT", "PRE"): continue
        ml = lambda t: next((o["value"] for o in (g.get(t) or {}).get("odds", []) if o.get("description") == "MONEY_LINE_2_WAY"), None)
        a, h = ml("awayTeam"), ml("homeTeam")
        if a is not None and h is not None and (cur.get(gid, {}).get("a"), cur.get(gid, {}).get("h")) != (a, h):
            cur[gid] = {"a": a, "h": h, "src": src, "at": d.get("lastUpdatedUTC", "")}
    json.dump(cur, open("odds.json", "w"), indent=1)

def commit():
    sh("git", "add", "picks.json", "scores.json", "odds.json")
    if sh("git", "diff", "--cached", "--quiet").returncode == 0: return
    sh("git", "commit", "-qm", "Sync picks and scores")
    for _ in range(3):
        if sh("git", "pull", "-q", "--rebase", "-X", "theirs", "origin", "main").returncode == 0 and sh("git", "push", "-q", "origin", "HEAD:main").returncode == 0: return
        time.sleep(5)
    print("push failed", flush=True)

sh("git", "config", "user.name", "sync-bot"); sh("git", "config", "user.email", "sync-bot@users.noreply.github.com")
last_sig, next_sync, scores, last_commit = {}, 0, {}, 0
while time.time() - t0 < BUDGET and time.time() < STOP:
    now = time.time()
    in_games = GAME_START <= now <= GAME_END
    if in_games or now >= next_sync:
        try: scores = nhl.fetch()
        except Exception as e: print("nhl fetch failed:", e, flush=True)
    if in_games and scores:
        changed = {k: v for k, v in scores.items() if nhl.sig(v) != last_sig.get(k)}
        if changed:
            try:
                body = json.dumps({"g": changed}, separators=(",", ":"))
                batches = [changed] if len(body) < 3500 else [{k: v} for k, v in changed.items()]
                for b in batches:
                    urllib.request.urlopen(urllib.request.Request(f"https://ntfy.sh/{LIVE}", data=json.dumps({"g": b}, separators=(",", ":")).encode(), method="POST"), timeout=20)
                    for k, v in b.items(): last_sig[k] = nhl.sig(v)
                print(time.strftime("%H:%M:%S"), "live:", {k: nhl.sig(v) for k, v in changed.items()}, flush=True)
            except Exception as e: print("live post failed:", e, flush=True)
    if now >= next_sync:
        try: print(time.strftime("%H:%M:%S"), "archived", archive(), "events", flush=True)
        except Exception as e: print("archive failed:", e, flush=True)
        if scores:
            try: old = json.load(open("scores.json"))
            except Exception: old = {}
            if {g: nhl.sig(v) for g, v in scores.items()} != {g: nhl.sig(v) for g, v in old.items() if "state" in v}:
                json.dump(scores, open("scores.json", "w"), separators=(",", ":"))
        try: odds(scores)
        except Exception as e: print("odds failed:", e, flush=True)
        if now - last_commit >= 600:
            commit(); last_commit = now
        next_sync = now + 300
    time.sleep(20 if in_games else 30)

if time.time() < STOP:
    r = sh("gh", "workflow", "run", "keeper.yml", "--ref", "main")
    print("relaunch:", r.returncode, r.stderr.strip(), flush=True)
