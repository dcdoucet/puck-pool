// Shareable neon standings image (1080px wide JPG).
const Board=(()=>{
const imgs={};
function svgImg(key,url){
  return imgs[key]||(imgs[key]=fetch(url).then(r=>r.ok?r.text():Promise.reject()).then(t=>{
    const vb=/viewBox="([\d.\s-]+)"/.exec(t);const [, , w, h]=(vb?vb[1]:'0 0 960 640').split(/\s+/).map(Number);
    if(!/<svg[^>]*\swidth=/.test(t))t=t.replace('<svg ',`<svg width="${w}" height="${h}" `);
    return new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(t)});
  }).catch(()=>null));
}
function dataImg(key,svg){return imgs[key]||(imgs[key]=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}))}
function fit(c,t,w){if(c.measureText(t).width<=w)return t;while(t.length>1&&c.measureText(t+'…').width>w)t=t.slice(0,-1);return t+'…'}
const F=(wt,sz,fam)=>`${wt} ${sz}px ${fam||'-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif'}`;
const PINK='#ff2a6d',CYAN='#05d9e8',GOLD='#f9c80e',LAV='#b9a6e8',BG='#12002b';
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h)};
async function draw({P,S,O,me}){
  const {G,result,started,tally,simulate,awards,BADGE,f1}=PP;
  const ids=Object.keys(P),T=tally(P,S),win=simulate(P,S,O),AW=awards(P,S,T);
  const lead=Math.max(0,...ids.map(id=>T[id].pts));
  const rows=ids.map(id=>({id,p:P[id],...T[id],w:win[id]||0,t:teamOf(id,P[id]),b:AW[id]||[]})).sort((a,b)=>b.w-a.w||b.pts-a.pts||b.max-a.max);
  const W=1080,HEAD=270,COL=60,ROW=136,FOOT=150,H=HEAD+COL+Math.max(1,rows.length)*ROW+FOOT;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const L={};await Promise.all([...new Set(G.flatMap(g=>[g.a,g.h]))].map(async ab=>L[ab]=await svgImg('L'+ab,'logos/'+ab+'_dark.svg')));
  const C={};await Promise.all(rows.map(async r=>C[r.id]=await dataImg('C'+r.t.m+r.t.kit,crest(r.t.m,r.t.kit,128))));
  try{await document.fonts.load('40px "Press Start 2P"')}catch{}
  c.fillStyle=BG;c.fillRect(0,0,W,H);
  let gr=c.createLinearGradient(0,0,0,HEAD);gr.addColorStop(0,'#14002e');gr.addColorStop(.7,'#4a0a6b');gr.addColorStop(1,'#a3135f');c.fillStyle=gr;c.fillRect(0,0,W,HEAD);
  c.save();c.beginPath();c.rect(0,0,W,HEAD-6);c.clip();c.beginPath();c.arc(880,HEAD+20,150,0,Math.PI*2);c.clip();
  gr=c.createLinearGradient(0,HEAD-130,0,HEAD+20);gr.addColorStop(0,GOLD);gr.addColorStop(1,PINK);c.fillStyle=gr;c.fillRect(700,HEAD-140,360,180);
  c.fillStyle='#a3135f';for(let i=0;i<6;i++)c.fillRect(700,HEAD-70+i*16,360,3+i*1.6);c.restore();
  c.strokeStyle='rgba(5,217,232,.35)';c.lineWidth=2;for(let i=-8;i<=8;i++){c.beginPath();c.moveTo(540+i*20,HEAD-30);c.lineTo(540+i*150,HEAD);c.stroke()}
  c.fillStyle=PINK;c.shadowColor=PINK;c.shadowBlur=18;c.fillRect(0,HEAD-6,W,6);c.shadowBlur=0;
  c.font=F(400,58,'"Press Start 2P",monospace');c.fillStyle='#fff';c.shadowColor=CYAN;c.shadowBlur=22;c.fillText('PUCK POOL',46,110);c.shadowBlur=0;
  c.font=F(800,32);c.fillStyle=GOLD;c.fillText('SATURDAY NIGHT  ·  NOV 21',50,162);
  const fin=G.filter(g=>result(S,g)).length,live=G.filter(g=>PP.isLive(S[g.id])).length,tm=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  c.font=F(700,30);c.fillStyle=live?PINK:'#e8dcff';
  c.fillText((fin===G.length?'■ FINAL':live?`● LIVE  ${live} on now · ${fin}/14 final`:fin?`${fin}/14 final`:'PREGAME')+'  ·  '+tm,50,212);
  const y0=HEAD+COL;c.font=F(800,24);c.fillStyle=CYAN;
  c.fillText('TEAM',176,HEAD+40);c.textAlign='right';c.fillText('PTS',800,HEAD+40);c.fillText('MAX',920,HEAD+40);c.fillText('WIN',1040,HEAD+40);c.textAlign='left';
  if(!rows.length){c.font=F(600,36);c.fillStyle=LAV;c.fillText('No one has joined yet. Insert coin.',176,y0+80)}
  rows.forEach((r,i)=>{
    const y=y0+i*ROW,out=r.max<lead-1e-9;
    c.fillStyle=i%2?BG:'#1b0840';c.fillRect(0,y,W,ROW);
    if(r.id===me){c.fillStyle=CYAN;c.fillRect(0,y,8,ROW)}
    c.globalAlpha=out?.5:1;
    c.font=F(400,30,'"Press Start 2P",monospace');c.fillStyle=i===0?GOLD:PINK;c.textAlign='center';c.fillText(String(i+1),48,y+80);c.textAlign='left';
    if(C[r.id])c.drawImage(C[r.id],80,y+22,88,88);
    c.font=F(800,22);const bw=r.b.map(k=>c.measureText(BADGE[k]).width+24);const btot=bw.reduce((a,b)=>a+b+8,0);
    c.font=F(800,36);const nm=fit(c,teamName(r.p.name,r.t.m),Math.max(220,560-btot));c.fillStyle='#fff';c.fillText(nm,176,y+50);
    let bx=176+c.measureText(nm).width+14;c.font=F(800,22);
    r.b.forEach((k,j)=>{if(bx+bw[j]>740)return;const col={fire:'#ff7a00',fade:GOLD,sheep:'#e8e8e8',bad:'#9aa0a6',round:'#f5b041'}[k];
      c.fillStyle='rgba(255,255,255,.08)';c.strokeStyle=col;c.lineWidth=2;rr(c,bx,y+22,bw[j],36,18);c.fill();c.stroke();
      c.fillStyle=col;c.fillText(BADGE[k],bx+12,y+48);bx+=bw[j]+8});
    G.forEach((g,j)=>{
      const x=176+j*38,yy=y+70,k=r.p.picks[g.id];
      if(!started(S,g)){c.fillStyle='#3a2a5c';c.beginPath();c.arc(x+16,yy+19,5,0,7);c.fill();return}
      if(!k){c.fillStyle='#4a3a6c';c.fillRect(x+6,yy+17,20,4);return}
      const ab=k==='H'?g.h:g.a,res=result(S,g);
      if(r.p.lock===g.id){c.strokeStyle=GOLD;c.lineWidth=2.5;rr(c,x-3,yy+2,40,32,6);c.stroke()}
      c.globalAlpha=(out?.5:1)*(res&&res!==k?.25:1);
      if(L[ab])c.drawImage(L[ab],x,yy+6,36,24);else{c.font=F(700,15);c.fillStyle='#fff';c.fillText(ab,x,yy+26)}
      c.globalAlpha=out?.5:1;
      if(res===k){c.fillStyle='#22e07a';c.beginPath();c.arc(x+31,yy+30,8,0,7);c.fill();c.strokeStyle=BG;c.lineWidth=3;c.beginPath();c.moveTo(x+27,yy+30);c.lineTo(x+30,yy+33);c.lineTo(x+35,yy+27);c.stroke()}
    });
    c.textAlign='right';c.font=F(800,42);c.fillStyle='#fff';c.fillText(f1(r.pts),800,y+82);
    c.font=F(600,36);c.fillStyle=LAV;c.fillText(f1(r.max),920,y+82);
    const pct=r.w>=.995&&r.w<1?'>99%':r.w>0&&r.w<.005?'<1%':Math.round(r.w*100)+'%';
    c.font=F(800,40);c.fillStyle=r.w===0?'#6d5f8a':i===0?GOLD:CYAN;c.fillText(r.w===0?'OUT':pct,1040,y+82);c.textAlign='left';
    c.globalAlpha=1;
  });
  const fy=y0+Math.max(1,rows.length)*ROW;c.fillStyle=PINK;c.fillRect(0,fy,W,4);c.fillStyle='#0c001f';c.fillRect(0,fy+4,W,FOOT);
  const srcs=[...new Set(Object.values(O).map(o=>o.src).filter(Boolean))];
  c.fillStyle=LAV;c.font=F(500,25);
  c.fillText('Each game: 1 pt per person who picked it, split among the winners. 🔒 Lock = double.',46,fy+50);
  c.fillText(`WIN = 6,000 simulated finishes from ${srcs.length?srcs.join(', ')+' lines':'home-ice odds (lines post Sat AM)'} + live scores.`,46,fy+90);
  c.fillText('Picks appear once each game starts.',46,fy+128);
  return cv;
}
return {draw};
})();
