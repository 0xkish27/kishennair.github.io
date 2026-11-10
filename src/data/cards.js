/* card decks, legendary and secret cards, sample leaderboard */
export const DECKS = [
  ['celestial','Celestial','Midnight navy and gold foil with scattered starlight. Calm, romantic, a little regal.'],
  ['grimoire','Grimoire','Dark violet pages and glowing teal ink, like an enchanted storybook. The most mysterious of the three.'],
  ['opaline','Opaline','Pearl and iridescent glass with a light sweep on hover. Dreamy, soft and the most shareable on Instagram.']
];
export const LEG={
  lantern:{card:'The Lamplighter',em:'flame',frag:'He walked every street so two people could find each other.'},
  starfall:{card:'The Wishing Star',em:'star',frag:'It only falls for those who never stopped looking up.'},
  feast:{card:'The Hungry Spirit',em:'bowl',frag:'It told you its name. Few have ever heard it.'},
  echo:{card:'The City\'s Song',em:'note',frag:'Somewhere tonight, it is still playing for you.'}
};
export const SECRETS=[
  {id:'lovers',card:'The Lovers\' Key',em:'heart',frag:'Finish all four journeys.'},
  {id:'owl',card:'The Night Owl',em:'moon',frag:'Begin a journey after 9 pm.'},
  {id:'thrift',card:'The Thrifty Heart',em:'scales',frag:'Finish the Feast spending under RM 20.'},
  {id:'mind',card:'The Mind Reader',em:'eye',frag:'Open every know-me lock on the first try.'},
  {id:'veil',card:'The Veil Walker',em:'keyhole',frag:'Finish a season in the top ten.'}
];
export const SAMPLE=[['Mei & Arjun',6840,31],['Hana & Iqbal',6215,29],['Clara & Wen',5990,27],['Daniel & Priya',4870,22],['Sara & Kenji',4310,20],['Farah & Leon',3905,18],['Joanne & Rizal',3440,15],['Nadia & Jun',2980,13],['Wei Ling & Haziq',2615,11],['Aisha & Marcus',2240,10]];

/* boons: one is drawn face down after the prologue and bends the night in the couple's favour */
export const BOONS = [
  { id: 'flame', card: 'The Spare Flame', em: 'flame', frag: 'One more hint for tonight.' },
  { id: 'key',   card: 'The Forgiving Key', em: 'keyhole', frag: 'Your first mistake tonight is forgiven.' },
  { id: 'echo',  card: 'The Rising Echo', em: 'rings', frag: 'You begin the night already resonating, at ×1.5.' }
];
