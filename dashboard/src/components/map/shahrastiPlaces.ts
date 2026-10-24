export interface SearchablePlace {
  name: string;
  nameBn: string;
  lat: number;
  lng: number;
  keywords: string[];
}

export const SHAHRTASTI_PLACES: SearchablePlace[] = [
  {
    name: "Kalibari Bazar, Shahrasti",
    nameBn: "কালীবাড়ী বাজার, শাহরাস্তি",
    lat: 23.2452,
    lng: 90.9422,
    keywords: ["kalibari", "কালীবাড়ী", "kalibari bazar", "sonali bank kalibari", "high school field"],
  },
  {
    name: "Ugharia Bazar, Suchipara, Shahrasti",
    nameBn: "উঘারিয়া বাজার, সূচীপাড়া, শাহরাস্তি",
    lat: 23.2325,
    lng: 90.9575,
    keywords: ["ugharia", "উঘারিয়া", "উঘরিয়া", "ugaria", "ugharia bazar", "ugharia village"],
  },
  {
    name: "Seti Narayanpur, Shahrasti",
    nameBn: "সেতি নারায়ণপুর, শাহরাস্তি",
    lat: 23.237,
    lng: 90.952,
    keywords: ["seti narayanpur", "সেতি নারায়ণপুর", "narayanpur", "নারায়ণপুর"],
  },
  {
    name: "Bagair, Shahrasti",
    nameBn: "বাগাইর, শাহরাস্তি",
    lat: 23.231,
    lng: 90.951,
    keywords: ["bagair", "বাগাইর"],
  },
  {
    name: "Shimail, Shahrasti",
    nameBn: "শিমাইল, শাহরাস্তি",
    lat: 23.226,
    lng: 90.958,
    keywords: ["shimail", "শিমাইল"],
  },
  {
    name: "Musad Para, Shahrasti",
    nameBn: "মুসাদ পাড়া, শাহরাস্তি",
    lat: 23.229,
    lng: 90.966,
    keywords: ["musad para", "মুসাদ পাড়া", "musadpara"],
  },
  {
    name: "Suchipara Bazar, Shahrasti",
    nameBn: "সূচীপাড়া বাজার, শাহরাস্তি",
    lat: 23.2185,
    lng: 90.962,
    keywords: ["suchipara", "সূচীপাড়া", "suchipara bazar", "suchipara uttar", "suchipara dakshin"],
  },
  {
    name: "Chitoshi Bazar, Shahrasti",
    nameBn: "চিতোষী বাজার, শাহরাস্তি",
    lat: 23.1895,
    lng: 91.0125,
    keywords: ["chitoshi", "চিতোষী", "chitoshi bazar", "chitshi", "chitoshi station"],
  },
  {
    name: "Meher Station & Bazar, Shahrasti",
    nameBn: "মেহের স্টেশন ও বাজার, শাহরাস্তি",
    lat: 23.254,
    lng: 90.912,
    keywords: ["meher", "মেহের", "meher station", "meher bazar", "meher railway"],
  },
  {
    name: "Waruk Bazar, Shahrasti",
    nameBn: "ওয়ারুক বাজার, শাহরাস্তি",
    lat: 23.238,
    lng: 90.932,
    keywords: ["waruk", "ওয়ারুক", "waruk station", "waruk bazar"],
  },
  {
    name: "Shahrasti Gate / Thana Gate",
    nameBn: "শাহরাস্তি গেইট / থানা গেইট / পৌরসভা",
    lat: 23.228,
    lng: 90.948,
    keywords: ["thana gate", "shahrasti gate", "শাহরাস্তি গেইট", "থানা গেইট", "pauroshova", "পৌরসভা"],
  },
  {
    name: "Tamta Bazar, Shahrasti",
    nameBn: "টামটা বাজার, শাহরাস্তি",
    lat: 23.282,
    lng: 90.965,
    keywords: ["tamta", "টামটা", "tamta bazar", "tamta uttar", "tamta dakshin"],
  },
  {
    name: "Rayshree, Shahrasti",
    nameBn: "রায়শ্রী, শাহরাস্তি",
    lat: 23.205,
    lng: 91.04,
    keywords: ["rayshree", "রায়শ্রী", "raishree", "raishree uttar", "raishree dakshin"],
  },
  {
    name: "Kakortoli Bazar, Shahrasti",
    nameBn: "কাকৈরতলা বাজার, শাহরাস্তি",
    lat: 23.22,
    lng: 90.925,
    keywords: ["kakortoli", "কাকৈরতলা", "kakortola"],
  },
  {
    name: "Khilpara, Shahrasti",
    nameBn: "খিলপাড়া, শাহরাস্তি",
    lat: 23.208,
    lng: 90.942,
    keywords: ["khilpara", "খিলপাড়া"],
  },
  {
    name: "Debkara, Shahrasti",
    nameBn: "দেবকরা, শাহরাস্তি",
    lat: 23.248,
    lng: 90.968,
    keywords: ["debkara", "দেবকরা"],
  },
  {
    name: "Hadimpur, Shahrasti",
    nameBn: "হাদিমপুর, শাহরাস্তি",
    lat: 23.255,
    lng: 90.952,
    keywords: ["hadimpur", "হাদিমপুর"],
  },
  {
    name: "Koroia, Shahrasti",
    nameBn: "কড়ইয়া, শাহরাস্তি",
    lat: 23.239,
    lng: 90.978,
    keywords: ["koroia", "কড়ইয়া", "koroiya"],
  },
  {
    name: "Notun Bazar, Shahrasti",
    nameBn: "নতুন বাজার, শাহরাস্তি",
    lat: 23.231,
    lng: 90.945,
    keywords: ["notun bazar", "নতুন বাজার"],
  },
];

/** Search in local dictionary */
export function searchLocalShahrastiPlaces(query: string): { name: string; lat: number; lng: number }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const matched = SHAHRTASTI_PLACES.filter((p) => {
    if (p.name.toLowerCase().includes(q) || p.nameBn.includes(q)) return true;
    return p.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
  });

  return matched.map((p) => ({
    name: `${p.nameBn} (${p.name})`,
    lat: p.lat,
    lng: p.lng,
  }));
}
