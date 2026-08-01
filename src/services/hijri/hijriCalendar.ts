const HIJRI_MONTHS = [
  'Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Thani",
  'Jumada al-Awwal','Jumada al-Thani','Rajab',"Sha'ban",
  'Ramadan','Shawwal',"Dhul Qa'dah",'Dhul Hijjah',
];
const HIJRI_MONTHS_AR = [
  'مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي',
  'جُمَادَى الأُولَى','جُمَادَى الثَّانِيَة','رَجَب','شَعْبَان',
  'رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة',
];
const SPECIAL_DAYS: Record<string,string> = {
  '1-1':'Islamic New Year','10-1':'Day of Ashura',
  '12-3':"Mawlid an-Nabi",'27-7':"Isra' and Mi'raj",
  '15-8':"Laylat al-Bara'ah",'1-9':'First day of Ramadan',
  '27-9':'Laylat al-Qadr (est.)','1-10':'Eid al-Fitr',
  '9-12':'Day of Arafah','10-12':'Eid al-Adha',
};
export interface HijriDate {
  day:number; month:number; year:number;
  monthName:string; monthNameAr:string;
  formatted:string; formattedAr:string;
  isSpecial:boolean; specialName?:string;
}
function gregorianToHijri(gYear:number,gMonth:number,gDay:number){
  const jd=Math.floor((1461*(gYear+4800+Math.floor((gMonth-14)/12)))/4)
    +Math.floor((367*(gMonth-2-12*Math.floor((gMonth-14)/12)))/12)
    -Math.floor((3*Math.floor((gYear+4900+Math.floor((gMonth-14)/12))/100))/4)
    +gDay-32075;
  let l=jd-1948440+10632;
  const n=Math.floor((l-1)/10631);
  l=l-10631*n+354;
  const j=Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)
    +Math.floor(l/5670)*Math.floor((43*l)/15238);
  l=l-Math.floor((30-j)/15)*Math.floor((17719*j)/50)
    -Math.floor(j/16)*Math.floor((15238*j)/43)+29;
  const month=Math.floor((24*l)/709);
  const day=l-Math.floor((709*month)/24);
  const year=30*n+j-30;
  return {day,month,year};
}
const toAr=(n:number)=>String(n).replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
export function getTodayHijri():HijriDate{
  const t=new Date();
  const {day,month,year}=gregorianToHijri(t.getFullYear(),t.getMonth()+1,t.getDate());
  const key=`${day}-${month}`;
  const special=SPECIAL_DAYS[key];
  return {
    day,month,year,
    monthName:HIJRI_MONTHS[month-1],
    monthNameAr:HIJRI_MONTHS_AR[month-1],
    formatted:`${day} ${HIJRI_MONTHS[month-1]} ${year} AH`,
    formattedAr:`${toAr(day)} ${HIJRI_MONTHS_AR[month-1]} ${toAr(year)}`,
    isSpecial:!!special,specialName:special,
  };
}
