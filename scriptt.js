'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cx={add:(x,y)=>[x[0]+y[0],x[1]+y[1]],mul:(x,y)=>[x[0]*y[0]-x[1]*y[1],x[0]*y[1]+x[1]*y[0]],
 div:(x,y)=>{const d=y[0]*y[0]+y[1]*y[1];return[(x[0]*y[0]+x[1]*y[1])/d,(x[1]*y[0]-x[0]*y[1])/d]},
 cj:x=>[x[0],-x[1]],ab:x=>Math.hypot(x[0],x[1]),ar:x=>Math.atan2(x[1],x[0])};
const C={v:'#1f6feb',i:'#e5484d',sup:'#e8890c',abs:'#1a9a5b',q:'#8250df'};
const D={V:220,f:50,R:50,L:100,C:47};
const P={V:['Tegangan sumber','V RMS',1,500,1],f:['Frekuensi','Hz',1,1000,1],R:['Resistansi R','Ω',0.1,1000,0.1],L:['Induktansi L','mH',0.1,1000,0.1],C:['Kapasitansi C','µF',1,1000,1]};
let S={...D,topo:'RLCs',on:true,run:!matchMedia('(prefers-reduced-motion:reduce)').matches,spd:1,u:0},M,dirty=true;
const f=(x,d=2)=>{if(Math.abs(x)<0.5*10**-d)x=0;return x.toFixed(d)};
const fz=(z,d=2)=>`${f(z[0],d)} ${z[1]<0?'−':'+'} j${f(Math.abs(z[1]),d)}`;
const deg=r=>r*180/Math.PI;

function calc(s){
 const w=2*Math.PI*s.f,XL=w*s.L/1e3,XC=1/(w*s.C/1e6),hL=s.topo.includes('L'),hC=s.topo.includes('C'),par=s.topo==='RLCp';
 const V=s.on?[s.V,0]:[0,0],els=[],defs=[['Resistor (R)',[s.R,0]]];
 if(hL)defs.push(['Induktor (L)',[0,XL]]);
 if(hC)defs.push(['Kapasitor (C)',[0,-XC]]);
 let It,Z;
 if(par){defs.forEach(([n,z])=>els.push({n,Z:z,V,I:cx.div(V,z)}));It=els.reduce((a,e)=>cx.add(a,e.I),[0,0]);
  Z=cx.div([1,0],defs.reduce((a,d)=>cx.add(a,cx.div([1,0],d[1])),[0,0]))}
 else{Z=defs.reduce((a,d)=>cx.add(a,d[1]),[0,0]);It=cx.div(V,Z);defs.forEach(([n,z])=>els.push({n,Z:z,V:cx.mul(It,z),I:It}))}
 els.forEach(e=>e.S=cx.mul(e.V,cx.cj(e.I)));
 const Ss=cx.mul(V,cx.cj(It)),src={n:'Sumber AC',V,I:It,S:[-Ss[0],-Ss[1]]};
 const all=[src,...els],tot=all.reduce((a,e)=>cx.add(a,e.S),[0,0]),Sa=cx.ab(Ss);
 return{w,XL,XC,Z,V,els,src,all,tot,It,P:Ss[0],Q:Ss[1],Sa,I:cx.ab(It),ti:cx.ar(It),pf:Sa>1e-12?Ss[0]/Sa:1,phi:Sa>1e-12?Math.atan2(Ss[1],Ss[0]):0,par};
}
const sifat=m=>m.Sa<1e-9?'-':Math.abs(m.Q)<1e-6*Math.max(1,m.Sa)?'Resistif (arus sefase)':m.Q>0?'Induktif (arus tertinggal)':'Kapasitif (arus mendahului)';

