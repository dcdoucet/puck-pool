// Little-league style crests: "<Name>'s <Mascot>". Each glyph is drawn in a 40x40 box.
const MASCOTS=['Raccoons','Flowers','Moose','Beavers','Geese','Lumberjacks','Owls','Bees','Donuts','Pickles','Yetis','Turtles'];
const KITS=[['#14284b','#f2b705'],['#b3132b','#ffffff'],['#1e6b3a','#f2c14e'],['#1f4fbf','#ffffff'],['#6b1d2f','#f2b705'],['#e8641b','#14284b'],['#4b2a7b','#f2c14e'],['#0f8a8a','#ffffff']];
const K='stroke="#111" stroke-width="1.8" stroke-linejoin="round"';
const GLYPH=[
 // Raccoons
 c=>`<circle cx="9" cy="9" r="5" fill="#7d838d" ${K}/><circle cx="31" cy="9" r="5" fill="#7d838d" ${K}/><ellipse cx="20" cy="22" rx="15" ry="13" fill="#b9bec7" ${K}/><path d="M5 20 Q20 11 35 20 Q30 28 20 23 Q10 28 5 20Z" fill="#1d1d1f"/><circle cx="13" cy="20" r="2.6" fill="#fff"/><circle cx="27" cy="20" r="2.6" fill="#fff"/><circle cx="13" cy="20" r="1.2" fill="#111"/><circle cx="27" cy="20" r="1.2" fill="#111"/><ellipse cx="20" cy="29.5" rx="6" ry="4" fill="#f1f1f1"/><circle cx="20" cy="28" r="2" fill="#111"/>`,
 // Flowers
 c=>[0,60,120,180,240,300].map(a=>`<ellipse cx="20" cy="9" rx="5.5" ry="8.5" fill="#fff" ${K} transform="rotate(${a} 20 20)"/>`).join('')+`<circle cx="20" cy="20" r="7" fill="#ffd23f" ${K}/><circle cx="17.5" cy="19" r="1" fill="#111"/><circle cx="22.5" cy="19" r="1" fill="#111"/><path d="M17 22 Q20 24.5 23 22" fill="none" stroke="#111" stroke-width="1.3"/>`,
 // Moose
 c=>`<path d="M14 15 Q4 16 2 5 L6 8 L7 2 L10 8 L13 3 L14 10Z M26 15 Q36 16 38 5 L34 8 L33 2 L30 8 L27 3 L26 10Z" fill="#e3c08d" ${K}/><path d="M13 14 Q20 10 27 14 L28 30 Q28 38 20 38 Q12 38 12 30Z" fill="#7a4a2a" ${K}/><circle cx="16" cy="20" r="1.5" fill="#111"/><circle cx="24" cy="20" r="1.5" fill="#111"/><ellipse cx="17.5" cy="33" rx="1.3" ry="1.8" fill="#111"/><ellipse cx="22.5" cy="33" rx="1.3" ry="1.8" fill="#111"/>`,
 // Beavers
 c=>`<circle cx="9" cy="9" r="4" fill="#7a4a24" ${K}/><circle cx="31" cy="9" r="4" fill="#7a4a24" ${K}/><circle cx="20" cy="20" r="14" fill="#9b6a3c" ${K}/><circle cx="14.5" cy="17" r="1.8" fill="#111"/><circle cx="25.5" cy="17" r="1.8" fill="#111"/><ellipse cx="20" cy="23" rx="7" ry="4.5" fill="#d9b48a"/><ellipse cx="20" cy="21.5" rx="2.6" ry="1.8" fill="#111"/><rect x="16.5" y="25" width="7" height="8" rx="1" fill="#fff" ${K}/><path d="M20 25 V33" stroke="#111" stroke-width="1.3"/>`,
 // Geese
 c=>`<path d="M13 38 Q10 22 16 12 Q20 5 27 8 Q30 11 26 14 Q20 18 21 38Z" fill="#1d1d1f" ${K}/><path d="M27 8.5 L37 11 L27 13.5Z" fill="#333" ${K}/><path d="M17.5 12.5 Q22 10.5 24.5 14.5 Q20.5 18 18 17Z" fill="#fff"/><circle cx="24" cy="10.5" r="1.1" fill="#fff"/><path d="M11 38 Q17 31 25 38Z" fill="#8a7a66" ${K}/>`,
 // Lumberjacks
 c=>`<path d="M8 36 L30 8 M32 36 L10 8" stroke="#111" stroke-width="5.5" stroke-linecap="round"/><path d="M8 36 L30 8 M32 36 L10 8" stroke="#c8925a" stroke-width="3" stroke-linecap="round"/><path d="M26 4 Q35 1 37 9 Q34 15 30 14 L27 9Z" fill="#d6dbe1" ${K}/><path d="M14 4 Q5 1 3 9 Q6 15 10 14 L13 9Z" fill="#d6dbe1" ${K}/>`,
 // Owls
 c=>`<path d="M7 9 L12 14 L9 15Z M33 9 L28 14 L31 15Z" fill="#6b4226" ${K}/><ellipse cx="20" cy="23" rx="14" ry="15" fill="#8a5a3c" ${K}/><ellipse cx="20" cy="30" rx="8" ry="7" fill="#e3c9a5"/><circle cx="14" cy="18" r="6" fill="#fff" ${K}/><circle cx="26" cy="18" r="6" fill="#fff" ${K}/><circle cx="14" cy="18" r="2.6" fill="#111"/><circle cx="26" cy="18" r="2.6" fill="#111"/><path d="M18 23 L22 23 L20 27Z" fill="#f29f05" ${K}/>`,
 // Bees
 c=>`<ellipse cx="13" cy="11" rx="7" ry="5" fill="#dff3ff" ${K} transform="rotate(-25 13 11)"/><ellipse cx="27" cy="11" rx="7" ry="5" fill="#dff3ff" ${K} transform="rotate(25 27 11)"/><ellipse cx="20" cy="25" rx="13" ry="10" fill="#ffd23f" ${K}/><path d="M15 15.6 Q12 25 15 34.4 L19 35 Q16 25 19 15.1Z M23 15.1 Q26 25 23 35 L27 34.1 Q29.5 25 27 15.9Z" fill="#1d1d1f"/><circle cx="10.5" cy="23" r="1.4" fill="#111"/><path d="M33 25 L38 25" stroke="#111" stroke-width="2" stroke-linecap="round"/>`,
 // Donuts
 c=>`<circle cx="20" cy="20" r="16" fill="#e0a85e" ${K}/><path d="M20 6.5 Q27 6 31 10 Q35 12 33.5 18 Q35 24 31 29 Q27 33.5 20 33.5 Q13 34 9 30 Q5 26 6.5 20 Q5 13 9.5 9.5 Q13 6.5 20 6.5Z" fill="#ff7ab8"/><circle cx="20" cy="20" r="5.5" fill="${c}" ${K}/>`+[[12,12,30],[27,11,-20],[30,21,60],[25,28,10],[13,27,-40],[9,19,80],[20,10,0],[17,30,45]].map(([x,y,a],i)=>`<rect x="${x-2}" y="${y-.8}" width="4" height="1.6" rx=".8" fill="${['#fff','#ffd23f','#3ec1ff','#7cff6b'][i%4]}" transform="rotate(${a} ${x} ${y})"/>`).join(''),
 // Pickles
 c=>`<ellipse cx="20" cy="20" rx="9" ry="17" fill="#6aa84f" ${K} transform="rotate(-25 20 20)"/><circle cx="15" cy="10" r="1.2" fill="#3d7a2a"/><circle cx="27" cy="27" r="1.2" fill="#3d7a2a"/><circle cx="12" cy="24" r="1.2" fill="#3d7a2a"/><circle cx="26" cy="12" r="1.2" fill="#3d7a2a"/><circle cx="17" cy="17" r="1.8" fill="#111"/><circle cx="23.5" cy="20" r="1.8" fill="#111"/><path d="M16 23 Q19 27 23 25" fill="none" stroke="#111" stroke-width="1.6" stroke-linecap="round"/>`,
 // Yetis
 c=>`<path d="M5 22 L7 12 L10 15 L13 6 L17 11 L20 4 L23 11 L27 6 L30 15 L33 12 L35 22 Q35 37 20 37 Q5 37 5 22Z" fill="#f4f7fb" ${K}/><ellipse cx="20" cy="24" rx="10" ry="9" fill="#9ec3e6" ${K}/><circle cx="16" cy="21" r="1.8" fill="#111"/><circle cx="24" cy="21" r="1.8" fill="#111"/><path d="M14 27 Q20 31 26 27Z" fill="#111"/><path d="M16 27.5 L17 29.5 L18 28Z M24 27.5 L23 29.5 L22 28Z" fill="#fff"/>`,
 // Turtles
 c=>`<ellipse cx="9" cy="32" rx="4" ry="3" fill="#9bd27a" ${K}/><ellipse cx="29" cy="32" rx="4" ry="3" fill="#9bd27a" ${K}/><circle cx="34" cy="20" r="5" fill="#9bd27a" ${K}/><circle cx="35.5" cy="18.5" r="1.1" fill="#111"/><path d="M4 30 Q4 10 19 10 Q32 10 32 30Z" fill="#2e8b57" ${K}/><path d="M12 30 L14 20 L24 20 L26 30 M14 20 L10 14 M24 20 L27 13 M19 10 V20" fill="none" stroke="#1b5e3a" stroke-width="1.6"/>`
];
function hashId(id){let x=0;for(const ch of id)x=(x*31+ch.charCodeAt(0))>>>0;return x}
function teamOf(id,p){const x=hashId(id);const m=Number.isInteger(p&&p.mascot)?p.mascot:x%MASCOTS.length;return{m,kit:KITS[(x>>>4)%KITS.length]}}
function teamName(name,m){return name+(/s$/i.test(name)?"'":"'s")+' '+MASCOTS[m]}
function crest(m,kit,size){
  const [a,b]=kit;
  return `<svg class="cr" width="${size||40}" height="${size||40}" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 5 H56 V30 Q56 50 32 61 Q8 50 8 30Z" fill="${a}" stroke="#111" stroke-width="3" stroke-linejoin="round"/><path d="M12.5 9.5 H51.5 V30 Q51.5 46.5 32 56 Q12.5 46.5 12.5 30Z" fill="none" stroke="${b}" stroke-width="1.8" stroke-dasharray="3 2.4"/><g transform="translate(13 9) scale(.95)">${GLYPH[m](a)}</g></svg>`;
}
