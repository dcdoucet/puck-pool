// Shareable standings image: live points, max possible, and win odds.
// Win odds = Monte Carlo over remaining games; each game's chance comes from the
// pregame sportsbook moneyline, updated live with the score and time left.
const Board=(()=>{
const imp=m=>m<0?-m/(-m+100):100/(m+100);
function prior(o){if(!o||o.a==null||o.h==null)return .54;const a=imp(o.a),h=imp(o.h);return h/(a+h)}
function pois(l){const p=[];let v=Math.exp(-l);for(let k=0;k<16;k++){p.push(v);v=v*l/(k+1)}return p}
function pWin(lead,lh,la,ot){const ph=pois(lh),pa=pois(la);let w=0;for(let i=0;i<16;i++)for(let j=0;j<16;j++){const d=lead+i-j;w+=ph[i]*pa[j]*(d>0?1:d===0?ot:0)}return w}
const rateCache={};
function rates(id,p){ // split ~6.2 goals so a 0-0 start matches the sportsbook's chance
  const k=id+':'+p.toFixed(4);if(rateCache[k])return rateCache[k];
  const ot=.5+(p-.5)*.4;let lo=.2,hi=.8;
  for(let i=0;i<30;i++){const s=(lo+hi)/2;if(pWin(0,6.2*s,6.2*(1-s),ot)<p)lo=s;else hi=s}
  return rateCache[k]=[6.2*lo,6.2*(1-lo),ot];
}
function pHome(g,s,o){
  const p=prior(o);
  if(!s||['FUT','PRE'].includes(s.state)||s.state==null)return p;
  const lead=(+s.hs||0)-(+s.as||0);
  if(['FINAL','OFF'].includes(s.state))return lead>0?1:0;
  const [lh,la,ot]=rates(g.id,p),per=+s.period||1;
  if(per>3)return lead>0?1:lead<0?0:ot;
  const m=/^(\d+):(\d+)/.exec(s.clock||'');const rem=(3-per)*20+(m?+m[1]+m[2]/60:10);
  return pWin(lead,lh*rem/60,la*rem/60,ot);
}
function simulate(G,P,scores,odds,result,N=6000){
  const ids=Object.keys(P),idx=Object.fromEntries(ids.map((id,i)=>[id,i])),n=ids.length;
  const base=new Float64Array(n),games=[];
  for(const g of G){
    const A=[],H=[];for(const id of ids){const k=P[id].picks[g.id];if(k==='A')A.push(idx[id]);else if(k==='H')H.push(idx[id])}
    const pot=A.length+H.length;if(!pot)continue;
    const r=result(g);
    if(r){const W=r==='H'?H:A;for(const i of W)base[i]+=pot/W.length}
    else games.push({A,H,pot,ph:pHome(g,scores[g.id],odds[g.id])});
  }
  const win=new Float64Array(n),t=new Float64Array(n);
  if(!n)return{};
  for(let s=0;s<N;s++){
    t.set(base);
    for(const g of games){const W=Math.random()<g.ph?g.H:g.A;for(const i of W)t[i]+=g.pot/W.length}
    let best=-1,c=0;for(let i=0;i<n;i++){if(t[i]>best+1e-9){best=t[i];c=1}else if(Math.abs(t[i]-best)<1e-9)c++}
    for(let i=0;i<n;i++)if(Math.abs(t[i]-best)<1e-9)win[i]+=1/c;
  }
  return Object.fromEntries(ids.map((id,i)=>[id,win[i]/N]));
}
// ---- images (logos fetched as text so we can give them a real size) ----
const imgs={};
function loadImg(key,src){return imgs[key]||(imgs[key]=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=src}))}
async function logo(ab){
  if(imgs['L'+ab])return imgs['L'+ab];
  return imgs['L'+ab]=fetch('logos/'+ab+'_light.svg').then(r=>r.ok?r.text():Promise.reject()).then(t=>{
    const vb=/viewBox="([\d.\s-]+)"/.exec(t);const [, , w, h]=(vb?vb[1]:'0 0 960 640').split(/\s+/).map(Number);
    t=t.replace('<svg ',`<svg width="${w}" height="${h}" `);
    return new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(t)});
  }).catch(()=>null);
}
const crestImg=(m,kit)=>loadImg('C'+m+kit.join(),'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(crest(m,kit,128)));
function fit(ctx,txt,w){if(ctx.measureText(txt).width<=w)return txt;while(txt.length>1&&ctx.measureText(txt+'…').width>w)txt=txt.slice(0,-1);return txt+'…'}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h)}
async function draw(X){
  const {G,P,scores,odds,result,locked,me}=X;
  const ids=Object.keys(P),win=simulate(G,P,scores,odds,result);
  // points + max (same split-pot rules as the site)
  const T={};for(const id of ids)T[id]={pts:0,max:0};
  for(const g of G){const who=ids.filter(id=>P[id].picks[g.id]);if(!who.length)continue;const r=result(g),pot=who.length;
    if(r){const w=who.filter(id=>P[id].picks[g.id]===r);for(const id of w)T[id].pts+=pot/w.length}
    else for(const id of who){T[id].max+=pot/who.filter(x=>P[x].picks[g.id]===P[id].picks[g.id]).length}}
  for(const id of ids)T[id].max+=T[id].pts;
  const rows=ids.map(id=>({id,p:P[id],...T[id],w:win[id]||0,t:teamOf(id,P[id])})).sort((a,b)=>b.w-a.w||b.pts-a.pts||b.max-a.max);
  const W=1080,HEAD=230,COL=64,ROW=132,FOOT=150,H=HEAD+COL+Math.max(1,rows.length)*ROW+FOOT;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const F=(wt,sz)=>`${wt} ${sz}px -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
  const final=G.filter(result).length,live=G.filter(g=>{const s=scores[g.id];return s&&['LIVE','CRIT'].includes(s.state)}).length;
  const L={};await Promise.all([...new Set(G.flatMap(g=>[g.a,g.h]))].map(async ab=>L[ab]=await logo(ab)));
  const C={};await Promise.all(rows.map(async r=>C[r.id]=await crestImg(r.t.m,r.t.kit)));
  // header
  c.fillStyle='#fff';c.fillRect(0,0,W,H);
  c.fillStyle='#14284b';c.fillRect(0,0,W,HEAD);
  c.fillStyle='#b3132b';c.fillRect(0,HEAD-14,W,14);
  c.fillStyle='#fff';c.font=F(900,78);c.fillText('PUCK POOL',48,108);
  c.font=F(600,34);c.fillStyle='#c9d4e8';c.fillText('NHL · Saturday, Nov 21',50,160);
  const tm=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const status=final===G.length?'FINAL':live?`LIVE · ${final} of ${G.length} final`:final?`${final} of ${G.length} final`:'Pregame';
  c.textAlign='right';c.font=F(800,38);c.fillStyle=live?'#ff6b6b':'#f2b705';c.fillText(status,W-48,108);
  c.font=F(500,30);c.fillStyle='#c9d4e8';c.fillText('Updated '+tm,W-48,160);c.textAlign='left';
  // column labels
  const y0=HEAD+COL;c.font=F(700,26);c.fillStyle='#6b7684';
  c.fillText('TEAM',176,HEAD+44);c.textAlign='right';c.fillText('PTS',800,HEAD+44);c.fillText('MAX',920,HEAD+44);c.fillText('WIN',1040,HEAD+44);c.textAlign='left';
  if(!rows.length){c.font=F(600,36);c.fillStyle='#6b7684';c.fillText('No one has joined yet.',176,y0+80)}
  rows.forEach((r,i)=>{
    const y=y0+i*ROW;
    if(i%2===0){c.fillStyle='#f3f6fa';c.fillRect(0,y,W,ROW)}
    if(r.id===me){c.fillStyle='#1f4fbf';c.fillRect(0,y,10,ROW)}
    c.fillStyle='#14284b';c.font=F(800,36);c.textAlign='center';c.fillText(String(i+1),50,y+76);c.textAlign='left';
    if(C[r.id])c.drawImage(C[r.id],82,y+20,88,88);
    c.font=F(800,38);c.fillStyle='#111';c.fillText(fit(c,teamName(r.p.name,r.t.m),560),176,y+54);
    // pick strip: only games that have started, so nobody copies picks
    G.forEach((g,j)=>{
      const x=176+j*38,yy=y+72,k=r.p.picks[g.id];
      if(!locked(g)){c.fillStyle='#d5dbe3';c.beginPath();c.arc(x+16,yy+19,5,0,7);c.fill();return}
      if(!k){c.fillStyle='#c0c7d0';c.fillRect(x+6,yy+17,20,4);return}
      const ab=k==='H'?g.h:g.a,res=result(g);
      c.globalAlpha=res&&res!==k?.28:1;
      if(L[ab])c.drawImage(L[ab],x,yy+6,36,24);else{c.font=F(700,16);c.fillStyle='#111';c.fillText(ab,x,yy+26)}
      c.globalAlpha=1;
      if(res===k){c.fillStyle='#16a34a';c.beginPath();c.arc(x+31,yy+30,8,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(x+27,yy+30);c.lineTo(x+30,yy+33);c.lineTo(x+35,yy+27);c.stroke()}
    });
    const f=n=>String(Math.round(n*10)/10);
    c.textAlign='right';c.font=F(800,42);c.fillStyle='#111';c.fillText(f(r.pts),800,y+80);
    c.font=F(600,36);c.fillStyle='#5b6573';c.fillText(f(r.max),920,y+80);
    const pct=r.w>=.995&&r.w<1?'>99%':r.w>0&&r.w<.005?'<1%':Math.round(r.w*100)+'%';
    c.font=F(800,40);c.fillStyle=r.w===0?'#a0a8b3':i===0?'#b3132b':'#14284b';c.fillText(r.w===0?'OUT':pct,1040,y+80);c.textAlign='left';
  });
  // footer
  const fy=y0+Math.max(1,rows.length)*ROW;c.fillStyle='#14284b';c.fillRect(0,fy,W,FOOT);
  const srcs=[...new Set(Object.values(odds).map(o=>o.src).filter(Boolean))];
  c.fillStyle='#c9d4e8';c.font=F(500,26);
  c.fillText('Each game is worth 1 pt per person who picked it, split among the winners.',48,fy+52);
  c.fillText(`Win % = 6,000 simulated finishes from ${srcs.length?srcs.join(', ')+' lines':'home-ice odds (lines post Sat morning)'} + live scores.`,48,fy+92);
  c.fillText('Picks show once each game starts.',48,fy+130);
  return cv;
}
return {draw,simulate,pHome};
})();