/* ---------- kontrol ---------- */
$('#sliders').innerHTML=Object.entries(P).map(([k,[l,u,mn,mx,st]])=>`<div class="row" id="w_${k}"><label for="n_${k}">${l} (${u})</label><input type="number" id="n_${k}" min="${mn}" max="${mx}" step="${st}"><input type="range" id="r_${k}" min="${mn}" max="${mx}" step="${st}" aria-label="${l}"></div>`).join('');
const err=m=>$('#err').textContent=m;
Object.keys(P).forEach(k=>{
 $('#r_'+k).oninput=e=>{S[k]=+e.target.value;err('');render()};
 $('#n_'+k).oninput=e=>{const v=parseFloat(e.target.value),[l,u,mn,mx]=P[k];
  if(!isFinite(v)||v<mn||v>mx){err(`${l} harus berupa angka ${mn} sampai ${mx} ${u}. Nilai negatif atau nol tidak diperbolehkan.`);return}
  S[k]=v;err('');render(true)};
 $('#n_'+k).onchange=()=>{err('');render()};
});
$('#topo').onchange=e=>{S.topo=e.target.value;render()};
$('#bOn').onclick=()=>{S.on=!S.on;render()};
$('#bRun').onclick=()=>{S.run=!S.run;render()};
$('#bRep').onclick=()=>{S.u=0;S.run=true;render()};
$('#bRst').onclick=()=>{Object.assign(S,D,{topo:'RLCs',on:true,run:true,spd:1,u:0});$('#spd').value=1;err('');render()};
$('#spd').oninput=e=>{S.spd=+e.target.value;render(true)};
$('#bForm').onclick=()=>{$('#formulas').hidden=!$('#formulas').hidden};

/* ---------- diagram rangkaian ---------- */
const sym={R:'M-30 0H-20L-15-9-5 9 5-9 15 9 20 0H30',L:'M-30 0H-24a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0H30',C:'M-30 0H-5M-5-14V14M5-14V14M5 0H30'};
function ckt(){
 const par=M.par,keys=['R',...(S.topo.includes('L')?['L']:[]),...(S.topo.includes('C')?['C']:[])],n=keys.length;
 const val={R:`R = ${S.R} Ω`,L:`L = ${S.L} mH`,C:`C = ${S.C} µF`};
 const xs=keys.map((_,i)=>par?(n===1?280:160+i*120):70+400*(i+1)/(n+1));
 let o=`<path d="M70 93V45H470V185H70V137" fill="none" stroke="#17324d" stroke-width="2"/>`;
 if(par)xs.forEach(x=>o+=`<path d="M${x} 45V185" stroke="#17324d" stroke-width="2"/><circle cx="${x}" cy="45" r="3.5"/><circle cx="${x}" cy="185" r="3.5"/>`);
 o+=par?`<path class="flow" data-k="T" d="M70 93V45H470V185H70V137"/>`+xs.map((x,k)=>`<path class="flow" data-k="${k}" d="M${x} 45V185"/>`).join(''):`<path class="flow" data-k="T" d="M70 93V45H470V185H70V137"/>`;
 o+=`<circle cx="70" cy="115" r="22" fill="#fff" stroke="${C.v}" stroke-width="2.5"/><path d="M58 115q6-14 12 0t12 0" fill="none" stroke="${C.v}" stroke-width="2"/><text x="52" y="84" font-size="14" fill="${C.v}">+</text><text x="70" y="218" text-anchor="middle" font-size="11" fill="${C.v}">Sumber ${S.V} V, ${S.f} Hz</text>`;
 keys.forEach((k,i)=>{const e=M.els[i],x=xs[i],y=par?115:45,vt=par?' rotate(90)':'';
  o+=`<g transform="translate(${x} ${y})${vt}"><rect x="-31" y="-15" width="62" height="30" fill="#fff"/><path d="${sym[k]}" fill="none" stroke="${k==='R'?'#17324d':k==='L'?C.q:C.abs}" stroke-width="2.5"/></g>`;
  const tx=par?x+20:x,ty=par?100:y+34,an=par?'start':'middle';
  o+=`<text x="${tx}" y="${ty}" text-anchor="${an}" font-size="12" font-weight="700">${val[k]}</text><text x="${tx}" y="${ty+14}" text-anchor="${an}" font-size="10.5" fill="#4a5f75">V=${f(cx.ab(e.V))} V</text><text x="${tx}" y="${ty+27}" text-anchor="${an}" font-size="10.5" fill="${C.i}">I=${f(cx.ab(e.I),3)} A</text>`});
 o+=`<path d="M${par?460:470} 105l-6-10h12z" fill="${C.i}" transform="${par?'translate(10 40)':'translate(0 0)'}"/><text x="${par?400:478}" y="${par?170:108}" font-size="10" fill="${C.i}">${par?'':'arah acuan I'}</text>`;
 $('#ckt').innerHTML=o;
}

