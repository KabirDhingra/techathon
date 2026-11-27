'use strict';

const HAZARDS = [
  {
    id: 'sharp-glass',
    name: 'Broken glass and sharp objects',
    icon: 'glass',
    risk: 'high',
    summary: 'Sharp edges can cause deep cuts, infections and permanent injury.',
    action: 'Wear thick gloves and use a dustpan and brush, never bare hands. Wrap pieces in cardboard and label the bundle before disposal.',
    keywords: ['glass', 'sharp', 'mirror', 'ceramic', 'cut', 'window', 'shard']
  },
  {
    id: 'medical-waste',
    name: 'Medical and red-bag waste',
    icon: 'bio',
    risk: 'high',
    summary: 'Used syringes, needles and dressings can spread blood-borne infections.',
    action: 'Do not open or sort red bags. Keep them sealed, wear gloves and a mask, and hand them only to an authorised collector.',
    keywords: ['medical', 'red bag', 'syringe', 'needle', 'blood', 'dressing', 'bio', 'clinical']
  },
  {
    id: 'chemical-container',
    name: 'Chemical containers',
    icon: 'chem',
    risk: 'high',
    summary: 'Unknown liquids, acids or cleaners can burn skin and release harmful fumes.',
    action: 'Do not smell, taste or mix unknown chemicals. Keep containers closed, store them upright, and report leaks to the supervisor.',
    keywords: ['chemical', 'acid', 'paint', 'solvent', 'cleaner', 'liquid', 'fume', 'container']
  },
  {
    id: 'battery-ewaste',
    name: 'Batteries and e-waste',
    icon: 'batt',
    risk: 'high',
    summary: 'Damaged batteries and electronics can leak toxic metals or catch fire.',
    action: 'Never crush or burn batteries or circuit boards. Place them in a dry, separate e-waste box and hand them to a registered recycler.',
    keywords: ['battery', 'batteries', 'ewaste', 'e-waste', 'circuit', 'phone', 'electronic', 'lithium']
  },
  {
    id: 'plastic-bottles',
    name: 'Plastic bottles',
    icon: 'bottle',
    risk: 'medium',
    summary: 'Loose bottles can hold dirty water and breed mosquitoes; loose caps can injure feet.',
    action: 'Empty, rinse and flatten bottles before tying them in a sack. Remove or cover caps and keep the sack dry.',
    keywords: ['plastic', 'bottle', 'pet', 'cap', 'water', 'mosquito', 'recycling']
  },
  {
    id: 'paper-cardboard',
    name: 'Paper and cardboard',
    icon: 'box',
    risk: 'low',
    summary: 'Dry paper is low risk but may carry dust, mould or hidden sharps.',
    action: 'Wear gloves, shake out loose dust outdoors, and fold cardboard flat. Keep paper dry and never seal sharp objects inside it.',
    keywords: ['paper', 'cardboard', 'carton', 'box', 'newsprint', 'dust', 'mould']
  },
  {
    id: 'scrap-metal',
    name: 'Scrap metal',
    icon: 'recycle',
    risk: 'medium',
    summary: 'Metal edges, rods and wires can cut, pierce or conduct electricity.',
    action: 'Use gloves and eye protection when lifting or cutting metal. Check for live wires and bundle long pieces with the ends covered.',
    keywords: ['metal', 'scrap', 'iron', 'wire', 'steel', 'rod', 'copper', 'sharp']
  },
  {
    id: 'organic-mixed',
    name: 'Organic and mixed waste',
    icon: 'leaf',
    risk: 'medium',
    summary: 'Rotting food and mixed refuse attract insects, rats and bad fumes.',
    action: 'Separate wet waste from dry recyclables and tie the bag firmly. Wash hands with soap after sorting and clean tools daily.',
    keywords: ['organic', 'food', 'wet', 'mixed', 'garbage', 'rotten', 'leaf', 'compost']
  },
  {
    id: 'unknown-item',
    name: 'Suspicious or unknown item',
    icon: 'alert',
    risk: 'high',
    summary: 'Unmarked bags, cylinders or canisters may contain dangerous material.',
    action: 'Do not touch, open or carry the item. Move others away, note the location and call the supervisor or emergency helpline.',
    keywords: ['unknown', 'suspicious', 'cylinder', 'canister', 'bag', 'hazard', 'unmarked']
  }
];

