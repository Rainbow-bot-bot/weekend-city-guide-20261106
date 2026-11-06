import {escapeHTML as esc, mapUrl} from './data.js';

export const hotelNotes = {
  central: {label:'把住处放在书香与江风之间', reason:'福州路上的落脚点，适合把书城、人民广场和外滩放进同一个周末。不必为了不同主题反复换住处。', aliases:['城际','外滩城际','南京路城际','福州路城际','intercity','chengji','fuzhou'], fit:'书城 · 人民广场 · 外滩'},
  wukang: {label:'想把周末留给梧桐街区', reason:'地址在岳阳路，适合以衡复街区为中心，逛武康路、安福路。选它是为了街区位置，不是为了赶景点。', aliases:['全季','岳阳','岳阳路全季','岳阳全季','全季岳阳','徐汇全季','ji hotel','quanji','yueyang'], fit:'武康路 · 安福路 · 街区漫游'},
  westbund: {label:'把一整天交给西岸', reason:'位于龙腾大道，适合把滨江散步与美术馆放在同一天。住在这一带，行程重心就不必来回切换。', aliases:['全季','西岸','滨江全季','西岸全季','全季西岸','龙腾','艺术中心','ji hotel','quanji','xian','longteng'], fit:'徐汇滨江 · 美术馆 · 艺术半日'}
};
const normalize = value => String(value || '').toLowerCase().replace(/[\s（）()·，,。.-]/g,'');
export function hotelCatalogue(resources) {
  return Object.entries(hotelNotes).filter(([key])=>resources[key]?.hotel).map(([key,notes])=>({key,...resources[key].hotel,...notes}));
}
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
let origin={mode:'unset',address:'',hotel:null,coords:null};
export function startFor() {
  if(origin.mode==='location'&&origin.coords)return {name:'我的当前位置',coords:origin.coords};
  if(origin.mode==='hotel'&&origin.hotel)return {name:origin.hotel.name,hotel:origin.hotel};
  if(origin.mode==='address'&&origin.address)return {name:origin.address};
  return null;
}
export function directionsURL(start,destination,mode='walking') {
  const point=start.coords?`${start.coords.latitude},${start.coords.longitude}`:start.hotel?'上海市'+start.hotel.address:start.name;
  return 'https://maps.apple.com/directions?'+new URLSearchParams({source:point,destination:'上海市'+destination,mode}).toString();
}
export function originTimeline(route) {
  const start=startFor();
  if(!start)return '<li class="origin-stop origin-needed"><time>出门前</time><div class="stop"><h4>从你的住处接上这段旅程</h4><p>还没填起点，可以先读故事；确定住处后再看怎么到第一站。</p><button class="text-button" data-set-origin>填写住处或定位 ↗</button></div></li>';
  return `<li class="origin-stop"><time>先出发</time><div class="stop"><h4>${esc(start.name)}</h4><p>${start.hotel?'你选的落脚点 · 仅作出发地点，未代订酒店。':'你的自选起点 · 到第一站的时间与费用以导航为准。'}</p>${start.hotel?`<p class="hotel-address">${esc(start.hotel.address)} · 入住 ${esc(start.hotel.checkIn||'以酒店为准')}</p>`:''}<div class="origin-links"><a href="${esc(directionsURL(start,route.stops[0][1]))}" target="_blank" rel="noopener noreferrer">到第一站 · 步行导航 ↗</a><a href="${esc(directionsURL(start,route.stops[0][1],'driving'))}" target="_blank" rel="noopener noreferrer">到第一站 · 驾车导航 ↗</a>${start.hotel?`<a href="${esc(start.hotel.url)}" target="_blank" rel="noopener noreferrer">酒店公开详情 ↗</a>`:''}</div><p class="muted">导航带入起终点；公交可用各站的高德地图查询。</p></div></li>`;
}
export function setupOrigin(resources) {
  const host=document.querySelector('#origin-panel'), catalogue=hotelCatalogue(resources);
  host.innerHTML=`<div class="origin-intro"><span class="eyebrow">BEFORE YOU WANDER</span><h3>这次，从哪里出发？</h3><p>已经订好酒店，或打算从学校出门？<br>告诉我们起点，下一站就好找了。</p></div><div class="origin-controls"><label for="origin-address" class="origin-field-label">自己的酒店 / 出发地点</label><div class="origin-input-row"><div class="origin-search"><span class="origin-pin" aria-hidden="true">⌖</span><input id="origin-address" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hotel-matches" aria-describedby="origin-hint" autocomplete="off" maxlength="100" placeholder="试试“岳阳”“城际”，或填学校、车站"><div id="hotel-matches" class="hotel-matches" role="listbox" aria-label="匹配到的酒店" hidden></div></div><button id="save-origin" class="button primary">从这里出发 ↗</button></div><div class="origin-under"><button id="locate-origin" class="text-button">◎ 使用当前位置</button><button id="clear-origin" class="text-button" hidden>清除起点</button></div><small id="origin-hint">已收录的 3 家酒店支持简称匹配；其他住处可直接填写具体地址。</small><p id="origin-status" role="status" aria-live="polite"></p></div><details class="stay-suggestions"><summary><span>还没想好预订哪家酒店？<em>来看看这些</em></span><span class="disclosure-icon" aria-hidden="true">＋</span></summary><div class="stay-intro"><p>先看这次想逛哪一片，再选一个顺路的落脚点。</p><small>按位置与行程主题挑选，并非价格或服务排名。住宿费用另计。</small></div><div class="stay-grid">${catalogue.map((h,i)=>`<article class="stay-card"><div class="stay-number">0${i+1}<span>${esc(h.fit)}</span></div><h4>${esc(h.label)}</h4><p class="stay-reason">${esc(h.reason)}</p><div class="stay-place"><strong>${esc(h.name)}</strong><span>⌖ ${esc(h.address)}</span></div>${h.key==='westbund'?'<p class="stay-caution">预订前请电话确认实际办理入住的位置。</p>':''}<div class="stay-actions"><button class="button secondary" data-choose-hotel="${h.key}">从这里出发 ↗</button><a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">房型与报价 ↗</a><a href="${esc(mapUrl(h.name))}" target="_blank" rel="noopener noreferrer">地图 ↗</a></div></article>`).join('')}</div><p class="stay-footnote">酒店基础信息和公开详情无需登录查看；实际下单按预订平台要求办理。选择起点不会产生订单。</p></details>`;
  const input=host.querySelector('#origin-address'), list=host.querySelector('#hotel-matches'), status=host.querySelector('#origin-status'), clear=host.querySelector('#clear-origin');
  let matches=[], active=-1, locationRequest=0;
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1};
  const updateStatus=message=>{status.textContent=message;clear.hidden=origin.mode==='unset'&&!input.value.trim()};
  const activate=index=>{active=index;list.querySelectorAll('[role=option]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(active>=0){input.setAttribute('aria-activedescendant','hotel-option-'+active);list.querySelector('#hotel-option-'+active)?.scrollIntoView({block:'nearest'})}else input.removeAttribute('aria-activedescendant')};
  const choose=hotel=>{locationRequest++;origin={mode:'hotel',hotel,address:hotel.address,coords:null};input.value=hotel.name;close();updateStatus('已选：'+hotel.name+' · '+hotel.address);host.querySelectorAll('[data-choose-hotel]').forEach(b=>{b.textContent=b.dataset.chooseHotel===hotel.key?'✓ 已设为起点':'从这里出发 ↗'});};
  const showMatches=()=>{matches=matchHotels(input.value,catalogue);active=-1;if(!input.value.trim()){close();return}list.innerHTML=matches.length?`<div class="match-heading">匹配到 ${matches.length} 家 · 请选择具体门店</div>${matches.map((h,i)=>`<div role="option" aria-selected="false" id="hotel-option-${i}" data-match-index="${i}"><strong>${esc(h.name)}</strong><span>${esc(h.address)}</span></div>`).join('')}`:`<div class="match-empty">暂未收录这家住处。可以填具体地址，或先<a href="${esc(mapUrl(input.value))}" target="_blank" rel="noopener noreferrer">在地图上核对 ↗</a></div>`;list.hidden=false;input.setAttribute('aria-expanded','true');};
  const commit=()=>{const value=input.value.trim();if(!value){origin={mode:'unset',address:'',hotel:null,coords:null};close();updateStatus('先写一个酒店、学校或车站吧。');return}const options=matchHotels(value,catalogue);const exact=options.find(h=>normalize(h.name)===normalize(value));if(exact||options.length===1){choose(exact||options[0]);return}if(options.length>1){showMatches();updateStatus('有同名门店，选一下具体地址再出发。');input.focus();return}locationRequest++;origin={mode:'address',address:value,hotel:null,coords:null};close();updateStatus('已设为起点：'+value+'。导航将按这个地址查找，请确认门店位置。');};
  input.addEventListener('input',()=>{locationRequest++;origin={mode:'unset',address:'',hotel:null,coords:null};updateStatus('');host.querySelectorAll('[data-choose-hotel]').forEach(b=>b.textContent='从这里出发 ↗');showMatches()});
  input.addEventListener('focus',()=>{if(origin.mode!=='hotel')showMatches()});
  input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)showMatches();if(matches.length)activate(active<0?(e.key==='ArrowDown'?0:matches.length-1):(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length)}else if(e.key==='Enter'){e.preventDefault();if(!list.hidden&&active>=0)choose(matches[active]);else commit()}else if(e.key==='Escape'){close()}});
  list.addEventListener('pointerdown',e=>{if(e.target.closest('[role=option]'))e.preventDefault()});
  list.addEventListener('click',e=>{const row=e.target.closest('[data-match-index]');if(row)choose(matches[Number(row.dataset.matchIndex)])});
  host.addEventListener('focusout',e=>{if(!host.contains(e.relatedTarget))close()});
  document.addEventListener('click',e=>{if(!e.target.closest('.origin-search,#save-origin'))close()});
  host.querySelector('#save-origin').onclick=commit;
  host.querySelectorAll('[data-choose-hotel]').forEach(b=>b.onclick=()=>{choose(catalogue.find(h=>h.key===b.dataset.chooseHotel));host.querySelector('.stay-suggestions').open=false;input.focus()});
  clear.onclick=()=>{locationRequest++;origin={mode:'unset',address:'',hotel:null,coords:null};input.value='';close();updateStatus('');host.querySelectorAll('[data-choose-hotel]').forEach(b=>b.textContent='从这里出发 ↗');input.focus()};
  const locate=host.querySelector('#locate-origin');
  locate.onclick=()=>{if(!navigator.geolocation){updateStatus('当前浏览器不支持定位，直接填写出发地址即可。');return}const request=++locationRequest;locate.disabled=true;close();updateStatus('正在请求位置；不保存、不加入分享链接，仅打开导航时传给地图服务。');navigator.geolocation.getCurrentPosition(pos=>{locate.disabled=false;if(request!==locationRequest)return;origin={mode:'location',coords:{latitude:pos.coords.latitude,longitude:pos.coords.longitude},hotel:null,address:''};input.value='';updateStatus('✓ 已使用当前位置。仅打开导航时传给地图服务，不保存或分享。')},err=>{locate.disabled=false;if(request!==locationRequest)return;updateStatus(err.code===1?'未获得定位权限，可以直接填写地址。':'暂时无法取得位置，请重试或填写地址。')},{enableHighAccuracy:false,timeout:10000,maximumAge:300000})};
}