/* ---------- hasil, tabel, grafik batang ---------- */
function res(){const m=M,it=[['ω',f(m.w)+' rad/s'],['X_L',f(m.XL)+' Ω'],['X_C',f(m.XC)+' Ω'],['Z',fz(m.Z)+' Ω'],['|Z|',f(cx.ab(m.Z))+' Ω'],['I (RMS)',f(m.I,3)+' A'],['φ (V−I)',f(deg(m.phi))+'°'],['Faktor daya',f(m.pf,3)],['Sifat beban',sifat(m)],['P',f(m.P)+' W'],['Q',f(m.Q)+' var'],['|S|',f(m.Sa)+' VA']];
 $('#res').innerHTML=it.map(([a,b])=>`<div>${a}<b>${b}</b></div>`).join('')}
const tolOf=m=>1e-6*(1+m.Sa);
function bal(){const m=M,t=m.tot,tol=tolOf(m),ok=Math.abs(t[0])<=tol&&Math.abs(t[1])<=tol;
 const row=e=>`<tr><td>${e.n}</td><td>${f(e.S[0])}</td><td>${f(e.S[1])}</td><td>${f(cx.ab(e.S))}</td></tr>`;
 const sup=[-m.src.S[0],-m.src.S[1]],ld=cx.add(m.tot,m.src.S.map(x=>-x));
 $('#bal').innerHTML=`<div class="tw"><table><tr><th>Elemen (daya diserap)</th><th>P (W)</th><th>Q (var)</th><th>|S| (VA)</th></tr>${m.all.map(row).join('')}<tr class="tot"><td>Total (jumlah kompleks)</td><td>${f(t[0],6)}</td><td>${f(t[1],6)}</td><td>${f(cx.ab(t),6)}</td></tr></table></div>
 <p>Sumber menyuplai: <b>${f(sup[0])} W</b> dan <b>${f(sup[1])} var</b>. Beban menyerap: <b>${f(ld[0])} W</b> dan <b>${f(ld[1])} var</b>. Selisih: ΔP = ${f(t[0],9)} W, ΔQ = ${f(t[1],9)} var.</p>
 <p>ΣP = ${f(t[0],6)} ; ΣQ = ${f(t[1],6)} ; ΣS = ${fz(t,6)} (toleransi ${tol.toExponential(1)})</p>
 <span class="badge ${!S.on?'idle':ok?'ok':'bad'}">${!S.on?'Sumber mati: semua daya nol':ok?'Keseimbangan daya TERPENUHI':'Keseimbangan daya TIDAK terpenuhi'}</span>
 <p class="note">Tanda pasif: sumber yang memberi daya bernilai negatif. Kolom |S| tidak dijumlahkan; keseimbangan dibuktikan oleh jumlah kompleks S.</p>`}
function bars(){const m=M,mx=Math.max(m.Sa,1e-9),r=(l,v,c,u)=>`<div class="bar"><span>${l}</span><span><i style="width:${Math.min(100,Math.abs(v)/mx*100)}%;background:${c}"></i></span><span>${f(v)} ${u}</span></div>`;
 $('#bars').innerHTML=r('P aktif',m.P,C.abs,'W')+r('Q reaktif',m.Q,C.q,'var')+r('|S| semu',m.Sa,C.sup,'VA')+`<p class="note">Panjang batang diskalakan terhadap |S|. Q negatif (kapasitif) ditandai nilainya. Data dari perhitungan langsung.</p>`}

/* ---------- kanvas ---------- */
function cv(c){const d=devicePixelRatio||1,r=c.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);
 if(c.width!==w*d||c.height!==h*d){c.width=w*d;c.height=h*d}const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);g.font='12px sans-serif';return{g,w,h}}
const ln=(g,p,c,wd)=>{g.beginPath();p.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.strokeStyle=c;g.lineWidth=wd;g.stroke()};
function arr(g,x1,y1,x2,y2,c,lw=3){g.strokeStyle=g.fillStyle=c;g.lineWidth=lw;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();const a=Math.atan2(y2-y1,x2-x1);g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-11*Math.cos(a-.4),y2-11*Math.sin(a-.4));g.lineTo(x2-11*Math.cos(a+.4),y2-11*Math.sin(a+.4));g.fill()}
function axes(g,x0,W,y0,h){g.strokeStyle='#c9d6e2';g.lineWidth=1;g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+W,y0);g.moveTo(x0,8);g.lineTo(x0,h-14);g.stroke();g.fillStyle='#5b6b7c';
 ['0','T','2T'].forEach((t,k)=>g.fillText(t,x0+W*k/2-(k?6:0),h-2));g.fillText('t',x0+W-8,y0-4)}
