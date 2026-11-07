// Coordinates are GCJ-02 from each AMap place record, not browser GPS.
const places = new Map([
  ['上海/城际上海外滩南京路步行街酒店', {id:'B0LRGZT7ZK',name:'城际上海外滩南京路步行街酒店',address:'黄浦区福州路431号',lon:121.482231,lat:31.233569}],
  ['上海/武康大楼', {id:'B00155ITJ1',name:'武康大楼',address:'徐汇区淮海中路1850号',lon:121.438278,lat:31.204430}]
]);
export const placePin=(city,name)=>places.get(city+'/'+name);
export const placePage=pin=>'https://ditu.amap.com/place/'+encodeURIComponent(pin.id);
export function pinnedDirections(from,to,mode){
  const endpoint=p=>[p.lon,p.lat,p.name].join(',');
  return 'https://uri.amap.com/navigation?'+new URLSearchParams({
    from:endpoint(from),to:endpoint(to),mode:mode==='driving'?'car':'walk',
    coordinate:'gaode',callnative:'0',src:'weekendgo'
  }).toString();
}
