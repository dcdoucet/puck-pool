// Shareable standings image: black scoreboard, amber numbers, one row per player.
const Board=(()=>{
const imgs={};
function dataImg(key,svg){return imgs[key]||(imgs[key]=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}))}
function fit(c,t,w){if(c.measureText(t).width<=w)return t;while(t.length>1&&c.measureText(t+'…').width>w)t=t.slice(0,-1);return t+'…'}
const F=(wt,sz,fam)=>`${wt} ${sz}px ${fam||'-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif'}`;
const PX='"Press Start 2P",monospace',AMB='#ffb000',BG='#0b0b0b',MUTE='#8a8a8a';
const ICON={fire:'🔥',fade:'👑',sheep:'🐑',bad:'💀',round:'🍺'};
async function draw({P,S,O,me}){
  const {G,result,started,tally,simulate,awards,f1}=PP;
  const ids=Object.keys(P),T=tally(P,S),win=simulate(P,S,O),AW=awards(P,S,T);
  const lead=Math.max(0,...ids.map(id=>T[id].pts));
  const rows=ids.map(id=>({id,p:P[id],...T[id],w:win[id]||0,t:teamOf(id,P[id]),b:AW[id]||[]})).sort((a,b)=>b.w-a.w||b.pts-a.pts||b.max-a.max);
  const W=1080,HEAD=170,COL=56,ROW=108,PAD=30,H=HEAD+COL+Math.max(1,rows.length)*ROW+PAD;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const C={};await Promise.all(rows.map(async r=>C[r.id]=await dataImg('C'+r.t.m+r.t.kit,crest(r.t.m,r.t.kit,128))));
  try{await document.fonts.load('40px "Press Start 2P"')}catch{}
  c.fillStyle=BG;c.fillRect(0,0,W,H);
  c.font=F(400,46,PX);c.fillStyle=AMB;c.fillText('PUCK POOL',48,92);
  const fin=G.filter(g=>result(S,g)).length,live=G.some(g=>PP.isLive(S[g.id]));
  const tm=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  c.font=F(600,28);c.fillStyle=MUTE;
  c.fillText(`${fin===G.length?'Final':live?'Live':fin?'':'Pregame'}${fin&&fin<G.length?(live?' · ':'')+fin+' of 14 final':''} · ${tm}`.replace(/^ · /,''),50,140);
  c.fillStyle='#222';c.fillRect(48,HEAD-1,W-96,2);
  const y0=HEAD+COL;c.font=F(700,22);c.fillStyle=MUTE;
  c.textAlign='right';c.fillText('PTS',790,HEAD+38);c.fillText('MAX',910,HEAD+38);c.fillText('WIN',1032,HEAD+38);c.textAlign='left';
  if(!rows.length){c.font=F(600,34);c.fillStyle=MUTE;c.fillText('No one yet.',150,y0+64)}
  rows.forEach((r,i)=>{
    const y=y0+i*ROW,out=r.max<lead-1e-9;
    if(r.id===me){c.fillStyle='#171717';c.fillRect(24,y+4,W-48,ROW-8)}
    c.globalAlpha=out?.45:1;
    c.font=F(400,26,PX);c.fillStyle=i===0&&!out?AMB:MUTE;c.textAlign='center';c.fillText(String(i+1),62,y+66);c.textAlign='left';
    if(C[r.id])c.drawImage(C[r.id],96,y+18,72,72);
    c.font=F(800,34);c.fillStyle='#eee';
    const icons=r.b.map(k=>ICON[k]).join(' ');
    const nm=fit(c,teamName(r.p.name,r.t.m),560-(icons?c.measureText(icons).width+14:0));c.fillText(nm,186,y+50);
    if(icons)c.fillText(icons,186+c.measureText(nm).width+14,y+50);
    // one square per game: grey = not started, white = in play, green/red = result, amber ring = lock
    G.forEach((g,j)=>{
      const x=188+j*30,yy=y+66,k=r.p.picks[g.id],res=result(S,g),s=20;
      c.fillStyle=!started(S,g)?'#262626':!k?'#111':res?(res===k?'#2ecc71':'#e5484d'):'#d0d0d0';
      c.fillRect(x,yy,s,s);
      if(!k&&started(S,g)){c.strokeStyle='#333';c.lineWidth=2;c.strokeRect(x+1,yy+1,s-2,s-2)}
      if(r.p.lock===g.id&&started(S,g)){c.strokeStyle=AMB;c.lineWidth=3;c.strokeRect(x-3,yy-3,s+6,s+6)}
    });
    c.textAlign='right';c.font=F(400,32,PX);c.fillStyle='#eee';c.fillText(f1(r.pts),790,y+68);
    c.font=F(600,32);c.fillStyle=MUTE;c.fillText(f1(r.max),910,y+66);
    const pct=r.w>=.995&&r.w<1?'>99%':r.w>0&&r.w<.005?'<1%':Math.round(r.w*100)+'%';
    c.font=F(800,36);c.fillStyle=r.w===0?'#555':AMB;c.fillText(r.w===0?'OUT':pct,1032,y+66);c.textAlign='left';
    c.globalAlpha=1;
    c.fillStyle='#1c1c1c';c.fillRect(48,y+ROW-1,W-96,1);
  });
  return cv;
}
return {draw};
})();