function drawWave(){const{g,w,h}=cv($('#cw')),x0=40,W=w-x0-10,y0=h/2,A=h/2-30,N=200,im=M.I*Math.SQRT2;
 axes(g,x0,W,y0,h);const pv=[],pi=[];
 for(let k=0;k<=N;k++){const th=4*Math.PI*k/N,x=x0+W*k/N;pv.push([x,y0-(S.on?Math.sin(th):0)*A]);pi.push([x,y0-(im>0?Math.sin(th+M.ti):0)*A])}
 ln(g,pv,C.v,2.5);ln(g,pi,C.i,2.5);
 const th=2*Math.PI*S.u,x=x0+W*S.u/2;g.setLineDash([4,4]);ln(g,[[x,8],[x,h-14]],'#8a99a8',1);g.setLineDash([]);
 [[C.v,S.on?Math.sin(th):0],[C.i,im>0?Math.sin(th+M.ti):0]].forEach(([c,s])=>{g.fillStyle=c;g.beginPath();g.arc(x,y0-s*A,5,0,7);g.fill()});
 g.fillStyle=C.v;g.fillText(`v(t): Vm = ${f(S.on?S.V*Math.SQRT2:0)} V`,x0+6,14);g.fillStyle=C.i;g.fillText(`i(t): Im = ${f(im,3)} A, φ = ${f(deg(M.phi),1)}°`,x0+6,28);
 g.fillStyle='#5b6b7c';g.textAlign='right';g.fillText(`T = ${f(1000/S.f,2)} ms`,w-10,14);g.textAlign='left'}
function drawPow(){const{g,w,h}=cv($('#cp')),x0=40,W=w-x0-10,y0=h/2,A=h/2-24,N=200,Vm=S.on?S.V*Math.SQRT2:0,Im=M.I*Math.SQRT2,pm=M.P+M.Sa>1e-9?M.P+M.Sa:1,pts=[];
 axes(g,x0,W,y0,h);
 for(let k=0;k<=N;k++){const th=4*Math.PI*k/N,p=Vm*Im*Math.sin(th)*Math.sin(th+M.ti),x=x0+W*k/N,y=y0-p/pm*A;
  g.fillStyle=p>=0?'#1a9a5b55':'#e5484d55';g.fillRect(x,Math.min(y,y0),W/N+1,Math.abs(y-y0));pts.push([x,y])}
 ln(g,pts,'#0b6e4f',2);const yp=y0-M.P/pm*A;g.setLineDash([6,4]);ln(g,[[x0,yp],[x0+W,yp]],C.sup,2);g.setLineDash([]);
 g.fillStyle=C.sup;g.fillText(`P rata-rata = ${f(M.P)} W`,x0+6,14);g.fillStyle='#0b6e4f';g.fillText('p(t) (W)',x0+6,28);
 const th=2*Math.PI*S.u,x=x0+W*S.u/2,p=Vm*Im*Math.sin(th)*Math.sin(th+M.ti);g.fillStyle='#0b6e4f';g.beginPath();g.arc(x,y0-p/pm*A,5,0,7);g.fill()}
