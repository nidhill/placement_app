/**
 * All 28 States and 8 Union Territories in India,
 * with comprehensive city, region, and alias mappings for location filtering.
 */

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const INDIAN_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCR)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianStateOrUT =
  | typeof INDIAN_STATES[number]
  | typeof INDIAN_UNION_TERRITORIES[number];

export const STATE_KEYWORDS_MAP: Record<string, string[]> = {
  'Andhra Pradesh': [
    'andhra',
    'ap',
    'visakhapatnam',
    'vizag',
    'vijayawada',
    'guntur',
    'tirupati',
    'amaravati',
    'nellore',
    'kakinada',
    'rajahmundry',
    'kurnool',
    'kadapa',
    'anantapur',
  ],
  'Arunachal Pradesh': ['arunachal', 'itanagar', 'naharlagun', 'pasighat'],
  'Assam': [
    'assam',
    'guwahati',
    'silchar',
    'dibrugarh',
    'jorhat',
    'nagaon',
    'tinsukia',
    'tezpur',
  ],
  'Bihar': [
    'bihar',
    'patna',
    'gaya',
    'bhagalpur',
    'muzaffarpur',
    'purnia',
    'darbhanga',
    'bihar sharif',
    'arrah',
  ],
  'Chhattisgarh': [
    'chhattisgarh',
    'raipur',
    'bhilai',
    'bilaspur',
    'korba',
    'durg',
    'rajnandgaon',
  ],
  'Goa': [
    'goa',
    'panaji',
    'panjim',
    'margao',
    'madgaon',
    'vasco da gama',
    'vasco',
    'mapusa',
    'ponda',
  ],
  'Gujarat': [
    'gujarat',
    'ahmedabad',
    'gandhinagar',
    'surat',
    'vadodara',
    'baroda',
    'rajkot',
    'bhavnagar',
    'jamnagar',
    'junagadh',
    'anand',
    'navsari',
    'morbi',
  ],
  'Haryana': [
    'haryana',
    'gurgaon',
    'gurugram',
    'faridabad',
    'panipat',
    'ambala',
    'karnal',
    'rohtak',
    'hisar',
    'sonipat',
    'panchkula',
    'yamunanagar',
    'bahadurgarh',
  ],
  'Himachal Pradesh': [
    'himachal',
    'hp',
    'shimla',
    'dharamshala',
    'manali',
    'solan',
    'mandi',
    'baddi',
    'kullu',
    'bilaspur',
  ],
  'Jharkhand': [
    'jharkhand',
    'ranchi',
    'jamshedpur',
    'dhanbad',
    'bokaro',
    'deoghar',
    'hazaribagh',
    'giridih',
  ],
  'Karnataka': [
    'karnataka',
    'bangalore',
    'bengaluru',
    'mysore',
    'mysuru',
    'mangalore',
    'mangaluru',
    'hubli',
    'dharwad',
    'belgaum',
    'belagavi',
    'udupi',
    'manipal',
    'tumakuru',
    'tumkur',
    'shimoga',
    'shivamogga',
    'bellary',
    'ballari',
    'davangere',
    'gulbarga',
    'kalaburagi',
  ],
  'Kerala': [
    'kerala',
    'kochi',
    'cochin',
    'ernakulam',
    'thiruvananthapuram',
    'trivandrum',
    'kozhikode',
    'calicut',
    'thrissur',
    'trichur',
    'palakkad',
    'kollam',
    'kottayam',
    'kannur',
    'kasaragod',
    'malappuram',
    'wayanad',
    'idukki',
    'alappuzha',
    'alleppey',
    'pathanamthitta',
  ],
  'Madhya Pradesh': [
    'madhya pradesh',
    'mp',
    'indore',
    'bhopal',
    'gwalior',
    'jabalpur',
    'ujjain',
    'sagar',
    'dewas',
    'satna',
    'ratlam',
    'rewa',
  ],
  'Maharashtra': [
    'maharashtra',
    'mh',
    'mumbai',
    'bombay',
    'pune',
    'nagpur',
    'nashik',
    'thane',
    'navi mumbai',
    'aurangabad',
    'chhatrapati sambhaji nagar',
    'sambhajinagar',
    'solapur',
    'kolhapur',
    'amravati',
    'nanded',
    'jalgaon',
    'akola',
    'latur',
    'dhule',
    'ahmednagar',
  ],
  'Manipur': ['manipur', 'imphal', 'churachandpur'],
  'Meghalaya': ['meghalaya', 'shillong', 'tura', 'jowai'],
  'Mizoram': ['mizoram', 'aizawl', 'lunglei'],
  'Nagaland': ['nagaland', 'kohima', 'dimapur', 'mokokchung'],
  'Odisha': [
    'odisha',
    'orissa',
    'bhubaneswar',
    'cuttack',
    'rourkela',
    'berhampur',
    'sambalpur',
    'puri',
    'balasore',
    'bhadrak',
  ],
  'Punjab': [
    'punjab',
    'pb',
    'mohali',
    'ludhiana',
    'amritsar',
    'jalandhar',
    'patiala',
    'bathinda',
    'hoshiarpur',
    'pathankot',
  ],
  'Rajasthan': [
    'rajasthan',
    'jaipur',
    'jodhpur',
    'udaipur',
    'kota',
    'ajmer',
    'bikaner',
    'bhilwara',
    'alwar',
    'sikar',
    'bharatpur',
  ],
  'Sikkim': ['sikkim', 'gangtok', 'namchi', 'geyzing'],
  'Tamil Nadu': [
    'tamil nadu',
    'tamilnadu',
    'tn',
    'chennai',
    'madras',
    'coimbatore',
    'madurai',
    'tiruchirappalli',
    'trichy',
    'salem',
    'tirunelveli',
    'erode',
    'vellore',
    'tiruppur',
    'thanjavur',
    'dindigul',
    'ranipet',
    'hosur',
    'kanchipuram',
  ],
  'Telangana': [
    'telangana',
    'ts',
    'hyderabad',
    'secunderabad',
    'cyberabad',
    'warangal',
    'nizamabad',
    'karimnagar',
    'khammam',
    'ramagundam',
    'mahbubnagar',
  ],
  'Tripura': ['tripura', 'agartala', 'dharmanagar', 'udaipur'],
  'Uttar Pradesh': [
    'uttar pradesh',
    'up',
    'noida',
    'greater noida',
    'ghaziabad',
    'lucknow',
    'kanpur',
    'agra',
    'varanasi',
    'prayagraj',
    'allahabad',
    'meerut',
    'bareilly',
    'aligarh',
    'moradabad',
    'saharanpur',
    'gorakhpur',
    'firozabad',
    'jhansi',
    'muzaffarnagar',
    'mathura',
  ],
  'Uttarakhand': [
    'uttarakhand',
    'uk',
    'dehradun',
    'haridwar',
    'rishikesh',
    'roorkee',
    'haldwani',
    'nainital',
    'rudrapur',
    'kashipur',
  ],
  'West Bengal': [
    'west bengal',
    'bengal',
    'wb',
    'kolkata',
    'calcutta',
    'howrah',
    'siliguri',
    'durgapur',
    'asansol',
    'bardhaman',
    'malda',
    'kharagpur',
  ],
  'Andaman and Nicobar Islands': ['andaman', 'nicobar', 'port blair'],
  'Chandigarh': ['chandigarh', 'mohali', 'panchkula'],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'dadra',
    'nagar haveli',
    'daman',
    'diu',
    'silvassa',
  ],
  'Delhi (NCR)': [
    'delhi',
    'new delhi',
    'ncr',
    'national capital region',
    'noida',
    'greater noida',
    'gurgaon',
    'gurugram',
    'faridabad',
    'ghaziabad',
  ],
  'Jammu and Kashmir': [
    'jammu and kashmir',
    'jammu & kashmir',
    'j&k',
    'srinagar',
    'jammu',
    'anantnag',
    'baramulla',
  ],
  'Ladakh': ['ladakh', 'leh', 'kargil'],
  'Lakshadweep': ['lakshadweep', 'kavaratti'],
  'Puducherry': ['puducherry', 'pondicherry', 'karaikal', 'mahe', 'yanam'],
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const STATE_CODE_MAP: Record<string, string> = {
  an: 'Andaman and Nicobar Islands',
  ap: 'Andhra Pradesh',
  ar: 'Arunachal Pradesh',
  as: 'Assam',
  br: 'Bihar',
  ch: 'Chandigarh',
  ct: 'Chhattisgarh',
  cg: 'Chhattisgarh',
  dl: 'Delhi (NCR)',
  delhi: 'Delhi (NCR)',
  ncr: 'Delhi (NCR)',
  ga: 'Goa',
  gj: 'Gujarat',
  hr: 'Haryana',
  hp: 'Himachal Pradesh',
  jk: 'Jammu and Kashmir',
  jh: 'Jharkhand',
  ka: 'Karnataka',
  kl: 'Kerala',
  la: 'Ladakh',
  mp: 'Madhya Pradesh',
  mh: 'Maharashtra',
  mn: 'Manipur',
  ml: 'Meghalaya',
  mz: 'Mizoram',
  nl: 'Nagaland',
  or: 'Odisha',
  od: 'Odisha',
  pb: 'Punjab',
  py: 'Puducherry',
  rj: 'Rajasthan',
  sk: 'Sikkim',
  tn: 'Tamil Nadu',
  ts: 'Telangana',
  tg: 'Telangana',
  tr: 'Tripura',
  up: 'Uttar Pradesh',
  uk: 'Uttarakhand',
  ut: 'Uttarakhand',
  wb: 'West Bengal',
};

