// Fitness news topics and Indian fitness creators (shared by /api/news and the News tab).

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceUrl?: string;
  published: string; // ISO date
  summary?: string;
}

export const TOPICS = [
  { id: "top", label: "Top stories", emoji: "🔥", query: '(fitness OR gym OR workout OR "weight loss") India when:3d' },
  { id: "competitions", label: "Competitions", emoji: "🏆", query: '(bodybuilding OR powerlifting OR "Mr India" OR Hyrox OR weightlifting OR "physique championship" OR marathon) India when:14d' },
  { id: "creators", label: "Influencers", emoji: "📱", query: '("fitness influencer" OR "Guru Mann" OR "Yatinder Singh" OR "Sahil Khan" OR "Fit Tuber" OR "Sangram Chougule" OR "Yasmin Karachiwala" OR "Milind Soman" OR "Namrata Purohit") when:30d' },
  { id: "nutrition", label: "Diet & nutrition", emoji: "🥗", query: '(diet OR nutrition OR protein OR "healthy eating") fitness India when:7d' },
  { id: "athletes", label: "Athletes", emoji: "🥇", query: '("Neeraj Chopra" OR "Mirabai Chanu" OR "Indian athletes" OR "Indian weightlifter" OR "Khelo India") when:7d' },
] as const;
export type TopicId = (typeof TOPICS)[number]["id"];

/** Indian fitness creators — tapping one shows the latest news about them. */
export const CREATORS = [
  { id: "guru-mann", name: "Guru Mann", tag: "Trainer · YouTube" },
  { id: "yatinder-singh", name: "Yatinder Singh", tag: "Mr Asia bodybuilder" },
  { id: "sahil-khan", name: "Sahil Khan", tag: "Actor · fitness" },
  { id: "sangram-chougule", name: "Sangram Chougule", tag: "Mr Universe" },
  { id: "fit-tuber", name: "Fit Tuber", tag: "Healthy food" },
  { id: "yasmin-karachiwala", name: "Yasmin Karachiwala", tag: "Pilates coach" },
  { id: "namrata-purohit", name: "Namrata Purohit", tag: "Pilates · stamina" },
  { id: "milind-soman", name: "Milind Soman", tag: "Ironman · running" },
  { id: "ranveer-allahbadia", name: "Ranveer Allahbadia", tag: "BeerBiceps" },
  { id: "neeraj-chopra", name: "Neeraj Chopra", tag: "Olympic champion" },
  { id: "mirabai-chanu", name: "Mirabai Chanu", tag: "Weightlifter" },
  { id: "rujuta-diwekar", name: "Rujuta Diwekar", tag: "Nutritionist" },
] as const;

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  if (d < 7) return d === 1 ? "Yesterday" : `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