function drawPh(){const{g,w,h}=cv($('#cph')),X=w/2,Y=h/2,R=Math.min(w,h)/2-26;
 g.strokeStyle='#c9d6e2';g.beginPath();g.moveTo(X-R,Y);g.lineTo(X+R,Y);g.moveTo(X,Y-R);g.lineTo(X,Y+R);g.stroke();g.fillStyle='#5b6b7c';g.fillText('Re',X+R-14,Y-5);g.fillText('Im',X+4,Y-R+10);
 if(!S.on){g.fillText('Sumber OFF',X-30,Y+30);return}
 arr(g,X,Y,X+.9*R,Y,C.v);g.fillStyle=C.v;g.fillText(`V = ${f(S.V)} V ∠0°`,X+.2*R,Y+16);
 const a=M.ti,L=.6*R;arr(g,X,Y,X+L*Math.cos(a),Y-L*Math.sin(a),C.i);g.fillStyle=C.i;g.fillText(`I = ${f(M.I,3)} A ∠${f(deg(a),1)}°`,X+L*Math.cos(a)*.5+6,Y-L*Math.sin(a)*.5-8);
 g.strokeStyle='#5b6b7c';g.beginPath();g.arc(X,Y,.3*R,0,-a,a>0);g.stroke();g.fillStyle='#17324d';g.fillText(`φ = ${f(deg(M.phi),1)}°`,X+.32*R,Y+(a>0?-6:16)*(a>0?1:-1));
 g.fillStyle='#5b6b7c';g.fillText('Panjang fasor dinormalkan',8,h-6)}
function drawTri(){const{g,w,h}=cv($('#ctr')),P0=M.P,Q=M.Q,ox=36,oy=h/2;
 g.strokeStyle='#c9d6e2';g.beginPath();g.moveTo(ox,oy);g.lineTo(w-8,oy);g.moveTo(ox,8);g.lineTo(ox,h-8);g.stroke();g.fillStyle='#5b6b7c';g.fillText('P',w-16,oy-6);g.fillText('Q',ox+6,14);
 if(M.Sa<1e-9){g.fillText('Sumber OFF',ox+30,oy+30);return}
 const k=Math.min((w-ox-30)/Math.max(P0,1e-9),(h/2-30)/Math.max(Math.abs(Q),1e-9)),px=ox+k*P0,qy=oy-k*Q;
 g.strokeStyle=C.abs;g.lineWidth=3;ln(g,[[ox,oy],[px,oy]],C.abs,3);ln(g,[[px,oy],[px,qy]],C.q,3);ln(g,[[ox,oy],[px,qy]],C.sup,3);
 g.fillStyle=C.abs;g.fillText(`P = ${f(P0)} W`,ox+(px-ox)/2-30,oy+(Q>0?16:-8));g.fillStyle=C.q;g.fillText(`Q = ${f(Q)} var`,Math.min(px+6,w-90),(oy+qy)/2);g.fillStyle=C.sup;g.fillText(`|S| = ${f(M.Sa)} VA`,ox+8,qy+(Q>0?-8:18));
 g.strokeStyle='#5b6b7c';g.lineWidth=1;g.beginPath();g.arc(ox,oy,28,0,-M.phi,M.phi>0);g.stroke()}

