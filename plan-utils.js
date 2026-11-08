export function meetingFromInvite(value){
  if(value?.type!=='invite')return null;
  const {date,time,place,people}=value;
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||
     typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||typeof place!=='string'||!place.trim()||place.length>80||
     !Number.isInteger(people)||people<1||people>20)throw Error('集合信息不完整');
  return {date,time,place:place.trim(),people};
}
export function addToPlan(state,id,invite=null){
  if(invite&&invite.route!==id)throw Error('邀请路线不符');
  const meeting=meetingFromInvite(invite);
  if(meeting)state.meet[id]=meeting;
  if(!state.plans.includes(id))state.plans.push(id);
  state.active=id;
}
export function timeLabel(minutes){
  const h=Math.floor(minutes/60),m=minutes%60;
  return (h?h+'小时':'')+(m||!h?m+'分钟':'');
}
export function routeTiming(route,walk=null){
  const visit=Math.round(route.hours*60),approach=walk?Math.round(walk.seconds/60):null;
  return {visit,approach,total:visit+(approach??0)};
}
