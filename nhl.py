"""Fetch Saturday's NHL scores in the compact shape the site uses."""
import json, time, urllib.request

DATE = "2026-11-21"

def fetch():
    req = urllib.request.Request(f"https://api-web.nhle.com/v1/score/{DATE}", headers={"User-Agent": "puck-pool"})
    d = json.load(urllib.request.urlopen(req, timeout=20))
    now = int(time.time() * 1000)
    out = {}
    for g in d.get("games", []):
        pd, ck = g.get("periodDescriptor") or {}, g.get("clock") or {}
        goals = [[x.get("teamAbbrev"), (x.get("name") or {}).get("default", ""), x.get("period"),
                  x.get("timeInPeriod"), x.get("awayScore"), x.get("homeScore"), x.get("strength", "")]
                 for x in (g.get("goals") or [])]
        out[str(g["id"])] = {
            "state": g.get("gameState"), "as": (g.get("awayTeam") or {}).get("score", 0) or 0,
            "hs": (g.get("homeTeam") or {}).get("score", 0) or 0, "period": pd.get("number", 0),
            "ptype": pd.get("periodType", ""), "clock": ck.get("timeRemaining", ""),
            "inter": bool(ck.get("inIntermission")), "goals": goals, "u": now}
    return out

def sig(x):
    st = {"CRIT": "LIVE", "OFF": "FINAL", "PRE": "FUT"}.get(x["state"], x["state"])
    return [st, x["as"], x["hs"], x["period"], len(x["goals"])]

if __name__ == "__main__":
    json.dump(fetch(), open("scores.json", "w"), separators=(",", ":"))