/* ---------- eksperimen ---------- */
const EX=[
{t:'1. Beban resistif',topo:'R',set:{V:220,f:50,R:50},tj:'Mengamati v, i, p pada beban resistif.',lg:'Muat eksperimen. Ubah R dan V. Amati gelombang v dan i.',hs:'v dan i sefase, φ = 0°, faktor daya 1, Q = 0, p(t) tidak pernah negatif.',tn:'Berapa P bila R diubah menjadi 100 Ω pada 220 V? (484 W)'},
{t:'2. Beban induktif',topo:'RL',set:{V:220,f:50,R:20,L:200},tj:'Mengamati arus tertinggal dan Q positif.',lg:'Muat eksperimen. Naikkan L. Perhatikan puncak i(t) dan fasor I.',hs:'Arus tertinggal dari tegangan, φ > 0, Q > 0 (induktif).',tn:'Mengapa p(t) sempat negatif? Apa yang terjadi pada energi saat itu?'},
{t:'3. Beban kapasitif',topo:'RC',set:{V:220,f:50,R:20,C:47},tj:'Mengamati arus mendahului dan Q negatif.',lg:'Muat eksperimen. Naikkan C dan f. Amati sudut φ.',hs:'Arus mendahului tegangan, φ < 0, Q < 0 (kapasitif).',tn:'Apa arti Q negatif pada tanda pasif?'},
{t:'4. Rangkaian RLC',topo:'RLCs',set:{V:220,f:50,R:30,L:100,C:47},tj:'Mengamati |Z|, φ, faktor daya, dan keseimbangan saat R, L, C, f berubah.',lg:'Muat eksperimen. Ubah f hingga X_L = X_C (sekitar 73,4 Hz).',hs:'Saat resonansi |Z| = R minimum, I maksimum, faktor daya 1, Q = 0.',tn:'Mengapa Q total nol di resonansi padahal Q_L dan Q_C tidak nol?'},
{t:'5. Pengujian kekekalan daya',topo:'RLCp',set:{V:220,f:50,R:50,L:100,C:47},tj:'Membuktikan jumlah daya kompleks semua elemen sama dengan nol.',lg:'Muat eksperimen. Lihat tabel keseimbangan, lalu ganti ke RLC seri dan ubah parameter.',hs:'ΣP = ΣQ = 0 dalam toleransi; status hijau. Paralel: P≈968 W, Q≈825,9 var.',tn:'Mengapa |S| elemen tidak boleh dijumlahkan langsung?'}];
$('#exps').innerHTML=EX.map((e,i)=>`<details><summary>${e.t}</summary><p><b>Tujuan:</b> ${e.tj}</p><p><b>Langkah:</b> ${e.lg}</p><p><b>Hasil yang diharapkan:</b> ${e.hs}</p><p><b>Pertanyaan evaluasi:</b> ${e.tn}</p><button data-e="${i}">Muat eksperimen</button></details>`).join('');
$$('[data-e]').forEach(b=>b.onclick=()=>{const e=EX[+b.dataset.e];Object.assign(S,D,e.set,{topo:e.topo,on:true,run:true});err('');render();scrollTo({top:0,behavior:'smooth'})});
function selfTest(){return[['R',{},968,0],['RLCs',{},654.6,-792.3],['RLCp',{},968,825.9]].map(([t,o,p,q])=>{const m=calc({...D,...o,topo:t,on:true}),ok=Math.abs(m.P-p)<.003*Math.abs(p)+.05&&Math.abs(m.Q-q)<.003*Math.abs(q)+.05&&cx.ab(m.tot)<1e-6;return`${ok?'LULUS':'GAGAL'}  ${t}: P=${f(m.P)} W (acuan ${p}), Q=${f(m.Q)} var (acuan ${q}), |ΣS|=${cx.ab(m.tot).toExponential(1)}`}).join('\n')}
$('#bTest').onclick=()=>$('#testOut').textContent=selfTest();