const LESSONS = [
  {
    id: 'ppe-basics',
    title: 'PPE: Your First Shield',
    duration: '8 min',
    icon: 'shield',
    steps: [
      'Check gloves, mask, goggles and boots before starting work.',
      'Put gloves on last and take them off first; never touch your face with dirty gloves.',
      'Wash reusable PPE with soap and water and dry it in sunlight.',
      'Replace torn gloves, cracked goggles or wet masks immediately.'
    ]
  },
  {
    id: 'hazardous-waste',
    title: 'Handling Hazardous Waste',
    duration: '10 min',
    icon: 'chem',
    steps: [
      'Sort waste only at a clear, well-lit spot and never with bare hands.',
      'Keep sharps, chemicals, batteries and medical waste in separate labelled containers.',
      'If a bag leaks, stop work, warn nearby workers and call the supervisor.',
      'Wash hands and tools after every shift; report cuts or skin burns at once.'
    ]
  },
  {
    id: 'heat-health-sos',
    title: 'Heat, Health and Emergency SOS',
    duration: '7 min',
    icon: 'heart',
    steps: [
      'Drink water every 30 minutes in heat and rest in shade when dizzy.',
      'Watch for cramps, headache or confusion and tell a buddy at once.',
      'Dial 108 for an ambulance and 112 for police; share your exact landmark.',
      'Keep your ID, emergency contacts and helpline numbers in your pocket.'
    ]
  }
];

const SCHEMES = [
  {
    id: 'eshram',
    name: 'e-SHRAM',
    amount: 'Rs 2 lakh accident cover',
    who: 'Unorganised workers aged 16-59 with annual income below Rs 15,000',
    benefit: 'Aadhaar-linked worker ID, accident insurance and access to welfare schemes',
    documents: ['Aadhaar card', 'Mobile number linked to Aadhaar', 'Bank account details if available'],
    steps: [
      'Visit eshram.gov.in or open the e-SHRAM app.',
      'Choose New Registration and enter Aadhaar, mobile number and OTP.',
      'Fill work and address details, upload proof if asked, and save your UAN.'
    ],
    url: 'https://eshram.gov.in/',
    delhiOnly: false,
    works: []
  },
  {
    id: 'pmjay',
    name: 'PM-JAY (Ayushman Bharat)',
    amount: 'Rs 5 lakh cashless treatment per family per year',
    who: 'Eligible families identified under SECC 2011; check status at a camp or online',
    benefit: 'Cashless secondary and tertiary hospital care anywhere in India',
    documents: ['Aadhaar or ration card', 'Ayushman card or PM-JAY ID', 'Mobile number for OTP'],
    steps: [
      'Check your name at pmjay.gov.in or at an enrolment camp.',
      'Get an Ayushman card if eligible and save a copy on your phone.',
      'At an empanelled hospital, show the card and Aadhaar for cashless care.'
    ],
    url: 'https://pmjay.gov.in/',
    delhiOnly: false,
    works: []
  },
  {
    id: 'swachh-bharat-bonus',
    name: 'Swachh Bharat Mission (Urban) Performance Incentive',
    amount: 'Performance-linked bonus as notified by the local body',
    who: 'Waste workers engaged by MCD or an authorised contractor in Delhi',
    benefit: 'Extra payment for regular collection, sorting and cleanliness targets',
    documents: ['MCD or contractor work ID', 'Attendance and work log', 'Bank account details'],
    steps: [
      'Ask your MCD or ULB supervisor which incentive applies to your ward.',
      'Keep daily attendance and route records for your work.',
      'Submit the claim through your contractor or ULB and check your bank account.'
    ],
    url: 'https://sbmurban.gov.in/',
    delhiOnly: true,
    works: ['waste collection', 'sweeping', 'sorting']
  },
  {
    id: 'pmsby',
    name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    amount: 'Rs 2 lakh accident cover for Rs 12 per year',
    who: 'Bank account holders aged 18-70',
    benefit: 'Accidental death and full or partial disability insurance cover',
    documents: ['Aadhaar', 'Bank account linked to mobile number', 'Nominee details'],
    steps: [
      'Ask your bank branch or use net banking to find the PMSBY option.',
      'Opt in and give consent for auto-debit of Rs 12 each year.',
      'Note the policy reference number and inform your nominee.'
    ],
    url: 'https://www.jansuraksha.gov.in/',
    delhiOnly: false,
    works: []
  },
  {
    id: 'pmkvy-skill-india',
    name: 'PMKVY / Skill India',
    amount: 'Free training and certification; stipulated stipend may apply',
    who: 'Youth and workers interested in sanitation, waste management or recycling skills',
    benefit: 'Short-term training, assessment and a government-recognised certificate',
    documents: ['Aadhaar', 'Education or work proof if available', 'Bank account for any stipend'],
    steps: [
      'Register on the Skill India portal or visit a nearby training centre.',
      'Choose a trade such as sanitation, waste management or electrician.',
      'Attend classes and pass the assessment to receive your certificate.'
    ],
    url: 'https://www.skillindia.gov.in/',
    delhiOnly: false,
    works: ['waste management', 'sanitation', 'recycling']
  }
];