/**
 * Resolves any state name, city name, abbreviation, or alias to its canonical state name.
 */
export function resolveToCanonicalState(query: string): string | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (!q || q === 'all') return null;

  // Direct check against states
  for (const s of INDIAN_STATES) {
    if (s.toLowerCase() === q) return s;
  }
  for (const ut of INDIAN_UNION_TERRITORIES) {
    if (ut.toLowerCase() === q) return ut;
  }

  // Check state code map
  if (STATE_CODE_MAP[q]) return STATE_CODE_MAP[q];

  // Check keywords mapping
  for (const [state, kws] of Object.entries(STATE_KEYWORDS_MAP)) {
    if (state.toLowerCase().includes(q)) return state;
    for (const kw of kws) {
      if (kw === q) return state;
    }
  }

  return null;
}

/**
 * Checks whether a job's location string matches the selected Indian state, UT, or city entered.
 * Supports:
 * 1. 'ALL' or empty string -> matches all locations.
 * 2. Canonical state resolution (handles 'Karnataka', 'karnataka', 'KA', 'Bangalore', 'Bengaluru').
 * 3. Bidirectional city & state matching.
 * 4. Substring fallback matching for custom input.
 */
export function isJobMatchingLocation(
  jobLocation: string | undefined | null,
  selectedStateOrCity: string
): boolean {
  if (!selectedStateOrCity || selectedStateOrCity === 'ALL' || selectedStateOrCity.trim() === '') {
    return true;
  }
  if (!jobLocation || jobLocation.trim() === '') return false;

  const loc = jobLocation.toLowerCase();
  const rawQ = selectedStateOrCity.trim().toLowerCase();
  if (rawQ === 'all') return true;

  // 1. Direct match on the text entered
  if (loc.includes(rawQ)) return true;

  // 2. Resolve selected input to its canonical state
  const canonicalState = resolveToCanonicalState(selectedStateOrCity);
  if (canonicalState) {
    // Check if the job's location contains the canonical state name
    if (loc.includes(canonicalState.toLowerCase())) return true;

    // Check all keywords/cities for this canonical state
    const keywords = STATE_KEYWORDS_MAP[canonicalState];
    if (keywords) {
      for (const kw of keywords) {
        if (kw.length <= 3) {
          const reg = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(kw)}([^a-zA-Z0-9]|$)`, 'i');
          if (reg.test(loc)) return true;
        } else {
          if (loc.includes(kw)) return true;
        }
      }
    }
  }

  // 3. Reverse check: resolve the job's location to see if it belongs to canonicalState
  for (const [state, kws] of Object.entries(STATE_KEYWORDS_MAP)) {
    let jobMatchesThisState = loc.includes(state.toLowerCase());
    if (!jobMatchesThisState) {
      for (const kw of kws) {
        if (kw.length <= 3) {
          const reg = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(kw)}([^a-zA-Z0-9]|$)`, 'i');
          if (reg.test(loc)) {
            jobMatchesThisState = true;
            break;
          }
        } else {
          if (loc.includes(kw)) {
            jobMatchesThisState = true;
            break;
          }
        }
      }
    }

    if (jobMatchesThisState) {
      if (canonicalState && state === canonicalState) return true;
      if (state.toLowerCase().includes(rawQ) || rawQ.includes(state.toLowerCase())) return true;
    }
  }

  return false;
}
