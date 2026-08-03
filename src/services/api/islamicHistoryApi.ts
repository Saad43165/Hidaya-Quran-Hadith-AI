/**
 * Wikipedia REST API — Islamic history articles
 * https://en.wikipedia.org/api/rest_v1/page/summary/{title}
 * No auth, no key. Rate limit: 200 req/s per IP.
 */
import axios from 'axios';

const wikiClient = axios.create({
  baseURL: 'https://en.wikipedia.org/api/rest_v1',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

export interface WikiSummary {
  title: string;
  description: string;
  extract: string;
  thumbnailUrl?: string;
  pageUrl: string;
}

export async function fetchWikiSummary(pageTitle: string): Promise<WikiSummary> {
  const encoded = encodeURIComponent(pageTitle.replace(/ /g, '_'));
  const { data } = await wikiClient.get(`/page/summary/${encoded}`);
  return {
    title: data.title ?? pageTitle,
    description: data.description ?? '',
    extract: data.extract ?? '',
    thumbnailUrl: data.thumbnail?.source,
    pageUrl: data.content_urls?.desktop?.page ?? '',
  };
}

// ─── Curated Islamic history topics ──────────────────────────────────────────
export interface HistoryTopic {
  id: string;
  title: string;
  wikiTitle: string;
  category: 'early_islam' | 'battles' | 'caliphate' | 'scholars' | 'civilisation' | 'modern';
  era: string;
  color: string;
  icon: string;
}

export const HISTORY_TOPICS: HistoryTopic[] = [
  // Early Islam
  { id: 'h01', title: 'Year of the Elephant', wikiTitle: 'Year_of_the_Elephant', category: 'early_islam', era: '570 CE', color: '#F59E0B', icon: '🐘' },
  { id: 'h02', title: 'Hijra to Abyssinia', wikiTitle: 'Abyssinian_migration', category: 'early_islam', era: '615 CE', color: '#4ADE80', icon: '🌍' },
  { id: 'h03', title: 'The Boycott of Banu Hashim', wikiTitle: 'Boycott_of_the_Hashemites', category: 'early_islam', era: '616–619 CE', color: '#EF4444', icon: '📜' },
  { id: 'h04', title: 'The Migration to Madinah', wikiTitle: 'Hegira', category: 'early_islam', era: '622 CE', color: '#38BDF8', icon: '🌙' },
  // Battles
  { id: 'h05', title: 'Battle of Badr', wikiTitle: 'Battle_of_Badr', category: 'battles', era: '624 CE', color: '#EF4444', icon: '⚔️' },
  { id: 'h06', title: 'Battle of Uhud', wikiTitle: 'Battle_of_Uhud', category: 'battles', era: '625 CE', color: '#F97316', icon: '🏔️' },
  { id: 'h07', title: 'Battle of the Trench', wikiTitle: 'Battle_of_the_Trench', category: 'battles', era: '627 CE', color: '#8B5CF6', icon: '⛏️' },
  { id: 'h08', title: 'Battle of Khaybar', wikiTitle: 'Battle_of_Khaybar', category: 'battles', era: '628 CE', color: '#EC4899', icon: '🏰' },
  { id: 'h09', title: 'Conquest of Mecca', wikiTitle: 'Conquest_of_Mecca', category: 'battles', era: '630 CE', color: '#D4A93E', icon: '🕋' },
  { id: 'h10', title: 'Battle of Yarmouk', wikiTitle: 'Battle_of_Yarmouk', category: 'battles', era: '636 CE', color: '#EF4444', icon: '⚔️' },
  { id: 'h11', title: 'Battle of Qadisiyyah', wikiTitle: 'Battle_of_al-Qadisiyyah', category: 'battles', era: '636 CE', color: '#F59E0B', icon: '🌄' },
  // Caliphate
  { id: 'h12', title: 'Rashidun Caliphate', wikiTitle: 'Rashidun_Caliphate', category: 'caliphate', era: '632–661 CE', color: '#4ADE80', icon: '🕌' },
  { id: 'h13', title: 'Umayyad Caliphate', wikiTitle: 'Umayyad_Caliphate', category: 'caliphate', era: '661–750 CE', color: '#38BDF8', icon: '🏛️' },
  { id: 'h14', title: 'Abbasid Caliphate', wikiTitle: 'Abbasid_Caliphate', category: 'caliphate', era: '750–1258 CE', color: '#818CF8', icon: '📚' },
  { id: 'h15', title: 'Fall of Baghdad', wikiTitle: 'Siege_of_Baghdad_(1258)', category: 'caliphate', era: '1258 CE', color: '#EF4444', icon: '🔥' },
  { id: 'h16', title: 'Ottoman Empire', wikiTitle: 'Ottoman_Empire', category: 'caliphate', era: '1299–1922 CE', color: '#EC4899', icon: '🌙' },
  // Scholars
  { id: 'h17', title: 'Imam Abu Hanifa', wikiTitle: 'Abu_Hanifa', category: 'scholars', era: '699–767 CE', color: '#F59E0B', icon: '📖' },
  { id: 'h18', title: 'Imam Malik', wikiTitle: 'Malik_ibn_Anas', category: 'scholars', era: '711–795 CE', color: '#4ADE80', icon: '📖' },
  { id: 'h19', title: 'Imam al-Shafi\'i', wikiTitle: 'Al-Shafi\'i', category: 'scholars', era: '767–820 CE', color: '#38BDF8', icon: '📖' },
  { id: 'h20', title: 'Imam Ahmad ibn Hanbal', wikiTitle: 'Ahmad_ibn_Hanbal', category: 'scholars', era: '780–855 CE', color: '#8B5CF6', icon: '📖' },
  { id: 'h21', title: 'Ibn Taymiyyah', wikiTitle: 'Ibn_Taymiyyah', category: 'scholars', era: '1263–1328 CE', color: '#EC4899', icon: '✍️' },
  { id: 'h22', title: 'Ibn Khaldun', wikiTitle: 'Ibn_Khaldun', category: 'scholars', era: '1332–1406 CE', color: '#D4A93E', icon: '🌐' },
  // Islamic Civilisation
  { id: 'h23', title: 'House of Wisdom — Baghdad', wikiTitle: 'House_of_Wisdom', category: 'civilisation', era: '830 CE', color: '#4ADE80', icon: '🏛️' },
  { id: 'h24', title: 'Al-Andalus (Islamic Spain)', wikiTitle: 'Al-Andalus', category: 'civilisation', era: '711–1492 CE', color: '#F59E0B', icon: '🕌' },
  { id: 'h25', title: 'Islamic Golden Age', wikiTitle: 'Islamic_Golden_Age', category: 'civilisation', era: '8th–14th c.', color: '#D4A93E', icon: '⭐' },
  { id: 'h26', title: 'Timbuktu — Centre of Learning', wikiTitle: 'Timbuktu', category: 'civilisation', era: '12th–17th c.', color: '#F97316', icon: '📚' },
];

export const HISTORY_CATEGORIES = [
  { id: 'early_islam', label: 'Early Islam', color: '#F59E0B', icon: '🌙' },
  { id: 'battles',     label: 'Battles',     color: '#EF4444', icon: '⚔️' },
  { id: 'caliphate',   label: 'Caliphates',  color: '#38BDF8', icon: '🕌' },
  { id: 'scholars',    label: 'Scholars',    color: '#4ADE80', icon: '📖' },
  { id: 'civilisation',label: 'Civilisation',color: '#D4A93E', icon: '🏛️' },
] as const;