const TIPS = [
  'Wear gloves, a mask and sturdy shoes before touching any waste.',
  'Never pick up sharp items, syringes or broken glass with bare hands.',
  'Keep chemical, battery and medical waste in separate labelled bags.',
  'Wash hands with soap and water before eating, drinking or going home.',
  'Drink water often and rest in shade during extreme heat.',
  'Lift heavy sacks with bent knees and a straight back; ask a buddy for help.',
  'Do not burn waste; smoke and fumes can harm your lungs.',
  'Save 112, 108 and your supervisor number in your phone.'
];

const CAMPS = [
  {
    id: 'camp-rohini',
    name: 'Rohini Safety and Health Camp',
    type: 'Health check-up and e-SHRAM enrolment',
    location: 'Rohini Sector 24, Delhi',
    schedule: 'Every Tuesday, 10:00 AM - 2:00 PM',
    distance: '2 km from Sector 21 metro'
  },
  {
    id: 'camp-bawana',
    name: 'Bawana Worker Welfare Camp',
    type: 'Document help and insurance enrolment',
    location: 'Bawana Industrial Area, Delhi',
    schedule: 'First Saturday of every month, 9:30 AM - 1:30 PM',
    distance: '1 km from Bawana bus stand'
  },
  {
    id: 'camp-mundka',
    name: 'Mundka Worker Camp',
    type: 'Safety training and PM-JAY check',
    location: 'Mundka, West Delhi',
    schedule: 'Every Thursday, 11:00 AM - 3:00 PM',
    distance: '3 km from Mundka metro'
  }
];

const CENTRES = [
  {
    id: 'centre-rohini',
    name: 'Rohini Recycling Point',
    lat: 28.6885,
    lng: 77.119,
    materials: 'Plastic · Metal · Paper',
    hours: 'Mon-Sat, 9 AM - 5 PM',
    verified: true,
    phone: '155304'
  },
  {
    id: 'centre-bawana',
    name: 'Bawana Scrap Collection Centre',
    lat: 28.755,
    lng: 77.04,
    materials: 'Metal · Plastic · E-waste',
    hours: 'Daily, 8 AM - 6 PM',
    verified: true,
    phone: '155304'
  },
  {
    id: 'centre-mundka',
    name: 'Mundka Dry Waste Centre',
    lat: 28.667,
    lng: 77.081,
    materials: 'Plastic · Paper · Cardboard',
    hours: 'Tue-Sun, 10 AM - 6 PM',
    verified: true,
    phone: '155304'
  },
  {
    id: 'centre-najafgarh',
    name: 'Najafgarh Collection Hub',
    lat: 28.611,
    lng: 77.105,
    materials: 'Plastic · Metal · Paper · Glass',
    hours: 'Mon-Sat, 9 AM - 5 PM',
    verified: true,
    phone: '155304'
  }
];

const EMERGENCY = {
  police: '112',
  ambulance: '108',
  fire: '101',
  women: '1091',
  cyber: '1930',
  support: '14404'
};

module.exports = { HAZARDS, LESSONS, SCHEMES, TIPS, CAMPS, CENTRES, EMERGENCY };
