#!/usr/bin/env python3
"""Scoring: each game's pot = number of people who picked it, split evenly among those who picked the winner.
Pool snapshot for the group-text update. Prints JSON.
Usage: python3 report.py [--test picks.json scores.json]
Reads picks.json and scores.json from the GitHub repo via `gh api` (synced every 5 min)."""
import json, math, random, subprocess, sys, base64, hashlib, datetime, os

REPO = "dcdoucet/puck-pool"
G = [("2026020359","EDM","CAR","2026-11-21T18:00:00Z"),("2026020360","CHI","CGY","2026-11-21T20:30:00Z"),("2026020361","BUF","FLA","2026-11-21T23:00:00Z"),("2026020362","PIT","NSH","2026-11-21T23:00:00Z"),("2026020363","WSH","BOS","2026-11-22T00:00:00Z"),("2026020364","CBJ","TOR","2026-11-22T00:00:00Z"),("2026020365","PHI","MTL","2026-11-22T00:00:00Z"),("2026020366","LAK","OTT","2026-11-22T00:00:00Z"),("2026020367","NYI","DET","2026-11-22T00:00:00Z"),("2026020368","NJD","STL","2026-11-22T00:00:00Z"),("2026020369","VGK","WPG","2026-11-22T00:00:00Z"),("2026020370","ANA","UTA","2026-11-22T02:00:00Z"),("2026020371","MIN","VAN","2026-11-22T03:00:00Z"),("2026020372","SEA","SJS","2026-11-22T03:00:00Z")]
START = {g[0]: datetime.datetime.fromisoformat(g[3].replace("Z","+00:00")).timestamp() for g in G}

MASCOTS = ['Raccoons','Flowers','Moose','Beavers','Geese','Lumberjacks','Owls','Bees','Donuts','Pickles','Yetis','Turtles']
def team(pid, p):
    x = 0
    for ch in pid: x = (x*31 + ord(ch)) & 0xFFFFFFFF
    m = p.get("mascot", x % len(MASCOTS))
    return p["name"] + ("'" if p["name"].lower().endswith("s") else "'s") + " " + MASCOTS[m]

def gh(path):
    out = subprocess.run(["gh","api",f"repos/{REPO}/contents/{path}","-q",".content"],capture_output=True,text=True,check=True).stdout
    return json.loads(base64.b64decode(out))

def players_from(events):
    P = {}
    for e in sorted(events, key=lambda e: e["time"]):
        try: m = json.loads(e["message"])
        except Exception: continue
        if not isinstance(m, dict) or not isinstance(m.get("p"), str): continue
        if m.get("t") == "x": P.pop(m["p"], None)
        elif m.get("t") == "m" and m["p"] in P and isinstance(m.get("m"), int) and 0 <= m["m"] < len(MASCOTS): P[m["p"]]["mascot"] = m["m"]
        elif m.get("t") == "j" and m.get("n") and m["p"] not in P:
            P[m["p"]] = {"name": str(m["n"])[:16], "picks": {}}
        elif m.get("t") == "p" and m["p"] in P and m.get("g") in START and m.get("s") in ("A","H") and e["time"] < START[m["g"]]:
            P[m["p"]]["picks"][m["g"]] = m["s"]
    return P

def result(s):
    if not s or s.get("state") not in ("FINAL","OFF"): return None
    return "H" if s["hs"] > s["as"] else "A"

def pois(l):
    p, v = [], math.exp(-l)
    for k in range(16): p.append(v); v = v*l/(k+1)
    return p

def prior(o):
    if not o or o.get("a") is None or o.get("h") is None: return 0.54
    imp = lambda m: -m/(-m+100) if m < 0 else 100/(m+100)
    a, h = imp(o["a"]), imp(o["h"]); return h/(a+h)

def p_win(lead, lh, la, ot):
    ph, pa = pois(lh), pois(la); w = 0
    for i in range(16):
        for j in range(16):
            d = lead+i-j; w += ph[i]*pa[j]*(1 if d > 0 else ot if d == 0 else 0)
    return w