/* ---------- kuis ---------- */
const QZ=[
{q:'Beban induktif murni memiliki daya reaktif…',o:['Positif','Negatif','Nol','Sama dengan P'],a:0,e:'Pada tanda pasif, induktor menyerap Q positif dan arus tertinggal dari tegangan.'},
{q:'Pada RLC seri dengan X_L = X_C, faktor daya adalah…',o:['0','0,5','1','Tak terhingga'],a:2,e:'Reaktansi bersih nol, Z = R, φ = 0°, cos φ = 1.'},
{q:'Sumber memberi 500 W ke rangkaian. Daya yang diserap sumber pada konvensi tanda pasif adalah…',o:['+500 W','−500 W','0 W','+250 W'],a:1,e:'Sumber yang memberi daya menyerap daya negatif sehingga ΣP = 0.'},
{q:'Daya aktif rata-rata kapasitor ideal adalah…',o:['VI','I²R','Nol','Tergantung frekuensi saja'],a:2,e:'Tegangan dan arus berbeda fase 90°; energi hanya disimpan dan dikembalikan.'},
{q:'Arus mendahului tegangan 30°. Beban bersifat…',o:['Induktif, Q > 0','Kapasitif, Q < 0','Resistif, Q = 0','Induktif, Q < 0'],a:1,e:'Arus mendahului berarti φ = −30° sehingga Q = VI sin φ < 0 (kapasitif).'},
{q:'Mengapa keseimbangan daya AC dibuktikan dengan daya kompleks?',o:['Karena |S| tiap elemen dapat dijumlahkan','Karena S = V I* menjaga tanda dan sudut P dan Q','Karena hanya P yang berarti','Karena Q selalu nol'],a:1,e:'Jumlah aljabar S (P + jQ) valid, sedangkan jumlah |S| mengabaikan sudut fase.'}];
function quiz(){$('#qz').innerHTML=QZ.map((x,i)=>`<fieldset><legend>${i+1}. ${x.q}</legend>${x.o.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${o}</label>`).join('')}<p id="ex${i}"></p></fieldset>`).join('');$('#qScore').textContent=''}
$('#qChk').onclick=()=>{let s=0;QZ.forEach((x,i)=>{const c=document.querySelector(`input[name=q${i}]:checked`),ok=c&&+c.value===x.a;s+=ok?1:0;$('#ex'+i).innerHTML=`<span class="${ok?'good':'wrong'}">${c?ok?'Benar.':'Kurang tepat.':'Belum dijawab.'}</span> ${x.e}`});$('#qScore').textContent=`Skor: ${s} dari ${QZ.length} (${Math.round(s/QZ.length*100)}%)`};
$('#qRst').onclick=quiz;quiz();

/* ---------- tantangan ---------- */
const CH=[{q:'Atur RLC seri hingga faktor daya ≥ 0,99 dengan P ≥ 100 W.',t:m=>S.topo==='RLCs'&&m.pf>=.99&&m.P>=100},
{q:'Buat rangkaian bersifat kapasitif dengan Q ≤ −200 var.',t:m=>S.on&&m.Q<=-200},
{q:'Buat sudut φ antara 44° dan 46° (induktif) pada konfigurasi apa saja.',t:m=>S.on&&deg(m.phi)>=44&&deg(m.phi)<=46},
{q:'Buat selisih keseimbangan daya |ΣS| ≤ 1e-6 dengan sumber ON dan P ≥ 500 W (cek tabel).',t:m=>S.on&&m.P>=500&&cx.ab(m.tot)<=1e-6}];
$('#chs').innerHTML=CH.map((c,i)=>`<option value="${i}">Tantangan ${i+1}</option>`).join('');
$('#chs').onchange=()=>render(true);
function chal(){const c=CH[+$('#chs').value||0];$('#chq').textContent=c.q;const ok=c.t(M);$('#chst').textContent=ok?'Tantangan tercapai!':'Belum tercapai. Ubah parameter di panel kontrol.';$('#chst').className='big '+(ok?'good':'')}

/* ---------- tab, loop ---------- */
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));$$('.pane').forEach(p=>p.hidden=p.id!=='p_'+b.dataset.t)});
function render(skip){M=calc(S);
 Object.keys(P).forEach(k=>{$('#r_'+k).value=S[k];if(!skip)$('#n_'+k).value=S[k];const off=(k==='L'&&!S.topo.includes('L'))||(k==='C'&&!S.topo.includes('C'));$('#n_'+k).disabled=$('#r_'+k).disabled=off;$('#w_'+k).style.opacity=off?.45:1});
 $('#topo').value=S.topo;$('#bOn').textContent='Sumber: '+(S.on?'ON':'OFF');$('#bRun').textContent=S.run?'Jeda':'Putar';$('#spdv').textContent=S.spd.toFixed(1)+'×';
 const sv=$('#ckt');sv.style.setProperty('--sp',S.spd);sv.classList.toggle('off',!S.on);sv.classList.toggle('paused',!S.run);
 ckt();res();bal();bars();drawPh();drawTri();chal();dirty=true}
function frame(){if(!S.run&&!dirty)return;dirty=false;drawWave();drawPow();
 const th=2*Math.PI*S.u,v=S.on?Math.SQRT2*S.V*Math.sin(th):0,i=Math.SQRT2*M.I*Math.sin(th+M.ti),p=v*i;
 $$('#ckt .flow').forEach(n=>{const I=n.dataset.k==='T'?M.It:M.els[+n.dataset.k].I;n.classList.toggle('rv',Math.sin(th+cx.ar(I))<0)});
 $('#live').textContent=S.on?`t = ${f(S.u*1000/S.f,2)} ms, v = ${f(v)} V, i = ${f(i,3)} A, p = ${f(p)} W. ${p>=0?'p ≥ 0: sumber menyuplai energi ke rangkaian.':'p < 0: energi dikembalikan ke sumber oleh L atau C.'}`:'Sumber OFF: tegangan, arus, dan daya nol.'}
let last=0;function loop(ts){const dt=Math.min((ts-last)/1000,.1);last=ts;if(S.run)S.u=(S.u+dt*.5*S.spd)%2;frame();requestAnimationFrame(loop)}
addEventListener('resize',()=>{drawPh();drawTri();dirty=true});
render();requestAnimationFrame(loop);
