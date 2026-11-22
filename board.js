// Shareable standings image for the group text: same rows as the Standings tab.
const Board=(()=>{
const imgs={};
function svgImg(key,url){return imgs[key]||(imgs[key]=fetch(url).then(r=>r.ok?r.text():Promise.reject()).then(t=>{
  const vb=/viewBox="([\d.\s-]+)"/.exec(t);const [, , w, h]=(vb?vb[1]:'0 0 960 640').split(/\s+/).map(Number);
  if(!/<svg[^>]*\swidth=/.test(t))t=t.replace('<svg ',`<svg width="${w}" height="${h}" `);
  return new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(t)})}).catch(()=>null))}
function dataImg(key,svg){return imgs[key]||(imgs[key]=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}))}
function fit(c,t,w){if(c.measureText(t).width<=w)return t;while(t.length>1&&c.measureText(t+'…').width>w)t=t.slice(0,-1);return t+'…'}
const F=(wt,sz)=>`${wt} ${sz}px -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
const INK='#111418',MUTE='#6b7280',ACC='#2563eb',LINE='#e5e7eb';
const ICON={fire:'🔥',fade:'👑',sheep:'🐑',bad:'💀',round:'🍺'};
async function draw({P,S,O,me}){
  const {G,result,tally,simulate,awards,f1}=PP;
  const ids=Object.keys(P),T=tally(P,S),win=simulate(P,S,O),AW=awards(P,S,T);
  const lead=Math.max(0,...ids.map(id=>T[id].pts));
  const rows=ids.map(id=>({id,p:P[id],...T[id],w:win[id]||0,t:teamOf(id,P[id]),b:AW[id]||[]}));const _o=PP.rankOrder(P,S);rows.sort((a,b)=>_o.indexOf(a.id)-_o.indexOf(b.id));
  const W=1080,HEAD=190,ROW=92,PAD=40,H=HEAD+Math.max(1,rows.length)*ROW+PAD;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const C={};await Promise.all(rows.map(async r=>C[r.id]=await dataImg('C'+r.t.m+r.t.kit,crest(r.t.m,r.t.kit,128))));
  const L={};await Promise.all([...new Set(G.flatMap(g=>[g.a,g.h]))].map(async ab=>L[ab]=await svgImg('L'+ab,'logos/'+ab+'_light.svg')));
  c.fillStyle='#f4f5f7';c.fillRect(0,0,W,H);
  c.fillStyle=INK;c.font=F(800,56);c.fillText('Puck Pool',56,92);
  const fin=G.filter(g=>result(S,g)).length,live=G.filter(g=>PP.isLive(S[g.id])).length;
  const tm=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  c.fillStyle=MUTE;c.font=F(500,30);c.fillText(`Sat, Nov 21 · ${live?live+' live · ':''}${fin} of 14 final · ${tm}`,58,140);
  c.font=F(600,22);c.textAlign='right';c.fillText('PTS',870,HEAD-14);c.fillText('MAX',950,HEAD-14);c.fillText('WIN',1032,HEAD-14);c.textAlign='left';
  const y0=HEAD;c.fillStyle='#fff';c.beginPath();c.roundRect?c.roundRect(32,y0,W-64,Math.max(1,rows.length)*ROW,28):c.rect(32,y0,W-64,Math.max(1,rows.length)*ROW);c.fill();
  if(!rows.length){c.fillStyle=MUTE;c.font=F(500,34);c.fillText('No one yet.',80,y0+70)}
  rows.forEach((r,i)=>{
    const y=y0+i*ROW,out=r.max<lead-1e-9;
    if(i){c.fillStyle=LINE;c.fillRect(52,y,W-104,2)}
    c.globalAlpha=out?.5:1;
    c.fillStyle=MUTE;c.font=F(700,30);c.textAlign='center';c.fillText(String(i+1),72,y+56);c.textAlign='left';
    if(C[r.id])c.drawImage(C[r.id],96,y+16,56,56);
    c.font=F(700,32);c.fillStyle=INK;c.fillText(fit(c,r.p.name,140),164,y+56);
    G.forEach((g,j)=>{const k=r.p.picks[g.id];if(!k)return;const x=316+j*34,yy=y+33,res=result(S,g),ab=k==='H'?g.h:g.a;
      c.globalAlpha=(out?.5:1)*(res&&res!==k?.22:1);if(L[ab])c.drawImage(L[ab],x,yy,32,21);c.globalAlpha=out?.5:1;
      if(res===k){c.fillStyle='#16a34a';c.beginPath();c.arc(x+30,yy+21,5,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke()}});
    c.textAlign='right';c.font=F(800,36);c.fillStyle=INK;c.fillText(f1(r.pts),870,y+58);
    c.font=F(500,30);c.fillStyle=MUTE;c.fillText(f1(r.max),950,y+57);
    const pct=r.w>=.995&&r.w<1?'>99%':r.w>0&&r.w<.005?'<1%':Math.round(r.w*100)+'%';
    c.font=F(700,32);c.fillStyle=out?MUTE:ACC;c.fillText(out?'Out':pct,1032,y+58);c.textAlign='left';
    c.globalAlpha=1;
  });
  return cv;
}
return {draw};
})();
