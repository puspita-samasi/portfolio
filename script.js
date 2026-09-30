(function(){
  const root=document.documentElement;
  const mq=window.matchMedia('(prefers-color-scheme: dark)');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDark=()=>root.dataset.theme?root.dataset.theme==='dark':mq.matches;

  /* header border + active nav */
  const top=document.getElementById('top');
  const links=[...document.querySelectorAll('.nav a')];
  const secs=links.map(a=>document.querySelector(a.getAttribute('href')));
  addEventListener('scroll',()=>{
    top.classList.toggle('scrolled',scrollY>8);
    let cur=-1;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<innerHeight*.35)cur=i});
    links.forEach((a,i)=>a.classList.toggle('on',i===cur));
  },{passive:true});

  /* shared pointer, in viewport coordinates */
  const P={x:-9999,y:-9999};
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){P.x=e.clientX;P.y=e.clientY}},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{P.x=P.y=-9999});

  /* polka-dot field: small dots on an offset grid that swell gently near the cursor and ripple on click */
  function Field(cv,o){
    const ctx=cv.getContext('2d');let W=0,H=0,ripples=[],visible=true;
    function size(){
      const dpr=Math.min(devicePixelRatio||1,2);
      if(o.fixed){W=innerWidth;H=innerHeight}else{const b=cv.getBoundingClientRect();W=b.width;H=b.height}
      cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      if(reduce)draw(0);
    }
    function draw(t){
      ctx.clearRect(0,0,W,H);
      const c=o.colors(),G=o.gap;
      let ox=0,oy=0;if(!o.fixed){const b=cv.getBoundingClientRect();ox=b.left;oy=b.top}
      const mx=P.x-ox,my=P.y-oy;
      const sy=(o.fixed&&!reduce)?(scrollY*.12)%G:0;
      for(let row=-1;row*G<H+G;row++){
        const off=(row&1)?G/2:0,py=row*G-sy;
        for(let x=-G;x<W+G;x+=G){
          const px=x+off;
          let r=o.base+(reduce?0:Math.sin(px*.011+py*.015+t*.0007)*o.wave),a=c.alpha,hot=0;
          const dx=px-mx,dy=py-my,d2=dx*dx+dy*dy;
          if(d2<o.reach*o.reach){const k=1-Math.sqrt(d2)/o.reach;r+=k*k*o.swell;a+=k*o.boost;hot=k}
          for(const rp of ripples){const rd=Math.abs(Math.hypot(px-rp.x,py-rp.y)-rp.r);if(rd<18){const k=(1-rd/18)*rp.life;r+=k*o.swell*.6;a+=k*o.boost*.6;hot=Math.max(hot,k)}}
          ctx.globalAlpha=Math.min(a,.55);
          ctx.fillStyle=hot>.4?c.accent:c.dot;
          ctx.beginPath();ctx.arc(px,py,Math.max(r,.3),0,6.283);ctx.fill();
        }
      }
      ctx.globalAlpha=1;
    }
    function tick(now){
      if(visible){ripples.forEach(r=>{r.r+=4.5;r.life-=.014});ripples=ripples.filter(r=>r.life>0);draw(now)}
      requestAnimationFrame(tick);
    }
    this.ripple=(cx,cy)=>{let ox=0,oy=0;if(!o.fixed){const b=cv.getBoundingClientRect();ox=b.left;oy=b.top;if(cx<ox||cy<oy||cx>ox+W||cy>oy+H)return}ripples.push({x:cx-ox,y:cy-oy,r:0,life:1})};
    this.redraw=()=>{if(reduce)draw(0)};
    addEventListener('resize',size);
    if(!o.fixed&&'ResizeObserver' in window)new ResizeObserver(size).observe(cv.parentElement);
    if(!o.fixed&&'IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(cv);
    size();if(!reduce)requestAnimationFrame(tick);
  }

  let pal={};
  function readColors(){const cs=getComputedStyle(root);pal={dot:cs.getPropertyValue('--dot').trim()||'#3a2521',alpha:parseFloat(cs.getPropertyValue('--dot-alpha'))||.08,accent:cs.getPropertyValue('--marigold').trim()||'#d4621f'}}
  readColors();
  const page=new Field(document.getElementById('dots'),{fixed:true,gap:28,base:1,wave:.3,reach:120,swell:2.4,boost:.16,colors:()=>pal});
  const contact=new Field(document.getElementById('cdots'),{fixed:false,gap:24,base:1.3,wave:.35,reach:150,swell:3.2,boost:.35,colors:()=>({dot:'#efe3cf',alpha:.16,accent:'#f08a45'})});
  addEventListener('pointerdown',e=>{if(reduce||e.target.closest('input,select,button,a'))return;page.ripple(e.clientX,e.clientY);contact.ripple(e.clientX,e.clientY)},{passive:true});
  const onTheme=()=>{readColors();page.redraw()};
  mq.addEventListener&&mq.addEventListener('change',onTheme);

  /* theme toggle */
  document.getElementById('theme').addEventListener('click',()=>{
    root.dataset.theme=isDark()?'light':'dark';
    try{localStorage.setItem('ps-theme',root.dataset.theme)}catch(e){}
    onTheme();
  });

  /* every card reacts to the cursor: spotlight + dot reveal */
  document.addEventListener('pointermove',e=>{
    const c=e.target.closest&&e.target.closest('.ia');
    document.querySelectorAll('.ia.hot').forEach(x=>{if(x!==c)x.classList.remove('hot')});
    if(!c||e.pointerType!=='mouse')return;
    const b=c.getBoundingClientRect();
    c.style.setProperty('--mx',(e.clientX-b.left)+'px');c.style.setProperty('--my',(e.clientY-b.top)+'px');
    c.classList.add('hot');
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>document.querySelectorAll('.ia.hot').forEach(x=>x.classList.remove('hot')));

  /* hero eval feed */
  const feed=document.getElementById('feed');
  const RULES=['ProductCode','PaymentCode','MaxAmount','CampaignWindow'];
  let id=48217;
  if(!reduce)setInterval(()=>{
    const ok=Math.random()>.22,li=document.createElement('li');
    li.innerHTML=`<span class="id">txn#${id++}</span><span class="ru">${RULES[Math.random()*RULES.length|0]}</span><span class="v ${ok?'ok':'no'}">${ok?'PASS':'BLOCK'}</span><span class="ms">${8+(Math.random()*9|0)}ms</span>`;
    feed.prepend(li);while(feed.children.length>5)feed.lastElementChild.remove();
  },1600);

  /* rules playground: mirrors transaction.grl */
  const amt=document.getElementById('amt'),prod=document.getElementById('product'),pay=document.getElementById('pay'),day=document.getElementById('day');
  const amtOut=document.getElementById('amtOut');
  const list=document.getElementById('rules'),verdict=document.getElementById('verdict'),el=document.getElementById('elapsed');
  let dayV=1,payV='payu';
  const inr=n=>'₹'+n.toLocaleString('en-IN');
  function evaluate(){
    const a=+amt.value,p=prod.value;
    amtOut.textContent=inr(a);
    const rs=[
      ['ProductCode',p==='amazon',p==='amazon'?'"amazon" matches':'"'+p+'" ≠ "amazon"'],
      ['PaymentCode',payV==='payu',payV==='payu'?'"payu" matches':'"'+payV+'" ≠ "payu"'],
      ['MaxAmount',a<=10000,a<=10000?inr(a)+' ≤ ₹10,000':inr(a)+' exceeds ₹10,000'],
      ['CampaignWindow',dayV===1,dayV===1?'campaign active':(dayV===0?'campaign not started':'campaign ended')]
    ];
    list.innerHTML=rs.map(([n,ok,w])=>`<li class="${ok?'pass':'fail'}"><span class="dotv"></span><span>${n}</span><span class="why">${w}</span></li>`).join('');
    const failed=rs.filter(r=>!r[1]);
    if(!failed.length){verdict.textContent='Eligible · '+inr(Math.round(a*.1))+' cashback';verdict.className='ok'}
    else{verdict.textContent='Blocked by '+failed[0][0];verdict.className='no'}
    el.textContent='evaluated in '+(9+((a/100+p.length+payV.length)%7|0))+'ms';
  }
  function seg(group,set){group.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;set(b.dataset.v);[...group.children].forEach(x=>x.setAttribute('aria-pressed',x===b));evaluate()})}
  seg(pay,v=>payV=v);seg(day,v=>dayV=+v);
  [amt,prod].forEach(x=>x.addEventListener('input',evaluate));
  document.getElementById('txform').addEventListener('submit',e=>e.preventDefault());
  evaluate();

  /* skills: one cloud, filterable by group */
  const CATS=[['lang','Languages'],['backend','Backend'],['data','Data'],['cloud','Cloud & streaming'],['ai','AI tools'],['tools','Daily tools']];
  const SK=[
    ['Golang','lang',1],['C / C++','lang'],['Node.js','lang'],['Vue.js','lang'],['Python','lang'],
    ['Microservices','backend',1],['gRPC','backend',1],['Protocol Buffers','backend'],['REST APIs','backend',1],['Grule','backend'],['GORM','backend'],
    ['MySQL','data',1],['Redis','data',1],['MongoDB','data'],
    ['Apache Kafka','cloud',1],['AWS EC2','cloud'],['AWS S3','cloud'],['Docker','cloud',1],['CI/CD','cloud'],
    ['LLM orchestration','ai',1],['Prompt engineering','ai'],['GitHub Copilot','ai',1],
    ['Git','tools',1],['Bitbucket','tools'],['JIRA','tools'],['Linux','tools'],['GoLand','tools'],['VS Code','tools']
  ];
  const catName=Object.fromEntries(CATS);
  const fbar=document.getElementById('skfilter'),cloud=document.getElementById('skcloud');
  const tabs=[['all','All'],...CATS];
  fbar.innerHTML=tabs.map(([k,n],i)=>`<button type="button" role="tab" id="sk-${k}" data-k="${k}" aria-selected="${i===0}" aria-controls="skpanel">${n}<span>${k==='all'?SK.length:SK.filter(s=>s[1]===k).length}</span></button>`).join('');
  function showSkills(k){
    const items=(k==='all'?SK:SK.filter(s=>s[1]===k)).slice().sort((a,b)=>(b[2]||0)-(a[2]||0));
    cloud.innerHTML=items.map((s,i)=>`<li class="${s[2]?'core':''}" style="--i:${i}">${s[0]}${k==='all'?`<small>${catName[s[1]]}</small>`:''}</li>`).join('');
    [...fbar.children].forEach(b=>b.setAttribute('aria-selected',b.dataset.k===k));
    document.getElementById('skpanel').setAttribute('aria-labelledby','sk-'+k);
  }
  fbar.addEventListener('click',e=>{const b=e.target.closest('button');if(b)showSkills(b.dataset.k)});
  showSkills('all');

  /* copy buttons */
  document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',()=>{
    const v=document.getElementById(b.dataset.copy);const text=v.textContent.trim();
    const done=()=>{b.textContent='Copied';b.classList.add('done');setTimeout(()=>{b.textContent='Copy';b.classList.remove('done')},1600)};
    const sel=()=>{const r=document.createRange();r.selectNodeContents(v);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected'};
    try{navigator.clipboard.writeText(text).then(done,sel)}catch(e){sel()}
  }));
})();
