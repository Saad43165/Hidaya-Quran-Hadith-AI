export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  urlPattern: string; // {number} is replaced with global ayah number
}

export const RECITERS: Reciter[] = [
  {
    id: 'mishary',
    name: 'Mishary Rashid',
    arabicName: 'مشاري راشد',
    style: 'Murattal',
    urlPattern: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/{number}.mp3',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit',
    arabicName: 'عبد الباسط',
    style: 'Murattal',
    urlPattern: 'https://cdn.islamic.network/quran/audio/128/ar.abdulsamad/{number}.mp3',
  },
  {
    id: 'hudhaify',
    name: 'Ali Al-Hudhaify',
    arabicName: 'علي الحذيفي',
    style: 'Murattal',
    urlPattern: 'https://cdn.islamic.network/quran/audio/128/ar.hudhaify/{number}.mp3',
  },
  {
    id: 'sudais',
    name: 'Abdur-Rahman Al-Sudais',
    arabicName: 'السديس',
    style: 'Murattal',
    urlPattern: 'https://cdn.islamic.network/quran/audio/128/ar.abdurrahmanaas-sudais/{number}.mp3',
  },
  {
    id: 'shatri',
    name: 'Abu Bakr Al-Shatri',
    arabicName: 'أبو بكر الشاطري',
    style: 'Murattal',
    urlPattern: 'https://cdn.islamic.network/quran/audio/128/ar.shaatree/{number}.mp3',
  },
];

export const DEFAULT_RECITER_ID = 'mishary';

export function buildAyahUrl(reciter: Reciter, globalAyahNumber: number): string {
  return reciter.urlPattern.replace('{number}', String(globalAyahNumber));
}
