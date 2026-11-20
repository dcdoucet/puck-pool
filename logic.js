// Shared game logic: schedule, scoring (split pot + Lock of the Night), win odds, awards, and the TV/arcade newsfeed.
const PP=(()=>{
const G=[["2026020359","EDM","CAR","2026-11-21T18:00:00Z"],["2026020360","CHI","CGY","2026-11-21T20:30:00Z"],["2026020361","BUF","FLA","2026-11-21T23:00:00Z"],["2026020362","PIT","NSH","2026-11-21T23:00:00Z"],["2026020363","WSH","BOS","2026-11-22T00:00:00Z"],["2026020364","CBJ","TOR","2026-11-22T00:00:00Z"],["2026020365","PHI","MTL","2026-11-22T00:00:00Z"],["2026020366","LAK","OTT","2026-11-22T00:00:00Z"],["2026020367","NYI","DET","2026-11-22T00:00:00Z"],["2026020368","NJD","STL","2026-11-22T00:00:00Z"],["2026020369","VGK","WPG","2026-11-22T00:00:00Z"],["2026020370","ANA","UTA","2026-11-22T02:00:00Z"],["2026020371","MIN","VAN","2026-11-22T03:00:00Z"],["2026020372","SEA","SJS","2026-11-22T03:00:00Z"]].map(([id,a,h,t])=>({id,a,h,t:Date.parse(t)}));
const GI=Object.fromEntries(G.map(g=>[g.id,g]));
const isFinal=s=>!!s&&['FINAL','OFF'].includes(s.state);
const isLive=s=>!!s&&['LIVE','CRIT'].includes(s.state);
const result=(S,g)=>{const s=S[g.id];return isFinal(s)?(s.hs>s.as?'H':'A'):null};
const started=(S,g)=>Date.now()>=g.t||(!!S[g.id]&&!['FUT','PRE',undefined].includes(S[g.id].state));
const mult=()=>1;
function sides(P,g){const A=[],H=[];for(const id in P){const k=P[id].picks[g.id];if(k==='A')A.push(id);else if(k==='H')H.push(id)}return{A,H}}
function tally(P,S){
  const T={};for(const id in P)T[id]={pts:0,max:0,hist:[]};
  for(const g of G){
    const {A,H}=sides(P,g),pot=A.length+H.length;if(!pot)continue;const r=result(S,g);
    if(r){const W=r==='H'?H:A,L=r==='H'?A:H;
      for(const id of W){const gain=pot/W.length*mult(P[id],g);T[id].pts+=gain;T[id].hist.push({g,ok:true,gain,share:W.length/pot})}
      for(const id of L)T[id].hist.push({g,ok:false,gain:0})}
    else for(const side of [A,H])for(const id of side)T[id].max+=pot/side.length*mult(P[id],g);
  }
  for(const id in T)T[id].max+=T[id].pts;
  return T;
}
// ---- win odds: sportsbook moneyline (vig removed), updated live from score + time left ----
const imp=m=>m<0?-m/(-m+100):100/(m+100);
function prior(o){if(!o||o.a==null||o.h==null)return .54;const a=imp(o.a),h=imp(o.h);return h/(a+h)}
function pois(l){const p=[];let v=Math.exp(-l);for(let k=0;k<16;k++){p.push(v);v=v*l/(k+1)}return p}
function pWin(lead,lh,la,ot){const ph=pois(lh),pa=pois(la);let w=0;for(let i=0;i<16;i++)for(let j=0;j<16;j++){const d=lead+i-j;w+=ph[i]*pa[j]*(d>0?1:d===0?ot:0)}return w}
const rc={};
function rates(id,p){const k=id+p.toFixed(4);if(rc[k])return rc[k];const ot=.5+(p-.5)*.4;let lo=.2,hi=.8;
  for(let i=0;i<30;i++){const s=(lo+hi)/2;if(pWin(0,6.2*s,6.2*(1-s),ot)<p)lo=s;else hi=s}return rc[k]=[6.2*lo,6.2*(1-lo),ot]}
function pHome(g,s,o){
  const p=prior(o);if(!s||!isLive(s)&&!isFinal(s))return p;
  const lead=(+s.hs||0)-(+s.as||0);if(isFinal(s))return lead>0?1:0;
  const [lh,la,ot]=rates(g.id,p),per=+s.period||1;if(per>3)return lead>0?1:lead<0?0:ot;
  const m=/^(\d+):(\d+)/.exec(s.clock||'');const rem=(3-per)*20+(m?+m[1]+m[2]/60:10);
  return pWin(lead,lh*rem/60,la*rem/60,ot);
}
function simulate(P,S,O,N=6000){
  const ids=Object.keys(P),n=ids.length;if(!n)return{};
  const ix=Object.fromEntries(ids.map((id,i)=>[id,i])),T=tally(P,S),base=new Float64Array(ids.map(id=>T[id].pts)),games=[];
  for(const g of G){if(result(S,g))continue;const {A,H}=sides(P,g),pot=A.length+H.length;if(!pot)continue;
    const m=id=>mult(P[id],g);games.push({gid:g.id,A:A.map(id=>[ix[id],pot/A.length*m(id)]),H:H.map(id=>[ix[id],pot/H.length*m(id)]),ph:pHome(g,S[g.id],O[g.id])})}
  const win=new Float64Array(n),t=new Float64Array(n);
  for(let s=0;s<N;s++){t.set(base);for(const g of games){const h=Math.random()<g.ph;g.last=h?'H':'A';for(const [i,v] of (h?g.H:g.A))t[i]+=v}
    let best=-1;for(let i=0;i<n;i++)if(t[i]>best)best=t[i];
    let tops=[];for(let i=0;i<n;i++)if(Math.abs(t[i]-best)<1e-9)tops.push(ids[i]);
    if(tops.length>1){const out={};for(const g of G){const r=result(S,g);if(r)out[g.id]=r}for(const g of games)out[g.gid]=g.last;tops=breakTie(P,tops,out)}
    for(const id of tops)win[ix[id]]+=1/tops.length}
  return Object.fromEntries(ids.map((id,i)=>[id,win[i]/N]));
}
// ---- tie-breakers ----
// out: gid -> 'A'|'H' for decided games. Returns the subset of ids that survive the tie-breakers.
function breakTie(P,ids,out){
  if(ids.length<2)return ids;
  const right=id=>G.reduce((n,g)=>n+(out[g.id]&&P[id].picks[g.id]===out[g.id]?1:0),0);
  let best=Math.max(...ids.map(right));ids=ids.filter(id=>right(id)===best);if(ids.length<2)return ids;
  const h2h=id=>ids.reduce((n,o)=>o===id?n:n+G.filter(g=>out[g.id]&&P[id].picks[g.id]&&P[o].picks[g.id]&&P[id].picks[g.id]!==P[o].picks[g.id]&&P[id].picks[g.id]===out[g.id]).length,0);
  best=Math.max(...ids.map(h2h));ids=ids.filter(id=>h2h(id)===best);if(ids.length<2)return ids;
  for(const g of [...G].reverse()){const r=out[g.id];if(!r)continue;const ks=new Set(ids.map(id=>P[id].picks[g.id]));
    if(ks.size>1){const w=ids.filter(id=>P[id].picks[g.id]===r);if(w.length)return w}}
  return ids;
}
function rankOrder(P,S){
  const T=tally(P,S),out=Object.fromEntries(G.filter(g=>result(S,g)).map(g=>[g.id,result(S,g)]));
  const ids=Object.keys(P).sort((a,b)=>T[b].pts-T[a].pts),res=[];
  while(ids.length){const top=ids.filter(id=>Math.abs(T[id].pts-T[ids[0]].pts)<1e-9);
    let rest=[...top];while(rest.length){const w=breakTie(P,rest,out);res.push(...w);rest=rest.filter(id=>!w.includes(id))}
    ids.splice(0,top.length)}
  return res;
}
// ---- awards ----
const BADGE={fire:'🔥 ON FIRE',fade:'👑 FADE KING',sheep:'🐑 SHEEP',bad:'💀 BAD BEAT',round:'🍺 1ST ROUND'};
function awards(P,S,T){
  const ids=Object.keys(P),A={};for(const id of ids)A[id]=[];
  const finals=G.filter(g=>result(S,g));if(!ids.length)return A;
  for(const id of ids){let k=0;for(let i=T[id].hist.length-1;i>=0&&T[id].hist[i].ok;i--)k++;if(k>=3)A[id].push('fire')}
  let best=null;for(const id of ids)for(const h of T[id].hist)if(h.ok&&h.share<=.5&&h.gain>=2&&(!best||h.gain>best.gain))best={id,gain:h.gain};
  if(best)A[best.id].push('fade');
  const lk=G.filter(g=>started(S,g));
  if(lk.length>=4){let top=null;for(const id of ids){let n=0,m=0;for(const g of lk){const k=P[id].picks[g.id];if(!k)continue;n++;const {A:a,H:h}=sides(P,g);if((k==='H'?h.length:a.length)>(k==='H'?a.length:h.length))m++}
    const r=n>=4?m/n:0;if(r>=.8&&(!top||r>top.r))top={id,r}}if(top)A[top.id].push('sheep')}
  let bb=null;
  for(const g of finals){const s=S[g.id],r=result(S,g);let a2=0,h2=0;for(const x of s.goals||[])if(x[2]<=2){a2=x[4];h2=x[5]}
    const lead=h2>a2?'H':a2>h2?'A':null;const {A:a,H:h}=sides(P,g);
    const burned=ids.filter(id=>P[id].picks[g.id]&&P[id].picks[g.id]!==r&&(P[id].picks[g.id]===lead||P[id].lock===g.id));if(burned.length)bb=burned}
  if(bb)for(const id of bb)A[id].push('bad');
  if(finals.length){const last=[...ids].sort((x,y)=>T[x].pts-T[y].pts||T[x].max-T[y].max)[0];A[last].push('round')}
  return A;
}
// ---- newsfeed ----
const per=p=>p>4?'SO':p>3?'OT':'P'+p;
function est(g,p,mmss){const m=/^(\d+):(\d+)/.exec(mmss||'');const e=m?+m[1]+m[2]/60:10;
  return g.t+60000*(p<=3?(p-1)*53+e*1.75:p===4?3*53-12+e*1.75:3*53+5)}
const CALLS=['🚨 LIGHT THE LAMP!','🚨 BAR DOWN!','🚨 TOP CHEESE!','🚨 SNIPE CITY!','🚨 GOOOAL!','🚨 HE SHOOTS, HE SCORES!','🚨 WHAT A SNIPE!','🚨 FIVE-HOLE!'];
const hash=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))>>>0;return x};
function names(P,ids){const n=ids.map(id=>P[id].name);return n.length>4?n.length+' guys':n.length>1?n.slice(0,-1).join(', ')+' & '+n[n.length-1]:n[0]||''}
const f1=n=>String(Math.round(n*10)/10);
function feed(P,S,O,seen={}){
  const E=[],ids=Object.keys(P);
  for(const g of G){
    const s=S[g.id];if(!started(S,g))continue;
    const {A,H}=sides(P,g),locks=ids.filter(id=>P[id].lock===g.id&&P[id].picks[g.id]);
    E.push({key:'d:'+g.id,ts:g.t,kind:'drop',gid:g.id,text:`🏒 PUCK DROP: ${g.a} @ ${g.h}. The pool goes ${H.length} on ${g.h}, ${A.length} on ${g.a}.`+(locks.length?` 🔒 Locks: ${locks.map(id=>P[id].name+' ('+(P[id].picks[g.id]==='H'?g.h:g.a)+')').join(', ')}.`:'')});
    if(!s)continue;
    (s.goals||[]).forEach((x,i)=>{
      const [team,who,p,tm,as,hs,str]=x,side=team===g.h?'H':'A',fans=side==='H'?H:A,vs=side==='H'?A:H;
      const key='g:'+g.id+':'+i;
      E.push({key,ts:seen[key]||est(g,p,tm),kind:'goal',gid:g.id,side,team,ids:fans,vs,
        text:`${CALLS[hash(key)%CALLS.length]} ${team}${who?' — '+who:''}${str==='pp'?' on the power play':str==='sh'?' SHORTHANDED':''}. ${g.a} ${as}, ${g.h} ${hs} (${per(p)} ${tm}).`+(fans.length?` Cha-ching for ${names(P,fans)}.`:''),
        score:`${g.a} ${as} · ${g.h} ${hs}`,who,p,tm,short:`🚨 ${team}${who?' '+who.split('. ').pop():''} · ${g.a} ${as}–${hs} ${g.h}`});
    });
    if(isFinal(s)){
      const r=result(S,g),win=r==='H'?g.h:g.a,W=r==='H'?H:A,pot=A.length+H.length,last=(s.goals||[]).slice(-1)[0];
      const ts=seen['f:'+g.id]||Math.max(g.t+60000*(s.period>3?160:148),last?est(g,last[2],last[3])+120000:0);
      const up=prior(O[g.id]),dog=(r==='H'?up:1-up)<.4;
      let t=`🏁 FINAL${s.period>4?' (SO)':s.period>3?' (OT)':''}: ${g.a} ${s.as}, ${g.h} ${s.hs}. `+(dog?'⚡ UPSET ALERT! ':'');
      t+=W.length?`${win} backers split ${pot} pts (+${f1(pot/W.length)} each).`:`Nobody had ${win}. The pot vanishes like a beer at the second intermission.`;
      for(const id of locks)t+=P[id].picks[g.id]===r?` 🔒 ${P[id].name}'s lock CASHES, double points!`:` 💥 ${P[id].name}'s lock goes up in smoke.`;
      E.push({key:'f:'+g.id,ts,kind:'final',gid:g.id,side:r,team:win,ids:W,vs:r==='H'?A:H,text:t,pts:pot/Math.max(1,W.length),
        short:`${dog?'⚡':'🏁'} ${win} wins ${Math.max(s.as,s.hs)}–${Math.min(s.as,s.hs)}${s.period>4?' SO':s.period>3?' OT':''} · `+(W.length?`${names(P,W)} +${f1(pot/W.length)}`:'nobody had it')+(locks.filter(id=>P[id].picks[g.id]===r).length?' · 🔒 '+names(P,locks.filter(id=>P[id].picks[g.id]===r))+' doubled':'')});
    }
  }
  // replay finals in order for lead changes and eliminations
  const fin=E.filter(e=>e.kind==='final').sort((a,b)=>a.ts-b.ts),S2={};let leaders='',out=new Set();
  for(const f of fin){S2[f.gid]=S[f.gid];const T=tally(P,S2),lead=Math.max(0,...ids.map(id=>T[id].pts));
    const top=ids.filter(id=>T[id].pts===lead&&lead>0).sort().join();
    if(top&&top!==leaders){const t=top.split(',');E.push({key:'L:'+f.gid+':'+top,ts:f.ts+1,kind:'lead',ids:t,
      short:t.length>1?`👑 Tie for 1st`:`👑 ${P[t[0]].name} takes 1st`,text:t.length>1?`👑 LOGJAM AT THE TOP: ${t.map(id=>teamName(P[id].name,teamOf(id,P[id]).m)).join(' & ')} tied at ${f1(lead)}.`:`👑 NEW LEADER: ${teamName(P[t[0]].name,teamOf(t[0],P[t[0]]).m)} take over 1st with ${f1(lead)} pts.`});leaders=top}
    for(const id of ids)if(!out.has(id)&&T[id].max<lead-1e-9){out.add(id);E.push({key:'x:'+id,ts:f.ts+2,kind:'out',ids:[id],short:`👾 ${P[id].name} is out`,
      text:`👾 GAME OVER: ${teamName(P[id].name,teamOf(id,P[id]).m)} are mathematically eliminated. Insert coin.`})}}
  return E.sort((a,b)=>a.ts-b.ts);
}
return {breakTie,rankOrder,G,GI,isFinal,isLive,result,started,tally,simulate,pHome,prior,awards,BADGE,feed,per,f1};
})();
