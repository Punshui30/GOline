export interface DemoStrain {
  id: string;
  name: string;
  category: string;
  // Internal attributes (not exposed in UI)
  energy?: '↑' | '↓';
  sociability?: '↑' | '↓';
  mentalClarity?: 'clarity' | 'introspection';
  anxietyRisk?: 'low' | 'medium' | 'high';
  bodyLoad?: 'light' | 'moderate' | 'heavy';
}

export const DEMO_MENU: DemoStrain[] = [
  // Indica-leaning
  {
    id: "bubba-kush",
    name: "Bubba Kush",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'heavy'
  },
  {
    id: "granddaddy-purple",
    name: "Granddaddy Purple",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'heavy'
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'moderate'
  },
  {
    id: "afghani",
    name: "Afghani",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'heavy'
  },
  {
    id: "kosher-kush",
    name: "Kosher Kush",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'moderate'
  },
  {
    id: "purple-punch",
    name: "Purple Punch",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'moderate'
  },
  {
    id: "skywalker-og",
    name: "Skywalker OG",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'moderate'
  },
  {
    id: "hindu-kush",
    name: "Hindu Kush",
    category: "Indica-leaning",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'heavy'
  },
  
  // Hybrid (balanced / expressive)
  {
    id: "gelato",
    name: "Gelato",
    category: "Hybrid (balanced / expressive)",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'moderate'
  },
  {
    id: "blue-dream",
    name: "Blue Dream",
    category: "Hybrid (balanced / expressive)",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  },
  {
    id: "wedding-cake",
    name: "Wedding Cake",
    category: "Hybrid (balanced / expressive)",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'moderate'
  },
  {
    id: "runtz",
    name: "Runtz",
    category: "Hybrid (balanced / expressive)",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  {
    id: "mac",
    name: "MAC (Miracle Alien Cookies)",
    category: "Hybrid (balanced / expressive)",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  {
    id: "dosidos",
    name: "Dosidos",
    category: "Hybrid (balanced / expressive)",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'moderate'
  },
  {
    id: "zkittlez",
    name: "Zkittlez",
    category: "Hybrid (balanced / expressive)",
    energy: '↓',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  },
  {
    id: "ice-cream-cake",
    name: "Ice Cream Cake",
    category: "Hybrid (balanced / expressive)",
    energy: '↓',
    sociability: '↓',
    mentalClarity: 'introspection',
    anxietyRisk: 'low',
    bodyLoad: 'moderate'
  },
  {
    id: "sunset-sherbet",
    name: "Sunset Sherbet",
    category: "Hybrid (balanced / expressive)",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  
  // Sativa-leaning
  {
    id: "jack-herer",
    name: "Jack Herer",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  {
    id: "durban-poison",
    name: "Durban Poison",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'high',
    bodyLoad: 'light'
  },
  {
    id: "sour-diesel",
    name: "Sour Diesel",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  {
    id: "green-crack",
    name: "Green Crack",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'high',
    bodyLoad: 'light'
  },
  {
    id: "super-lemon-haze",
    name: "Super Lemon Haze",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  {
    id: "tangie",
    name: "Tangie",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'medium',
    bodyLoad: 'light'
  },
  {
    id: "strawberry-cough",
    name: "Strawberry Cough",
    category: "Sativa-leaning",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  },
  
  // Functional / low-anxiety favorites
  {
    id: "cannatonic",
    name: "Cannatonic",
    category: "Functional / low-anxiety favorites",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  },
  {
    id: "harlequin",
    name: "Harlequin",
    category: "Functional / low-anxiety favorites",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  },
  {
    id: "acdc",
    name: "ACDC",
    category: "Functional / low-anxiety favorites",
    energy: '↑',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  },
  {
    id: "pennywise",
    name: "Pennywise",
    category: "Functional / low-anxiety favorites",
    energy: '↓',
    sociability: '↑',
    mentalClarity: 'clarity',
    anxietyRisk: 'low',
    bodyLoad: 'light'
  }
];
