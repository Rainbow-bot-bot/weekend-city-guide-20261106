import {escapeHTML as esc, mapUrl,photoSources,routes} from './data.js?v=20261106e';

export const hotelNotes = {
  central: {label:'福州路 · 书城与外滩之间', reason:'福州路上的落脚点，适合把书城、人民广场和外滩放进同一个周末。不必为了不同主题反复换住处。', aliases:['城际','外滩城际','南京路城际','福州路城际','intercity','chengji','fuzhou'], fit:'书城 · 人民广场 · 外滩'},
  wukang: {label:'岳阳路 · 衡复街区', reason:'地址在岳阳路，适合以衡复街区为中心，逛武康路、安福路。从住处可安排衡复街区的建筑步行。', aliases:['全季','岳阳','岳阳路全季','岳阳全季','全季岳阳','徐汇全季','ji hotel','quanji','yueyang'], fit:'武康路 · 安福路 · 街区漫游'},
  westbund: {label:'龙腾大道 · 徐汇滨江', reason:'位于龙腾大道，适合把滨江散步与美术馆放在同一天。住在这一带，行程重心就不必来回切换。', aliases:['全季','西岸','滨江全季','西岸全季','全季西岸','龙腾','艺术中心','ji hotel','quanji','xian','longteng'], fit:'徐汇滨江 · 美术馆 · 艺术半日'}
};
const normalize = value => String(value || '').toLowerCase().replace(/[\s（）()·，,。.-]/g,'');
export function hotelCatalogue(resources,city='shanghai') {
  const groups=new Set(routes.filter(r=>r.city===city).map(r=>r.guideGroup)), found=new Map();
  for(const group of groups){const h=resources[group]?.hotel;if(!h)continue;const key=h.key||group;if(!found.has(key))found.set(key,{...hotelNotes[key],...h,key,aliases:h.aliases||hotelNotes[key]?.aliases||[]})}
  return [...found.values()];
}
export function hotelPhoto(h){const photo=photoSources[h.image];if(!photo)return '';return `<figure class="hotel-landscape"><img src="./assets/${esc(photo.file)}?v=20261106e" alt="${esc(photo.place)}实拍" loading="lazy" data-photo-source="${esc(photo.url)}"><figcaption><a href="${esc(photo.url)}" target="_blank" rel="noopener noreferrer">周边实拍 · ${esc(photo.place)} ↗</a></figcaption></figure>`}
export function phoneURL(value){const raw=String(value).split('转')[0].replace(/[^+0-9]/g,'');return 'tel:'+(raw.startsWith('+')?raw:'+86'+raw.replace(/^0/,''))}
export function matchHotels(query, catalogue) {
  const terms=String(query||'').trim().split(/\s+/).map(normalize).filter(Boolean);
  if(!terms.length)return [];
  return catalogue.map(hotel=>{
    const name=normalize(hotel.name), address=normalize(hotel.address);
    const words=[name,address,...hotel.aliases.map(normalize)];
    const matches=terms.every(term=>words.some(word=>word.includes(term)));
    const score=terms.reduce((s,term)=>s+(name===term?30:0)+(hotel.aliases.some(a=>normalize(a)===term)?10:0)+(name.includes(term)?3:0),0);
    return {hotel,matches,score};
  }).filter(x=>x.matches).sort((a,b)=>b.score-a.score).map(x=>x.hotel);
}
let origin={mode:'unset',address:'',hotel:null,coords:null};let currentCity={id:'shanghai',name:'上海'},originGeneration=0,originController;
export function startFor(route) {
  if(route?.city&&route.city!==currentCity.id)return null;
  if(origin.mode==='location'&&origin.coords)return {name:'我的当前位置',coords:origin.coords};
  if(origin.mode==='hotel'&&origin.hotel)return {name:origin.hotel.name,hotel:origin.hotel};
  if(origin.mode==='address'&&origin.address)return {name:origin.address,cityName:currentCity.name};
  return null;
}
export function directionsURL(start,destination,mode='walking',city='上海') {
  const point=start.coords?`${start.coords.latitude},${start.coords.longitude}`:start.hotel?(start.hotel.address.includes(start.hotel.city||'上海')?'':(start.hotel.city||'上海')+'市')+start.hotel.address:(start.cityName&&!start.name.includes(start.cityName)?start.cityName+'市':'')+start.name;
  return 'https://maps.apple.com/directions?'+new URLSearchParams({source:point,destination:city+'市'+destination,mode}).toString();
}
export function originTimeline(route) {
  const start=startFor(route);
  if(!start)return `<li class="origin-stop origin-needed"><time>出门前</time><div class="stop"><h4>从你的住处接上这段旅程</h4><p>填好出发地点，就能导航到第一站。</p><button class="text-button" data-set-origin data-origin-city="${esc(route.city||'shanghai')}">填写住处或定位 ↗</button></div></li>`;
  return `<li class="origin-stop"><time>先出发</time><div class="stop"><h4>${esc(start.name)}</h4><p>${start.hotel?'从住处出发':'你的出发地点'}</p>${start.hotel?`<p class="hotel-address">${esc(start.hotel.address)} · 入住 ${esc(start.hotel.checkIn||'以酒店为准')}</p>`:''}<div class="origin-links"><a href="${esc(directionsURL(start,route.stops[0][1],'walking',route.cityName))}" target="_blank" rel="noopener noreferrer">到第一站 · 步行导航 ↗</a><a href="${esc(directionsURL(start,route.stops[0][1],'driving',route.cityName))}" target="_blank" rel="noopener noreferrer">到第一站 · 驾车导航 ↗</a>${start.hotel?`<a href="${esc(start.hotel.url)}" target="_blank" rel="noopener noreferrer">酒店公开详情 ↗</a>`:''}</div></div></li>`;
}
export function setupOrigin(resources,city={id:'shanghai',name:'上海'}) {
  currentCity=city;origin={mode:'unset',address:'',hotel:null,coords:null};const generation=++originGeneration;originController?.abort();originController=new AbortController();
  const host=document.querySelector('#origin-panel'), catalogue=hotelCatalogue(resources,city.id);
  host.innerHTML=`<div class="origin-intro"><span class="eyebrow">BEFORE YOU WANDER</span><h3>这次，从哪里出发？</h3><p>已经订好酒店，或打算从学校出门？<br>告诉我们起点，下一站就好找了。</p></div><div class="origin-controls"><label for="origin-address" class="origin-field-label">自己的酒店 / 出发地点</label><div class="origin-input-row"><div class="origin-search"><span class="origin-pin" aria-hidden="true">⌖</span><input id="origin-address" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hotel-matches" autocomplete="off" maxlength="100" placeholder="输入酒店简称、学校或出发地址"><div id="hotel-matches" class="hotel-matches" role="listbox" aria-label="匹配到的酒店" hidden></div></div><button id="save-origin" class="button primary">从这里出发 ↗</button></div><div class="origin-under"><button id="locate-origin" class="text-button">◎ 使用当前位置</button><button id="clear-origin" class="text-button" hidden>清除起点</button></div><p id="origin-status" role="status" aria-live="polite"></p></div><details class="stay-suggestions"><summary><span>还没想好预订哪家酒店？<em>来看看这些</em></span><span class="disclosure-icon" aria-hidden="true">＋</span></summary><div class="stay-intro"><p>住在喜欢的街区，出门就有得逛。</p></div><div class="stay-grid ${catalogue.length===1?'single-stay':''}">${catalogue.map(h=>`<article class="stay-card">${hotelPhoto(h)}<div class="stay-card-body"><span class="stay-area">${esc(h.area||h.fit)}</span><h4>${esc(h.name)}</h4><p class="stay-reason">${esc(h.reason)}</p><dl class="stay-context"><div><dt>周围有什么</dt><dd>${esc(h.environment)}</dd></div><div><dt>位置</dt><dd>${esc(h.geography)}</dd></div></dl><div class="stay-place"><span>⌖ ${esc(h.address)}</span></div>${h.caution?`<p class="stay-caution">${esc(h.caution)}</p>`:''}<div class="stay-actions"><button class="button secondary" data-choose-hotel="${h.key}">从这里出发 ↗</button><a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">房型与报价 ↗</a><a href="${esc(mapUrl(h.name,city.name))}" target="_blank" rel="noopener noreferrer">地图 ↗</a></div></div></article>`).join('')}</div></details>`;
  const input=host.querySelector('#origin-address'), list=host.querySelector('#hotel-matches'), status=host.querySelector('#origin-status'), clear=host.querySelector('#clear-origin');
  let matches=[], active=-1, locationRequest=0;
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1};
  const updateStatus=message=>{status.textContent=message;clear.hidden=origin.mode==='unset'&&!input.value.trim()};
  const activate=index=>{active=index;list.querySelectorAll('[role=option]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(active>=0){input.setAttribute('aria-activedescendant','hotel-option-'+active);list.querySelector('#hotel-option-'+active)?.scrollIntoView({block:'nearest'})}else input.removeAttribute('aria-activedescendant')};
  const choose=hotel=>{locationRequest++;origin={mode:'hotel',hotel,address:hotel.address,coords:null};input.value=hotel.name;close();updateStatus('已选：'+hotel.name+' · '+hotel.address);host.querySelectorAll('[data-choose-hotel]').forEach(b=>{b.textContent=b.dataset.chooseHotel===hotel.key?'✓ 已设为起点':'从这里出发 ↗'});};
  const showMatches=()=>{matches=matchHotels(input.value,catalogue);active=-1;if(!input.value.trim()){close();return}list.innerHTML=matches.length?`<div class="match-heading">匹配到 ${matches.length} 家 · 请选择具体门店</div>${matches.map((h,i)=>`<div role="option" aria-selected="false" id="hotel-option-${i}" data-match-index="${i}"><strong>${esc(h.name)}</strong><span>${esc(h.address)}</span></div>`).join('')}`:`<div class="match-empty">没有匹配项。可填写具体地址，或<a href="${esc(mapUrl(input.value,city.name))}" target="_blank" rel="noopener noreferrer">在地图上核对 ↗</a></div>`;list.hidden=false;input.setAttribute('aria-expanded','true');};
  const commit=()=>{const value=input.value.trim();if(!value){origin={mode:'unset',address:'',hotel:null,coords:null};close();updateStatus('先写一个酒店、学校或车站吧。');return}const options=matchHotels(value,catalogue);const exact=options.find(h=>normalize(h.name)===normalize(value));if(exact||options.length===1){choose(exact||options[0]);return}if(options.length>1){showMatches();updateStatus('有同名门店，选一下具体地址再出发。');input.focus();return}locationRequest++;origin={mode:'address',address:value,hotel:null,coords:null};close();updateStatus('已设为起点：'+value);};
  input.addEventListener('input',()=>{locationRequest++;origin={mode:'unset',address:'',hotel:null,coords:null};updateStatus('');host.querySelectorAll('[data-choose-hotel]').forEach(b=>b.textContent='从这里出发 ↗');showMatches()});
  input.addEventListener('focus',()=>{if(origin.mode!=='hotel')showMatches()});
  input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)showMatches();if(matches.length)activate(active<0?(e.key==='ArrowDown'?0:matches.length-1):(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length)}else if(e.key==='Enter'){e.preventDefault();if(!list.hidden&&active>=0)choose(matches[active]);else commit()}else if(e.key==='Escape'){close()}});
  list.addEventListener('pointerdown',e=>{if(e.target.closest('[role=option]'))e.preventDefault()});
  list.addEventListener('click',e=>{const row=e.target.closest('[data-match-index]');if(row)choose(matches[Number(row.dataset.matchIndex)])});
  host.addEventListener('focusout',e=>{if(!host.contains(e.relatedTarget))close()});
  document.addEventListener('click',e=>{if(!e.target.closest('.origin-search,#save-origin'))close()},{signal:originController.signal});
  host.querySelector('#save-origin').onclick=commit;
  host.querySelectorAll('[data-choose-hotel]').forEach(b=>b.onclick=()=>{choose(catalogue.find(h=>h.key===b.dataset.chooseHotel));host.querySelector('.stay-suggestions').open=false;input.focus()});
  clear.onclick=()=>{locationRequest++;origin={mode:'unset',address:'',hotel:null,coords:null};input.value='';close();updateStatus('');host.querySelectorAll('[data-choose-hotel]').forEach(b=>b.textContent='从这里出发 ↗');input.focus()};
  const locate=host.querySelector('#locate-origin');
  locate.onclick=()=>{if(!navigator.geolocation){updateStatus('当前浏览器不支持定位，直接填写出发地址即可。');return}const request=++locationRequest;locate.disabled=true;close();updateStatus('正在请求位置，仅用于出发导航。');navigator.geolocation.getCurrentPosition(pos=>{locate.disabled=false;if(request!==locationRequest||generation!==originGeneration)return;origin={mode:'location',coords:{latitude:pos.coords.latitude,longitude:pos.coords.longitude},hotel:null,address:''};input.value='';updateStatus('✓ 已使用当前位置。位置不保存、不加入分享链接。')},err=>{locate.disabled=false;if(request!==locationRequest||generation!==originGeneration)return;updateStatus(err.code===1?'未获得定位权限，可以直接填写地址。':'暂时无法取得位置，请重试或填写地址。')},{enableHighAccuracy:false,timeout:10000,maximumAge:300000})};
}
