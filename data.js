// House of Jewelux - Global Data & Inventory Catalogue

const JEWELUX_DATA = {
  currencies: {
    USD: { symbol: '$', rate: 1.0, label: 'USD ($)' },
    EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' },
    GBP: { symbol: '£', rate: 0.79, label: 'GBP (£)' },
    INR: { symbol: '₹', rate: 83.5, label: 'INR (₹)' },
    AED: { symbol: 'AED ', rate: 3.67, label: 'AED (د.إ)' }
  },

  categories: [
    { id: 'all', name: 'All Masterpieces' },
    { id: 'haute', name: 'Haute Joaillerie' },
    { id: 'bridal', name: 'Bridal & Solitaire' },
    { id: 'gemstones', name: 'Royal Gemstones' },
    { id: 'everyday', name: 'Everyday Fine Luxury' }
  ],

  products: [
    {
      id: 'HJ-001',
      name: 'The Sovereign Radiant Solitaire',
      category: 'bridal',
      tag: 'Iconic Masterpiece',
      priceUSD: 14500,
      image: 'images/jewelux_solitaire_ring.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      metal: 'Platinum 950 & 18K Yellow Gold',
      stone: '3.20 ct D-Flawless Diamond',
      cut: 'Brilliant Round Ideal Cut',
      clarity: 'FL (Flawless)',
      certificate: 'GIA #221894031',
      description: 'Handcrafted in our Geneva atelier, The Sovereign features an ultra-rare 3.20 carat D-Flawless diamond held by eight whisper-thin platinum claws over a hidden halo of pink argyle melee diamonds.',
      badge: 'Best Seller'
    },
    {
      id: 'HJ-002',
      name: 'Empress Emerald & Diamond Cascade',
      category: 'haute',
      tag: 'High Jewellery',
      priceUSD: 38200,
      image: 'images/jewelux_hero_necklace.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      metal: '18K White Gold & Solid Platinum',
      stone: '12.40 ctw Muzo Colombian Emeralds & F-VS1 Diamonds',
      cut: 'Emerald Cut & Marquise Cluster',
      clarity: 'VVS1 Natural Untreated',
      certificate: 'SSEF Swiss Gemmological Report',
      description: 'A breathtaking high-jewellery statement collar boasting vivid green Colombian emeralds from the historic Muzo mines, framed by cascading marquise and brilliant round diamonds.',
      badge: 'Haute Joaillerie'
    },
    {
      id: 'HJ-003',
      name: 'L’Étoile Ceylon Sapphire Choker',
      category: 'gemstones',
      tag: 'Rare Gemstone',
      priceUSD: 24800,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      metal: '18K Fairmined White Gold',
      stone: '7.85 ct Royal Blue Royal Ceylon Sapphire',
      cut: 'Cushion Brilliant Cut',
      clarity: 'Eye-Clean Royal Blue',
      certificate: 'Gübelin Gem Lab Certified',
      description: 'Centering a majestic unheated Royal Blue Ceylon sapphire cradled by an asymmetric constellation of pear-shaped brilliant diamonds, celebrating eternal celestial harmony.',
      badge: 'Rare Find'
    },
    {
      id: 'HJ-004',
      name: 'Aura Pavé Diamond Tennis Bracelet',
      category: 'everyday',
      tag: 'Signature Everyday',
      priceUSD: 8900,
      image: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      metal: '18K Warm Yellow Gold',
      stone: '5.50 ctw E-F VS1 Lab-Certified Diamonds',
      cut: 'Brilliant Round Four-Prong',
      clarity: 'VS1',
      certificate: 'House of Jewelux Authenticity Certificate',
      description: 'The quintessential luxury essential. Engineered with a double safety catch and fluid articulated links that drape effortlessly over the wrist like molten golden silk.',
      badge: 'Timeless Classic'
    },
    {
      id: 'HJ-005',
      name: 'The Celeste Pear Diamond Drops',
      category: 'bridal',
      tag: 'Bridal Splendor',
      priceUSD: 16400,
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      metal: 'Platinum 950',
      stone: '4.60 ctw D-E Color Pear & Brilliant Diamonds',
      cut: 'Artisan Pear Brilliant',
      clarity: 'VVS2',
      certificate: 'GIA Dual Dossier',
      description: 'Graceful articulated earrings featuring twin matched pear-shaped diamonds that catch and reflect candlelight with every movement, creating a mesmerizing shimmer.',
      badge: 'Bridal Selection'
    },
    {
      id: 'HJ-006',
      name: 'Reine de Rubis Crimson Statement Ring',
      category: 'gemstones',
      tag: 'Collector Series',
      priceUSD: 29500,
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      metal: '18K Rose Gold & Platinum',
      stone: '5.10 ct Unheated Pigeon Blood Burmese Ruby',
      cut: 'Oval Brilliant Cut with Tapered Baguettes',
      clarity: 'Natural Vivid Red',
      certificate: 'GRS Swiss Gem Research',
      description: 'An exceptionally rare Pigeon Blood ruby endowed with fiery fluorescence, set between hand-calibrated diamond baguettes in a sculptural hand-beveled mount.',
      badge: 'Heritage One-of-a-Kind'
    },
    {
      id: 'HJ-007',
      name: 'Nocturne Diamond Lineage Cuff',
      category: 'haute',
      tag: 'Sculptural Art',
      priceUSD: 21500,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      metal: '18K Blackened & White Gold',
      stone: '8.10 ctw Mixed Cut F-G Diamonds',
      cut: 'Baguette & Brilliant Geometric Pavé',
      clarity: 'VS1',
      certificate: 'Jewelux Haute Joaillerie Archive',
      description: 'Bold architectural lines inspired by Art Deco Parisian facades. Blackened gold prongs accentuate the blinding fire of precision-set diamond baguettes.',
      badge: 'Artisan Crafted'
    },
    {
      id: 'HJ-008',
      name: 'Solstice Golden Pendant Necklace',
      category: 'everyday',
      tag: 'Everyday Elegance',
      priceUSD: 4600,
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      metal: '18K Yellow Gold',
      stone: '1.20 ct Central Diamond + Sunburst Micro-pavé',
      cut: 'Round Brilliant',
      clarity: 'VS1',
      certificate: 'GIA Certified',
      description: 'A luminous celebration of warmth and eternal light. The sunburst fluted gold border magnifies the center diamond, suspended from an adjustable Italian wheat chain.',
      badge: 'New Arrival'
    }
  ],

  bespokeOptions: {
    metals: [
      { id: 'yellow-gold', name: '18K Yellow Gold', color: '#D4AF37', border: '#C5A059', basePrice: 2800 },
      { id: 'rose-gold', name: '18K Rose Gold', color: '#E8A798', border: '#D98978', basePrice: 2850 },
      { id: 'white-gold', name: '18K White Gold', color: '#E5E7EB', border: '#D1D5DB', basePrice: 2950 },
      { id: 'platinum', name: 'Platinum 950', color: '#F3F4F6', border: '#CBD5E1', basePrice: 3500 }
    ],
    gemstones: [
      { id: 'diamond', name: 'D-Flawless Diamond', hex: '#E0F2FE', sparkle: 'rgba(224, 242, 254, 0.95)', multiplier: 4.2 },
      { id: 'emerald', name: 'Muzo Colombian Emerald', hex: '#059669', sparkle: 'rgba(5, 150, 105, 0.85)', multiplier: 3.8 },
      { id: 'sapphire', name: 'Ceylon Royal Sapphire', hex: '#1D4ED8', sparkle: 'rgba(29, 78, 216, 0.85)', multiplier: 3.6 },
      { id: 'ruby', name: 'Pigeon Blood Ruby', hex: '#BE123C', sparkle: 'rgba(190, 18, 60, 0.85)', multiplier: 4.0 }
    ],
    cuts: [
      { id: 'round', name: 'Brilliant Round', ratio: 1.0, shape: 'circle' },
      { id: 'emerald-cut', name: 'Emerald Cut', ratio: 1.15, shape: 'rect' },
      { id: 'oval', name: 'Royal Oval', ratio: 1.08, shape: 'ellipse' },
      { id: 'pear', name: 'Teardrop Pear', ratio: 1.12, shape: 'path' }
    ],
    carats: [
      { weight: 1.0, label: '1.00 Carat', scale: 0.85, priceMultiplier: 1.0 },
      { weight: 1.75, label: '1.75 Carat', scale: 1.05, priceMultiplier: 1.85 },
      { weight: 2.5, label: '2.50 Carat', scale: 1.25, priceMultiplier: 3.1 },
      { weight: 4.0, label: '4.00 Carat (Rare)', scale: 1.5, priceMultiplier: 5.6 }
    ]
  },

  lookbooks: [
    {
      id: 'gala',
      title: 'The Black Tie Gala & Opulence',
      subtitle: 'Sculptural diamonds and vivid emeralds made for dramatic grand entrances.',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
      featuredProduct: 'HJ-002',
      featuredProductTitle: 'Empress Emerald Cascade'
    },
    {
      id: 'bridal',
      title: 'Eternal Vows: The Bridal Sanctuary',
      subtitle: 'Flawless solitaires and matching eternity bands blessed by hand-engraved inscriptions.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
      featuredProduct: 'HJ-001',
      featuredProductTitle: 'The Sovereign Solitaire'
    },
    {
      id: 'chic',
      title: 'Modern Sovereign: Everyday Fine Joaillerie',
      subtitle: 'Clean lines, fluid articulated gold, and subtle brilliance that empowers daily rituals.',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
      featuredProduct: 'HJ-004',
      featuredProductTitle: 'Aura Pavé Tennis Bracelet'
    }
  ],

  testimonials: [
    {
      quote: "House of Jewelux doesn't merely sell jewellery; they curate wearable sculptures that will be whispered about for generations. My bespoke bridal ring exceeded all imagination.",
      author: 'Lady Charlotte V.',
      city: 'London & Monaco',
      piece: 'Bespoke 3.5ct Solitaire Ring',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    {
      quote: "The gemological knowledge and quiet discretion of their bespoke atelier team in Paris is unmatched. The Colombian emerald necklace is now our family's proudest heirloom.",
      author: 'Henri & Delphine Laurent',
      city: 'Paris, Place Vendôme',
      piece: 'Empress Emerald & Diamond Cascade',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    {
      quote: "From initial sketch to hand-delivery in Dubai with full GIA and Gübelin certification, every detail was orchestrated with utmost nobility and perfection.",
      author: 'H.E. Amira Al-Maktoum',
      city: 'Dubai International Financial Centre',
      piece: 'Bespoke Sapphire Parure',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    }
  ],

  boutiques: [
    { city: 'London', address: '14 New Bond Street, Mayfair, London W1S 3PF', phone: '+44 20 7946 0912', hours: 'Mon–Sat: 10:00 – 18:30 (Private Salon by Appointment)' },
    { city: 'Paris', address: '22 Place Vendôme, 75001 Paris, France', phone: '+33 1 42 68 55 00', hours: 'Mon–Sat: 10:30 – 19:00' },
    { city: 'New York', address: '742 Fifth Avenue, New York, NY 10019', phone: '+1 212 555 0199', hours: 'Mon–Sat: 10:00 – 19:00 | Sun: 12:00 – 18:00' },
    { city: 'Dubai', address: 'The Fashion Avenue, The Dubai Mall, Level 1', phone: '+971 4 362 7500', hours: 'Daily: 10:00 – 23:00' }
  ]
};

if (typeof window !== 'undefined') {
  window.JEWELUX_DATA = JEWELUX_DATA;
}