def p_home(s, o=None):
    """Pregame: sportsbook moneyline (vig removed). Live: goal rates fit to that line, run over time left."""
    p = prior(o)
    if not s or s.get("state") in (None,"FUT","PRE"): return p
    lead = s["hs"] - s["as"]
    if result(s): return 1.0 if lead > 0 else 0.0
    ot = .5 + (p-.5)*.4; lo, hi = .2, .8
    for _ in range(30):
        m = (lo+hi)/2
        if p_win(0, 6.2*m, 6.2*(1-m), ot) < p: lo = m
        else: hi = m
    per = s.get("period") or 1
    if per > 3: return 1.0 if lead > 0 else 0.0 if lead < 0 else ot
    try: mm, ss = (s.get("clock") or "10:00").split(":"); cl = int(mm) + int(ss)/60
    except Exception: cl = 10
    rem = (3-per)*20 + cl
    return p_win(lead, 6.2*lo*rem/60, 6.2*(1-lo)*rem/60, ot)

def american(p):
    if p >= 0.999: return "LOCK"
    if p <= 0.001: return "OFF THE BOARD"
    return f"-{round(100*p/(1-p))}" if p >= 0.5 else f"+{round(100*(1-p)/p)}"

def main():
    if "--test" in sys.argv:
        i = sys.argv.index("--test"); events = json.load(open(sys.argv[i+1])); scores = json.load(open(sys.argv[i+2])); odds = {}
    else:
        events, scores = gh("picks.json"), gh("scores.json")
        try: odds = gh("odds.json")
        except Exception: odds = {}
    P = players_from(events)
    ids = list(P)
    def tally(out):  # out: gid -> 'A'/'H' for decided games; pot = pickers, split among winners
        t = {pid: 0.0 for pid in ids}
        for gid, r in out.items():
            who = [pid for pid in ids if P[pid]["picks"].get(gid)]
            w = [pid for pid in who if P[pid]["picks"][gid] == r]
            for pid in w: t[pid] += len(who)/len(w)
        return t
    decided = {g[0]: result(scores.get(g[0])) for g in G if result(scores.get(g[0]))}
    pts = tally(decided)
    mx = dict(pts)
    for g in G:
        if g[0] in decided: continue
        who = [pid for pid in ids if P[pid]["picks"].get(g[0])]
        for pid in who:
            mx[pid] += len(who)/sum(1 for x in who if P[x]["picks"][g[0]] == P[pid]["picks"][g[0]])
    probs = [(g[0], result(scores.get(g[0])), p_home(scores.get(g[0]), odds.get(g[0]))) for g in G]
    N, win = 20000, {pid: 0.0 for pid in ids}
    if ids:
        for _ in range(N):
            out = {gid: r or ("H" if random.random() < ph else "A") for gid, r, ph in probs}
            tot = tally(out)
            best = max(tot.values()); tops = [pid for pid in ids if abs(tot[pid] - best) < 1e-9]
            for pid in tops: win[pid] += 1/len(tops)
    games = []
    for g in G:
        s = scores.get(g[0]) or {}; r = result(s)
        a = [P[pid]["name"] for pid in ids if P[pid]["picks"].get(g[0]) == "A"]
        h = [P[pid]["name"] for pid in ids if P[pid]["picks"].get(g[0]) == "H"]
        st = "final" if r else "live" if s.get("state") in ("LIVE","CRIT") else "upcoming"
        games.append({"game": f"{g[1]} @ {g[2]}", "status": st, "score": f"{g[1]} {s.get('as',0)} - {g[2]} {s.get('hs',0)}" if st != "upcoming" else None,
                      "period": s.get("period") if st == "live" else None, "clock": s.get("clock") if st == "live" else None,
                      "winner": (g[2] if r == "H" else g[1]) if r else None, "home_win_chance": round(p_home(s, odds.get(g[0])),3), "moneyline": odds.get(g[0]),
                      "picked_" + g[1]: a, "picked_" + g[2]: h})
    stand = sorted(({"name": P[pid]["name"], "team": team(pid, P[pid]), "points": round(pts[pid],1), "max_possible": round(mx[pid],1), "win_chance": round(win[pid]/N,3) if ids else 0,
                     "odds": american(win[pid]/N) if ids else None, "picks_made": len(P[pid]["picks"])} for pid in ids),
                   key=lambda x: (-x["win_chance"], -x["points"]))
    final = sum(1 for g in games if g["status"] == "final")
    fp = hashlib.sha1(json.dumps([[g["status"], g["score"]] for g in games] + [len(ids)]).encode()).hexdigest()[:12]
    print(json.dumps({"players": len(ids), "games_final": final, "games_live": sum(g["status"]=="live" for g in games),
                      "all_final": final == len(G), "fingerprint": fp, "standings": stand, "games": games}, indent=1))

main()
