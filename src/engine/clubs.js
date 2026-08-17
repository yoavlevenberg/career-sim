// Static club database. Fictional names, plausible tiering. Six tiers,
// ~8 clubs each, spread across ten countries. Tier 1 = Champions League
// elite, Tier 6 = semi-pro.
//
// prestige and clubAvgOvr are hand-placed within CLUB_TIER_CONFIG's ranges
// (see constants.js) rather than randomly rolled, so the database is stable
// across runs and easy to eyeball-balance.

export const CLUBS = [
  // ---- Tier 1 ----
  { id: 'eng-royalton', name: 'Royalton United', country: 'England', tier: 1, prestige: 97, clubAvgOvr: 89 },
  { id: 'esp-real-costera', name: 'Real Costera', country: 'Spain', tier: 1, prestige: 96, clubAvgOvr: 88 },
  { id: 'ita-milano-nera', name: 'Milano Nera', country: 'Italy', tier: 1, prestige: 93, clubAvgOvr: 87 },
  { id: 'deu-bayern-stahl', name: 'Rot-Stahl München', country: 'Germany', tier: 1, prestige: 92, clubAvgOvr: 86 },
  { id: 'nld-ajax-noord', name: 'AFC Noordstad', country: 'Netherlands', tier: 1, prestige: 88, clubAvgOvr: 85 },
  { id: 'prt-porto-atlantico', name: 'Porto Atlântico', country: 'Portugal', tier: 1, prestige: 89, clubAvgOvr: 84 },
  { id: 'eng-city-park', name: 'Parkside City', country: 'England', tier: 1, prestige: 95, clubAvgOvr: 89 },
  { id: 'esp-atletico-rio', name: 'Atlético Rioseco', country: 'Spain', tier: 1, prestige: 90, clubAvgOvr: 85 },

  // ---- Tier 2 ----
  { id: 'ita-torino-viola', name: 'Torino Viola', country: 'Italy', tier: 2, prestige: 84, clubAvgOvr: 81 },
  { id: 'deu-hansa-nord', name: 'Hansa Nord', country: 'Germany', tier: 2, prestige: 82, clubAvgOvr: 80 },
  { id: 'nld-feyen-haven', name: 'Feyen Haven', country: 'Netherlands', tier: 2, prestige: 79, clubAvgOvr: 78 },
  { id: 'prt-benfica-luz-nova', name: 'Luz Nova SC', country: 'Portugal', tier: 2, prestige: 80, clubAvgOvr: 79 },
  { id: 'bel-anderlecht-royal', name: 'Royal Sportkring', country: 'Belgium', tier: 2, prestige: 75, clubAvgOvr: 77 },
  { id: 'tur-galatasehir', name: 'Galata Şehir', country: 'Turkey', tier: 2, prestige: 78, clubAvgOvr: 78 },
  { id: 'sau-al-noor', name: 'Al-Noor FC', country: 'Saudi Arabia', tier: 2, prestige: 86, clubAvgOvr: 82 },
  { id: 'eng-east-mercia', name: 'East Mercia FC', country: 'England', tier: 2, prestige: 77, clubAvgOvr: 77 },

  // ---- Tier 3 ----
  { id: 'isr-hapoel-tzafon', name: 'הפועל צפון', country: 'Israel', tier: 3, prestige: 66, clubAvgOvr: 73 },
  { id: 'isr-maccabi-yarden', name: 'מכבי ירדן', country: 'Israel', tier: 3, prestige: 68, clubAvgOvr: 74 },
  { id: 'bel-club-brugge-west', name: 'West Bruggeois', country: 'Belgium', tier: 3, prestige: 61, clubAvgOvr: 71 },
  { id: 'tur-izmir-yildiz', name: 'İzmir Yıldız', country: 'Turkey', tier: 3, prestige: 63, clubAvgOvr: 72 },
  { id: 'esp-elche-marina', name: 'Elche Marina', country: 'Spain', tier: 3, prestige: 58, clubAvgOvr: 70 },
  { id: 'deu-schalke-revier', name: 'Revier 04', country: 'Germany', tier: 3, prestige: 64, clubAvgOvr: 73 },
  { id: 'ita-bologna-rossa', name: 'Bologna Rossa', country: 'Italy', tier: 3, prestige: 60, clubAvgOvr: 71 },
  { id: 'nld-utrecht-dom', name: 'Domstad Utrecht', country: 'Netherlands', tier: 3, prestige: 57, clubAvgOvr: 70 },

  // ---- Tier 4 ----
  { id: 'isr-beitar-har', name: 'ביתר ההר', country: 'Israel', tier: 4, prestige: 48, clubAvgOvr: 67 },
  { id: 'tur-bursa-demir', name: 'Bursa Demirspor', country: 'Turkey', tier: 4, prestige: 45, clubAvgOvr: 66 },
  { id: 'sau-al-wahda-sahra', name: 'Al-Wahda Sahra', country: 'Saudi Arabia', tier: 4, prestige: 50, clubAvgOvr: 68 },
  { id: 'bel-gent-buffalo', name: 'Buffalo Gent', country: 'Belgium', tier: 4, prestige: 42, clubAvgOvr: 65 },
  { id: 'prt-braga-minho', name: 'Minho Braga', country: 'Portugal', tier: 4, prestige: 44, clubAvgOvr: 66 },
  { id: 'esp-sporting-gijonero', name: 'Sporting Gijonero', country: 'Spain', tier: 4, prestige: 40, clubAvgOvr: 64 },
  { id: 'deu-fortuna-glas', name: 'Fortuna Glas', country: 'Germany', tier: 4, prestige: 39, clubAvgOvr: 63 },
  { id: 'eng-vale-royal', name: 'Vale Royal FC', country: 'England', tier: 4, prestige: 46, clubAvgOvr: 67 },

  // ---- Tier 5 ----
  { id: 'isr-hapoel-emek', name: 'הפועל עמק', country: 'Israel', tier: 5, prestige: 30, clubAvgOvr: 60 },
  { id: 'isr-maccabi-sahar', name: 'מכבי שחר', country: 'Israel', tier: 5, prestige: 27, clubAvgOvr: 58 },
  { id: 'tur-konya-anadolu', name: 'Konya Anadolu', country: 'Turkey', tier: 5, prestige: 25, clubAvgOvr: 57 },
  { id: 'bel-charleroi-carbon', name: 'Carbon Charleroi', country: 'Belgium', tier: 5, prestige: 24, clubAvgOvr: 57 },
  { id: 'sau-al-fajr', name: 'Al-Fajr FC', country: 'Saudi Arabia', tier: 5, prestige: 33, clubAvgOvr: 61 },
  { id: 'prt-farense-algarve', name: 'Farense Algarve', country: 'Portugal', tier: 5, prestige: 26, clubAvgOvr: 58 },
  { id: 'nld-volendam-haven', name: 'Volendam Haven', country: 'Netherlands', tier: 5, prestige: 23, clubAvgOvr: 56 },
  { id: 'eng-north-fenland', name: 'North Fenland Town', country: 'England', tier: 5, prestige: 28, clubAvgOvr: 59 },

  // ---- Tier 6 ----
  { id: 'isr-hapoel-darom', name: 'הפועל דרום', country: 'Israel', tier: 6, prestige: 14, clubAvgOvr: 51 },
  { id: 'tur-trabzon-sahil', name: 'Trabzon Sahil', country: 'Turkey', tier: 6, prestige: 11, clubAvgOvr: 50 },
  { id: 'bel-mons-borinage', name: 'Borinage Mons', country: 'Belgium', tier: 6, prestige: 9, clubAvgOvr: 49 },
  { id: 'sau-al-badr', name: 'Al-Badr FC', country: 'Saudi Arabia', tier: 6, prestige: 16, clubAvgOvr: 52 },
  { id: 'prt-leixoes-mar', name: 'Leixões do Mar', country: 'Portugal', tier: 6, prestige: 10, clubAvgOvr: 50 },
  { id: 'deu-lok-vorstadt', name: 'Lok Vorstadt', country: 'Germany', tier: 6, prestige: 8, clubAvgOvr: 48 },
  { id: 'esp-cd-secano', name: 'CD Secano', country: 'Spain', tier: 6, prestige: 12, clubAvgOvr: 51 },
  { id: 'eng-dockside-athletic', name: 'Dockside Athletic', country: 'England', tier: 6, prestige: 6, clubAvgOvr: 48 },
];

export function getClubsByTier(tier) {
  return CLUBS.filter((c) => c.tier === tier);
}

export function getClubById(id) {
  return CLUBS.find((c) => c.id === id);
}
