// Shareable standings image for the group text: same rows as the Standings tab.
const Board=(()=>{
const imgs={};
function dataImg(key,svg){return imgs[key]||(imgs[key]=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}))}
function fit(c,t,w){if(c.measureText(t).width<=w)return t;while(t.length>1&&c.measureText(t+'…').width>w)t=t.slice(0,-1);return t+'…'}
const F=(wt,sz)=>`${wt} ${sz}px -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
const INK='#111418',MUTE='#6b7280',ACC='#2563eb',LINE='#e5e7eb';
const ICON={fire:'🔥',fade:'👑',sheep:'🐑',bad:'💀',round:'🍺'};
async function draw({P,S,O,me}){
  const {G,result,tally,simulate,awards,f1}=PP;
  const ids=Object.keys(P),T=tally(P,S),win=simulate(P,S,O),AW=awards(P,S,T);
  const lead=Math.max(0,...ids.map(id=>T[id].pts));
  const rows=ids.map(id=>({id,p:P[id],...T[id],w:win[id]||0,t:teamOf(id,P[id]),b:AW[id]||[]})).sort((a,b)=>b.pts-a.pts||b.w-a.w||b.max-a.max);
  const W=1080,HEAD=190,ROW=112,PAD=40,H=HEAD+Math.max(1,rows.length)*ROW+PAD;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const C={};await Promise.all(rows.map(async r=>C[r.id]=await dataImg('C'+r.t.m+r.t.kit,crest(r.t.m,r.t.kit,128))));
  c.fillStyle='#f4f5f7';c.fillRect(0,0,W,H);
  c.fillStyle=INK;c.font=F(800,56);c.fillText('Puck Pool',56,92);
  const fin=G.filter(g=>result(S,g)).length,live=G.filter(g=>PP.isLive(S[g.id])).length;
  const tm=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  c.fillStyle=MUTE;c.font=F(500,30);c.fillText(`Sat, Nov 21 · ${live?live+' live · ':''}${fin} of 14 final · ${tm}`,58,140);
  c.font=F(600,24);c.textAlign='right';c.fillText('PTS',760,HEAD-14);c.fillText('MAX',890,HEAD-14);c.fillText('WIN',1024,HEAD-14);c.textAlign='left';
  const y0=HEAD;c.fillStyle='#fff';c.beginPath();c.roundRect?c.roundRect(32,y0,W-64,Math.max(1,rows.length)*ROW,28):c.rect(32,y0,W-64,Math.max(1,rows.length)*ROW);c.fill();
  if(!rows.length){c.fillStyle=MUTE;c.font=F(500,34);c.fillText('No one yet.',80,y0+70)}
  rows.forEach((r,i)=>{
    const y=y0+i*ROW,out=r.max<lead-1e-9;
    if(r.id===me){c.fillStyle='#e8efff';c.fillRect(32,y,W-64,ROW)}
    if(i){c.fillStyle=LINE;c.fillRect(56,y,W-112,2)}
    c.fillStyle=MUTE;c.font=F(700,32);c.textAlign='center';c.fillText(String(i+1),88,y+68);c.textAlign='left';
    if(C[r.id])c.drawImage(C[r.id],126,y+20,72,72);
    c.font=F(700,36);c.fillStyle=out?MUTE:INK;
    c.fillText(fit(c,r.p.name,440),220,y+56);
    const ic=r.b.map(k=>ICON[k]).join('');c.font=F(500,26);c.fillStyle=MUTE;c.fillText(MASCOTS[r.t.m]+(ic?' · '+ic:''),220,y+90);
    c.textAlign='right';c.font=F(800,42);c.fillStyle=out?MUTE:INK;c.fillText(f1(r.pts),760,y+70);
    c.font=F(500,36);c.fillStyle=MUTE;c.fillText(f1(r.max),890,y+70);
    const pct=r.w>=.995&&r.w<1?'>99%':r.w>0&&r.w<.005?'<1%':Math.round(r.w*100)+'%';
    c.font=F(700,38);c.fillStyle=out?MUTE:ACC;c.fillText(out?'Out':pct,1024,y+70);c.textAlign='left';
  });
  return cv;
}
return {draw};
})();
