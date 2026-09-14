// House of Jewelux - Global Data & Inventory Catalogue V2
// Master Build: Fine 925 Sterling Silver Focus, Future Gold Suite, Studio Persistence & Multilingual Dictionaries

const JEWELUX_DATA = {
  storeConfig: {
    whatsappNumber: "+919876543210",
    whatsappWelcome: "Hello House of Jewelux Concierge! I would like to inquire about fine jewellery and bespoke commissions.",
    founderPIN: "1985",
    announcementText: "THE SILVER EDIT 2026 — Certified 925 Hallmarked Fine Silver & Anti-Tarnish Rhodium • Complimentary Insured Global Delivery",
    heroHeadline: "Where Elegance Becomes Eternal",
    heroSubtitle: "Italian Didone sophistication sculpted with generational Indian artistry. Discover certified 925 fine sterling silver and bespoke gold bridal commissions.",
    heroCtaText: "Explore The Silver Edit",
    heroCtaHash: "#silver",
    freeShippingThresholdUSD: 250,
    shippingDaysDomestic: "2 - 4 Business Days (Armored White-Glove)",
    shippingDaysInternational: "4 - 7 Business Days (Fully Insured FedEx Priority)",
    returnsGuaranteeDays: 30,
    silverSpotlightEnabled: true
  },

  currencies: {
    USD: { symbol: '$', rate: 1.0, label: 'USD ($)' },
    EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' },
    GBP: { symbol: '£', rate: 0.79, label: 'GBP (£)' },
    INR: { symbol: '₹', rate: 83.5, label: 'INR (₹)' },
    AED: { symbol: 'AED ', rate: 3.67, label: 'AED (د.إ)' }
  },

  categories: [
    { id: 'all', name: 'All Masterpieces', hash: '#shop' },
    { id: 'silver', name: 'Fine 925 Silver', hash: '#silver' },
    { id: 'couples', name: 'Newlywed & Couples', hash: '#couples' },
    { id: 'rings', name: 'Rings', hash: '#rings' },
    { id: 'earrings', name: 'Earrings', hash: '#earrings' },
    { id: 'necklaces', name: 'Necklaces', hash: '#necklaces' },
    { id: 'bracelets', name: 'Bracelets', hash: '#bracelets' },
    { id: 'bangles', name: 'Bangles', hash: '#bangles' },
    { id: 'temple', name: 'Temple Heirlooms', hash: '#temple' },
    { id: 'gold-vault', name: 'The Gold Vault (Bespoke)', hash: '#gold-vault' }
  ],

  collections: [
    {
      id: 'silver-edit',
      name: 'The Silver Edit',
      tagline: 'Certified 925 Sterling Silver dipped in liquid platinum-rhodium lustre.',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      category: 'silver',
      description: 'Modern architectural silhouettes set with brilliant lab-certified GRA moissanite and micro-pavé diamond accents. 100% anti-tarnish and skin-safe.'
    },
    {
      id: 'eternal-couples',
      name: 'Newlywed & Couple Sanctuary',
      tagline: 'Conceived for love, sculpted for lifelong companionship.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      category: 'couples',
      description: 'Ergonomic comfort-fit couple bands, bridal promise solitaires, and sacred modern mangalsutra necklaces crafted in 925 hallmarked sterling silver.'
    },
    {
      id: 'everyday-icons',
      name: 'The Everyday Icons',
      tagline: 'Understated elegance designed to elevate personal daily rituals.',
      image: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      category: 'bracelets',
      description: 'Articulated tennis bracelets, stackable cuffs, and luminous solitaire drops engineered for seamless transitions from office to evening gala.'
    },
    {
      id: 'temple-heritage',
      name: 'The Temple Collection',
      tagline: 'Sacred Indian artisanal heritage harmonized with contemporary Italian grace.',
      image: 'images/jewelux_temple_heritage.jpg',
      category: 'temple',
      description: 'Hand-chased 22K antique matte gold, uncut polki diamonds, and divine sacred motifs reimagined for the international aesthete.'
    },
    {
      id: 'gold-vault',
      name: 'The Royal Gold Vault',
      tagline: 'Haute joaillerie and high-carat gold pieces crafted on bespoke commission.',
      image: 'images/jewelux_hero_necklace.jpg',
      category: 'gold-vault',
      description: 'Solid 18K Fairmined Champagne Gold and D-Flawless natural diamonds created exclusively on private salon commission.'
    }
  ],

  products: [
    // ================= 1. FINE 925 STERLING SILVER SPOTLIGHT (CURRENT COMMERCIAL FOCUS) =================
    {
      id: 'HJ-SIL-001',
      name: 'The Celestial Radiance 925 Solitaire Ring',
      category: 'rings',
      collection: 'silver-edit',
      tag: 'Silver Flagship',
      priceUSD: 185,
      image: 'images/jewelux_solitaire_ring.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_solitaire_ring.jpg',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Solid 925 Sterling Silver (Triple Rhodium Plated Anti-Tarnish)',
      purity: '925 Silver Hallmarked',
      stone: '2.50 ct D-Flawless Lab Moissanite (GRA Certified)',
      cut: 'Brilliant Round 8-Hearts & 8-Arrows',
      clarity: 'VVS1 (Eye-Clean Superb Refraction)',
      certificate: 'GRA Gemological Dossier Included',
      metalWeight: '4.2 grams solid 925 silver',
      description: 'Meticulously cast in hypoallergenic 925 Sterling Silver dipped in a thick barrier of liquid platinum-rhodium to prevent tarnishing. The center 2.50 carat D-Color Moissanite is crowned with eight whisper-thin prongs and a hidden pavé gallery for unmatched fire and dispersion.',
      badge: 'Silver Spotlight',
      isSilver: true,
      isGold: false,
      isNew: true,
      isBestSeller: true,
      stockStatus: 'In Stock',
      targetAudience: 'Bridal Promise & Self-Purchase',
      sizes: ['US 5 / 49mm', 'US 6 / 52mm', 'US 7 / 54mm', 'US 8 / 57mm', 'Bespoke Sizing Complimentary'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver (Stamped)',
        'Plating': 'Triple Liquid Rhodium Anti-Tarnish Guard',
        'Center Stone': '2.50 Carat D-Color Lab Moissanite',
        'Clarity & Cut': 'VVS1 / Hearts & Arrows Ideal Cut',
        'Certificate': 'GRA Authenticity Certificate & Warranty Card',
        'Gross Weight': '4.20 grams'
      }
    },
    {
      id: 'HJ-SIL-002',
      name: 'The Amore Eternal Couple Bands (Matching Set of 2)',
      category: 'couples',
      collection: 'eternal-couples',
      tag: 'Newlywed Favorite',
      priceUSD: 240,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'images/jewelux_solitaire_ring.jpg',
      gallery: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
        'images/jewelux_solitaire_ring.jpg'
      ],
      metal: 'Solid 925 Sterling Silver (Hand-Burnished Comfort Fit)',
      purity: '925 Silver Hallmarked',
      stone: 'Secret Flush-Set Brilliant Moissanite on Her Band',
      cut: 'Comfort-Fit Ergonomic Curved Interior',
      clarity: 'VVS1',
      certificate: 'House of Jewelux Hallmarked Warranty',
      metalWeight: '8.8 grams combined pair weight',
      description: 'Conceived exclusively for newlyweds and couples celebrating milestones. Two complementary rings sculpted with an ergonomic comfort-fit curve. Her band features a discreet flush-set star moissanite, while his band possesses a refined brushed-satin center with mirror-polished bevels. Complimentary custom inside date engraving.',
      badge: 'Newlywed Curation',
      isSilver: true,
      isGold: false,
      isNew: true,
      isBestSeller: true,
      stockStatus: 'In Stock',
      targetAudience: 'Newly Married Couples & Anniversaries',
      sizes: ['Set: Her US 6 / His US 9', 'Set: Her US 7 / His US 10', 'Set: Custom Sizes (Enter in Notes)'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver (Dual Stamped)',
        'Plating': 'Platinum-Rhodium High-Gloss Barrier',
        'Finish': 'Satin-Brushed Center with Beveled Edges',
        'Engraving': 'Complimentary Calligraphy Inside Engraving',
        'Combined Weight': '8.80 grams total'
      }
    },
    {
      id: 'HJ-SIL-003',
      name: 'The Sovereign 925 Silver Tennis Bracelet',
      category: 'bracelets',
      collection: 'silver-edit',
      tag: 'Iconic Luxury',
      priceUSD: 320,
      image: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Solid 925 Sterling Silver with Double Safety Clasp',
      purity: '925 Silver Hallmarked',
      stone: '52 Round Brilliant GRA Moissanites (6.50 ct Total Weight)',
      cut: 'Round Ideal Cut (3.5mm each)',
      clarity: 'VVS1 Colorless D',
      certificate: 'GRA Certificate of Authenticity',
      metalWeight: '11.4 grams',
      description: 'An articulated Italian tennis bracelet designed to flow like liquid silk on the wrist. Each 3.5mm moissanite is hand-set into custom low-profile prongs engineered to never snag fine silk dresses. Equipped with a dual-latch box safety mechanism.',
      badge: 'Bestseller',
      isSilver: true,
      isGold: false,
      isNew: false,
      isBestSeller: true,
      stockStatus: 'In Stock',
      targetAudience: 'Modern Women Everyday Luxury',
      sizes: ['6.5 inches (Petite)', '7.0 inches (Classic)', '7.5 inches (Relaxed)'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver',
        'Total Carat Weight': '6.50 Carats Equivalent',
        'Number of Stones': '52 Stones (3.5mm each)',
        'Clasp Type': 'Concealed Box Clasp with Double Figure-8 Safety',
        'Metal Weight': '11.4 grams'
      }
    },
    {
      id: 'HJ-SIL-004',
      name: 'The Luna Pavé Halo Mangalsutra Necklace',
      category: 'necklaces',
      collection: 'eternal-couples',
      tag: 'Bridal Heirloom',
      priceUSD: 280,
      image: 'images/jewelux_hero_necklace.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_hero_necklace.jpg',
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Solid 925 Sterling Silver & Genuine Black Spinel Beads',
      purity: '925 Silver Hallmarked',
      stone: '1.20 ct Center Moissanite + 24 Pavé Halo Stones',
      cut: 'Round Brilliant Ideal Cut',
      clarity: 'D-Color VVS1',
      certificate: 'GRA Gemological Report & 925 Assay Card',
      metalWeight: '7.2 grams',
      description: 'The sacred marital bond re-envisioned with contemporary Italian minimalism. A delicate 925 sterling silver hallmarked pendant encircled by a celestial pavé halo, strung on a hypoallergenic silver chain hand-knotted with auspicious faceted black spinel beads.',
      badge: 'Modern Bridal',
      isSilver: true,
      isGold: false,
      isNew: true,
      isBestSeller: true,
      stockStatus: 'In Stock',
      targetAudience: 'Newlywed Brides & Gifting',
      sizes: ['16 inches + 2 inch Extender', '18 inches Standard'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver',
        'Auspicious Beads': 'Faceted Natural Black Spinel (0.8mm)',
        'Center Stone': '1.20 Carat Round Lab Moissanite',
        'Chain Length': '16" with 2" adjustable extender',
        'Metal Weight': '7.20 grams'
      }
    },
    {
      id: 'HJ-SIL-005',
      name: 'The Aurora Pear-Drop Silver Earrings',
      category: 'earrings',
      collection: 'silver-edit',
      tag: 'Evening Elegance',
      priceUSD: 160,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Solid 925 Sterling Silver with Rhodium Mirror Lustre',
      purity: '925 Silver Hallmarked',
      stone: 'Articulated Pear-Cut & Round Brilliant Moissanites (3.2 ct pair)',
      cut: 'Teardrop Pear & Ideal Round',
      clarity: 'VVS1 Colorless D',
      certificate: 'GRA Certificate of Authenticity',
      metalWeight: '5.1 grams',
      description: 'Articulated drop earrings featuring a brilliant round stud suspending a shimmering 1.20ct teardrop pear moissanite. Engineered with balanced weight distribution for all-day comfort without drooping.',
      badge: 'Silver Spotlight',
      isSilver: true,
      isGold: false,
      isNew: true,
      isBestSeller: false,
      stockStatus: 'In Stock',
      targetAudience: 'Women & Cocktail Gala',
      sizes: ['One Size (Drop length 28mm)'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver',
        'Stone Weight': '3.20 ct Total Weight (Pair)',
        'Drop Length': '28mm articulated drop',
        'Closure': 'Secure Butterfly Friction Back with Bell Silencer'
      }
    },
    {
      id: 'HJ-SIL-006',
      name: 'The Venetian Sculpted Silver Kada Bangle',
      category: 'bangles',
      collection: 'silver-edit',
      tag: 'Artisanal Silver',
      priceUSD: 295,
      image: 'images/jewelux_temple_heritage.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_temple_heritage.jpg',
        'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Solid 925 Sterling Silver (Heavy Gauge with Concealed Hinge)',
      purity: '925 Silver Hallmarked',
      stone: 'Florentine Hand-Engraved Scrollwork with Micro-Moissanite Accents',
      cut: 'Subtle Hand-Chased Texture',
      clarity: 'VVS1 Accents',
      certificate: '925 Assay & Hallmark Certification',
      metalWeight: '18.5 grams solid silver',
      description: 'A statement heavy-gauge kada bangle sculpted from pure 925 Sterling Silver. Features intricate Italian renaissance scrollwork hand-chased along the outer rim, fastened with a concealed precision push-button clasp.',
      badge: 'Artisanal Statement',
      isSilver: true,
      isGold: false,
      isNew: true,
      isBestSeller: false,
      stockStatus: 'In Stock',
      targetAudience: 'Women & Festive Heirlooms',
      sizes: ['2.4 (Small: 57mm inner)', '2.6 (Medium: 60mm inner)', '2.8 (Large: 63mm inner)'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver (18.5g)',
        'Hinge': 'Swiss Precision Spring-Loaded Concealed Push Clasp',
        'Width': '8.5mm convex profile',
        'Finish': 'Hand-Burnished Antique Rhodium'
      }
    },
    {
      id: 'HJ-SIL-007',
      name: 'The Empress Emerald-Cut Silver Solitaire Pendant',
      category: 'necklaces',
      collection: 'silver-edit',
      tag: 'Clean Minimalist',
      priceUSD: 210,
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'images/jewelux_hero_necklace.jpg',
      gallery: [
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
        'images/jewelux_hero_necklace.jpg'
      ],
      metal: 'Solid 925 Sterling Silver & Italian Diamond-Cut Chain',
      purity: '925 Silver Hallmarked',
      stone: '3.00 ct Step-Cut Emerald Moissanite (9x7mm)',
      cut: 'Classic Emerald Step Cut',
      clarity: 'D-Color VVS1',
      certificate: 'GRA Gemological Dossier Included',
      metalWeight: '4.8 grams',
      description: 'An architectural 3.00 carat emerald-cut moissanite suspended in a whisper-light four-corner double claw setting. The geometric step facets evoke classic Art Deco grandeur while remaining crisp, modern, and effortless for everyday luxury.',
      badge: 'Trending',
      isSilver: true,
      isGold: false,
      isNew: true,
      isBestSeller: true,
      stockStatus: 'In Stock',
      targetAudience: 'Women Everyday Minimalist',
      sizes: ['18 inches with 2-inch extender'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver',
        'Stone Dimension': '9x7mm (3.00 Carats Equivalent)',
        'Chain Type': 'Italian Diamond-Cut Cable Chain with Lobster Clasp',
        'Metal Weight': '4.8 grams'
      }
    },
    {
      id: 'HJ-SIL-008',
      name: 'The Riviera Bezel Stacking Band Trio',
      category: 'rings',
      collection: 'silver-edit',
      tag: 'Everyday Chic',
      priceUSD: 175,
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'images/jewelux_solitaire_ring.jpg',
      gallery: [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
        'images/jewelux_solitaire_ring.jpg'
      ],
      metal: 'Solid 925 Sterling Silver Trio Bands',
      purity: '925 Silver Hallmarked',
      stone: 'Micro-Bezel Set Brilliant Moissanite Dots',
      cut: 'Round Ideal Cut',
      clarity: 'VVS1',
      certificate: '925 Assay Guarantee Card',
      metalWeight: '5.5 grams trio weight',
      description: 'Three interlockable whisper-thin 925 sterling silver bands punctuated by bezel-encased moissanite droplets. Wear individually for understated daytime chic or stacked together for a radiant cocktail flourish.',
      badge: 'Stackable Favorite',
      isSilver: true,
      isGold: false,
      isNew: false,
      isBestSeller: false,
      stockStatus: 'In Stock',
      targetAudience: 'Self-Purchase & Stacking',
      sizes: ['US 5 / 49mm', 'US 6 / 52mm', 'US 7 / 54mm', 'US 8 / 57mm'],
      specifications: {
        'Metal Purity': 'Solid 925 Sterling Silver (Triple Stamped)',
        'Band Width': '1.5mm per band (4.5mm stacked)',
        'Setting': 'Smooth Bezel Setting (Zero Snagging)'
      }
    },

    // ================= 2. THE ROYAL GOLD VAULT & TEMPLE HEIRLOOMS (BESPOKE COMMISSIONS & FUTURE READY) =================
    {
      id: 'HJ-001',
      name: 'The Sovereign Radiant Solitaire Ring',
      category: 'rings',
      collection: 'gold-vault',
      tag: 'Gold Vault Commission',
      priceUSD: 14500,
      image: 'images/jewelux_solitaire_ring.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_solitaire_ring.jpg',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Platinum 950 & 18K Solid Fairmined Champagne Gold',
      purity: 'BIS Hallmarked 750 / Platinum 950 Assayed',
      stone: '3.20 ct D-Flawless Natural Diamond (GIA Certified)',
      cut: 'Brilliant Round Ideal Cut',
      clarity: 'FL (Flawless Natural)',
      certificate: 'GIA Dossier #221894031',
      metalWeight: '6.8 grams',
      description: 'Handcrafted in our Geneva atelier on bespoke commission. Features an ultra-rare 3.20 carat D-Flawless diamond held by eight whisper-thin platinum claws over an 18K warm gold gallery with a hidden halo of pink melee diamonds.',
      badge: 'Gold Vault Commission',
      isSilver: false,
      isGold: true,
      isNew: false,
      isBestSeller: true,
      stockStatus: 'Atelier Commission',
      targetAudience: 'High Jewellery Bridal Commission',
      sizes: ['Bespoke Custom Sizing upon Private Salon Consultation'],
      specifications: {
        'Metal Purity': 'Platinum 950 & 18K Solid Gold (BIS Hallmarked)',
        'Stone': '3.20 Carat Natural Diamond (D-Flawless)',
        'Laboratory': 'GIA (Gemological Institute of America)',
        'Availability': 'Bespoke Commission via Private WhatsApp Concierge'
      }
    },
    {
      id: 'HJ-002',
      name: 'Empress Emerald & Diamond Cascade Collar',
      category: 'necklaces',
      collection: 'gold-vault',
      tag: 'Haute Joaillerie Masterpiece',
      priceUSD: 38000,
      image: 'images/jewelux_hero_necklace.jpg',
      hoverImage: 'images/jewelux_editorial_hero.jpg',
      gallery: [
        'images/jewelux_hero_necklace.jpg',
        'images/jewelux_editorial_hero.jpg'
      ],
      metal: '18K Solid Champagne Gold (Hand-Articulated)',
      purity: 'BIS Hallmarked 750 Gold',
      stone: '12.40 ct Muzo Colombian Emeralds & 18.5 ct River Diamonds',
      cut: 'Calibré Step Cut Emeralds & Pear Diamonds',
      clarity: 'Minor Cedar Oil Treated / VVS Diamonds',
      certificate: 'SSEF Swiss Gemological Institute #98421',
      metalWeight: '44.5 grams solid 18K gold',
      description: 'A museum-grade high jewellery collar set with certified Colombian emeralds of breathtaking green saturation. Hand-articulated in 18K champagne gold to contour softly against the clavicle.',
      badge: 'Haute Joaillerie',
      isSilver: false,
      isGold: true,
      isNew: false,
      isBestSeller: false,
      stockStatus: 'Atelier Commission',
      targetAudience: 'Museum & Royal Collectors',
      sizes: ['One of a Kind (Salon Viewing Available)'],
      specifications: {
        'Metal Purity': '18K Solid Fairmined Champagne Gold',
        'Gemstone': '12.40 Carat Muzo Colombian Emeralds',
        'Diamond Weight': '18.50 Carat D-F Color VVS Diamonds',
        'Certificate': 'SSEF Swiss Gemological Institute'
      }
    },
    {
      id: 'HJ-003',
      name: 'Padmavati Antique Temple Choker Parure',
      category: 'temple',
      collection: 'temple-heritage',
      tag: 'Sacred Heritage Masterpiece',
      priceUSD: 24500,
      image: 'images/jewelux_temple_heritage.jpg',
      hoverImage: 'images/jewelux_atelier_craft.jpg',
      gallery: [
        'images/jewelux_temple_heritage.jpg',
        'images/jewelux_atelier_craft.jpg'
      ],
      metal: 'Solid 22K Antique Matte Gold with Nakshi Carvings',
      purity: 'BIS 916 Hallmarked Pure Gold',
      stone: 'Natural Polki Uncut Diamonds, Basra Seed Pearls & Burmese Rubies',
      cut: 'Traditional Mughal Jadau & Kundan Setting',
      clarity: 'Natural Heritage Gemstones',
      certificate: 'IGI Certified & BIS Hallmark 916 Stamped',
      metalWeight: '62.0 grams 22K gold',
      description: 'Centuries of South Indian dynastic temple jewellery savoir-faire infused with contemporary royal proportions. Sculpted by 5th-generation goldsmiths featuring Lakshmi prosperity iconography, natural polki diamonds, and real Basra seed pearls.',
      badge: 'Sacred Temple Heirlooms',
      isSilver: false,
      isGold: true,
      isNew: false,
      isBestSeller: true,
      stockStatus: 'Atelier Commission',
      targetAudience: 'Royal Wedding Heirloom',
      sizes: ['Adjustable Silk Dori Tassel in Crimson & Gold'],
      specifications: {
        'Gold Purity': '22K Solid Gold (BIS 916 Hallmarked)',
        'Goldsmith Hours': '160 Ateliers Hours of Hand-Chasing',
        'Precious Stones': 'Natural Polki Diamonds & Basra Pearls',
        'Hallmark': 'Govt. Approved BIS Hallmarked Laser Inscription'
      }
    }
  ],

  faqs: [
    {
      q: "Are all your Silver pieces genuine 925 Sterling Silver?",
      a: "Yes, without exception. Every single silver creation at House of Jewelux is hallmarked solid 925 Sterling Silver (92.5% pure silver alloyed with fine copper for durability, completely nickel-free and lead-free). Each piece bears the official '925' purity hallmark stamp and comes with an Assay Certificate."
    },
    {
      q: "Does your Silver Jewellery tarnish over time?",
      a: "Our silver creations undergo a proprietary Italian triple-dip plating in liquid platinum-rhodium. Rhodium is a noble platinum-group metal that forms an impenetrable, lustrous shield over the silver, preventing oxidation, tarnishing, and scratching while providing that luminous high-jewelry white reflection."
    },
    {
      q: "What stones are used in The Silver Edit?",
      a: "The Silver Edit features certified D-Color, VVS1 Lab Moissanite stones. Moissanite possesses a refractive index of 2.65 (higher than diamond's 2.42), meaning it refracts light with even more dazzling rainbow fire and brilliance. Every solitaire piece over 1.0 carat includes an individual GRA Gemological Certificate."
    },
    {
      q: "How do Gold & Haute Joaillerie bespoke commissions work?",
      a: "While our Silver Edit is readily available for immediate acquisition, our 18K/22K Solid Gold Vault and Temple collections are crafted exclusively on bespoke commission by our master goldsmiths. Simply click 'Inquire on WhatsApp' on any gold piece, and our salon concierge will arrange private sketches, stone curation, and BIS hallmarking tailored to your budget."
    },
    {
      q: "What is your return and exchange policy?",
      a: "We offer a 30-Day Complimentary Return and Exchange window for all standard Silver Edit purchases in pristine, unworn condition with original jewelry boxes and certificates. Return shipping is fully insured and arranged by our white-glove courier."
    },
    {
      q: "How does complimentary armored shipping work?",
      a: "All domestic orders across India and international orders to the US, UK, UAE, and Europe are dispatched via insured priority couriers (BlueDart / FedEx Priority) in tamper-proof discreet packaging. Delivery requires an adult signature upon arrival."
    }
  ],

  policies: {
    shipping: "Complimentary armored white-glove transport on all orders over $250 / ₹20,000. All shipments are 100% insured from our atelier doors to your hands. Standard delivery takes 2–4 business days domestically and 4–7 business days globally.",
    returns: "We offer an unconditional 30-day return guarantee. If your piece does not evoke absolute wonder upon opening the jewel box, contact our WhatsApp Concierge for complimentary insured pickup and a 100% full refund.",
    authenticity: "Zero fake claims covenant: Every piece is accompanied by stamped hallmarking (925 for silver, BIS 750/916 for gold) and independent gemological dossiers (GRA / GIA / IGI). We never use base metals or faux plastic stones."
  },

  bespokeStudio: {
    metals: [
      { id: 'liquid-silver', name: '925 Platinum-Rhodium Silver', color: '#E8EBF0', specular: '#FFFFFF', priceBase: 180, isSilver: true },
      { id: 'champagne-gold', name: '18K Florentine Champagne Gold', color: '#DECCA8', specular: '#FFF8EC', priceBase: 2400, isSilver: false },
      { id: 'rose-gold', name: '18K Venetian Rose Gold', color: '#E5B299', specular: '#FFEAE0', priceBase: 2400, isSilver: false },
      { id: 'platinum', name: 'Pure Platinum 950', color: '#D9DDE2', specular: '#FFFFFF', priceBase: 3100, isSilver: false }
    ],
    gems: [
      { id: 'moissanite', name: 'D-Flawless Lab Moissanite', color: '#FFFFFF', dispersion: 0.104, pricePerCarat: 75 },
      { id: 'diamond', name: 'D-Flawless Natural Diamond (GIA)', color: '#FFFFFF', dispersion: 0.044, pricePerCarat: 4800 },
      { id: 'emerald', name: 'Muzo Colombian Emerald', color: '#10B981', dispersion: 0.014, pricePerCarat: 3200 },
      { id: 'sapphire', name: 'Ceylon Royal Sapphire', color: '#1D4ED8', dispersion: 0.018, pricePerCarat: 2800 },
      { id: 'ruby', name: 'Burmese Pigeon Blood Ruby', color: '#BE123C', dispersion: 0.018, pricePerCarat: 3900 }
    ],
    cuts: [
      { id: 'round', name: 'Brilliant Round', ratio: 1.0 },
      { id: 'emerald-cut', name: 'Emerald Step Cut', ratio: 1.15 },
      { id: 'oval', name: 'Royal Oval', ratio: 1.08 },
      { id: 'pear', name: 'Teardrop Pear', ratio: 1.12 }
    ],
    carats: [
      { weight: 1.0, label: '1.00 Carat' },
      { weight: 1.75, label: '1.75 Carat' },
      { weight: 2.5, label: '2.50 Carat (Flagship)' },
      { weight: 4.0, label: '4.00 Carat (Statement)' }
    ]
  }
};

// ================= MULTILINGUAL DICTIONARY (INTERNATIONAL READY) =================
const JEWELUX_I18N = {
  en: {
    announcement: "THE SILVER EDIT 2026 — 925 Hallmarked Fine Silver & Anti-Tarnish Rhodium • Complimentary Insured Delivery",
    nav_all: "All Masterpieces",
    nav_silver: "Fine 925 Silver",
    nav_couples: "Newlywed & Couples",
    nav_gold: "The Gold Vault",
    nav_craftsmanship: "Craftsmanship",
    nav_about: "About Us",
    nav_bespoke: "Bespoke 3D Studio",
    nav_studio: "Founder Studio",
    cta_add_bag: "Add to Bag",
    cta_acquire_now: "Acquire Now",
    cta_whatsapp: "Inquire on WhatsApp",
    cta_consult: "Consult Atelier",
    purity_silver: "925 Hallmarked Fine Silver",
    purity_gold: "18K/22K BIS Hallmarked Gold",
    badge_silver_spotlight: "Silver Spotlight",
    honest_luxury_title: "The Honest Luxury Covenant",
    honest_luxury_desc: "100% Certified 925 Sterling Silver & BIS Hallmarked Gold. Zero fake claims, verified gemological dossiers, and lifetime complimentary cleaning."
  },
  hi: {
    announcement: "द सिल्वर एडिट 2026 — 925 हॉलमार्क फाइन सिल्वर और एंटी-टार्निश रोडियम • मुफ़्त बीमाकृत डिलीवरी",
    nav_all: "सभी गहने",
    nav_silver: "फाइन 925 सिल्वर",
    nav_couples: "नवविवाहित और कपल्स",
    nav_gold: "रॉयल गोल्ड वॉल्ट",
    nav_craftsmanship: "कारीगरी",
    nav_about: "हमारे बारे में",
    nav_bespoke: "3D रिंग स्टूडियो",
    nav_studio: "फाउंडर स्टूडियो",
    cta_add_bag: "बैग में जोड़ें",
    cta_acquire_now: "अभी खरीदें",
    cta_whatsapp: "व्हाट्सएप पर बात करें",
    cta_consult: "कारीगर से सलाह लें",
    purity_silver: "925 हॉलमार्क्ड शुद्ध चांदी",
    purity_gold: "18K/22K बीआईएस हॉलमार्क सोना",
    badge_silver_spotlight: "सिल्वर स्पॉटलाइट",
    honest_luxury_title: "सच्ची लग्ज़री का वादा",
    honest_luxury_desc: "100% प्रमाणित 925 स्टर्लिंग चांदी और बीआईएस हॉलमार्क सोना। कोई झूठे दावे नहीं, प्रामाणिक लैब सर्टिफिकेट और आजीवन मुफ़्त पॉलिशिंग।"
  },
  fr: {
    announcement: "L'ÉDITION ARGENT 2026 — Argent 925 Poinçonné et Rhodium Anti-Ternissure • Livraison Offerte et Assurée",
    nav_all: "Toutes les Pièces",
    nav_silver: "Argent Fin 925",
    nav_couples: "Nouveaux Mariés & Couples",
    nav_gold: "Le Coffre d'Or",
    nav_craftsmanship: "Savoir-Faire",
    nav_about: "Maison",
    nav_bespoke: "Studio 3D Sur-Mesure",
    nav_studio: "Studio Fondateur",
    cta_add_bag: "Ajouter au Panier",
    cta_acquire_now: "Acquérir",
    cta_whatsapp: "Consulter sur WhatsApp",
    cta_consult: "Prendre Rendez-vous",
    purity_silver: "Argent 925 Poinçonné",
    purity_gold: "Or 18K/22K Certifié",
    badge_silver_spotlight: "Vedette Argent",
    honest_luxury_title: "Le Pacte de Luxe Véritable",
    honest_luxury_desc: "Argent 925 pur et Or certifié. Aucune fausse promesse, rapports gemmologiques rigoureux et garantie à vie."
  },
  it: {
    announcement: "THE SILVER EDIT 2026 — Argento 925 Punzonato e Rodio Lucido • Consegna Assicurata Gratuita",
    nav_all: "Tutti i Capolavori",
    nav_silver: "Argento 925 Pregiato",
    nav_couples: "Sposi & Coppie",
    nav_gold: "Il Caveau d'Oro",
    nav_craftsmanship: "Artigianato",
    nav_about: "La Maison",
    nav_bespoke: "Studio 3D su Misura",
    nav_studio: "Studio Fondatore",
    cta_add_bag: "Aggiungi al Carrello",
    cta_acquire_now: "Acquista Ora",
    cta_whatsapp: "Contatta su WhatsApp",
    cta_consult: "Consulta l'Atelier",
    purity_silver: "Argento 925 Autentico",
    purity_gold: "Oro 18K/22K Certificato",
    badge_silver_spotlight: "In Primo Piano",
    honest_luxury_title: "Il Patto del Lusso Autentico",
    honest_luxury_desc: "Argento 925 e Oro garantito al 100%. Trasparenza assoluta, certificati gemmologici e cura a vita."
  }
};

// ================= STORAGE & PERSISTENCE HELPER (NO CODE EDITING NEEDED) =================
const JEWELUX_STORAGE = {
  KEY: 'jewelux_custom_data_v2',

  getStoreData() {
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...JEWELUX_DATA,
          storeConfig: { ...JEWELUX_DATA.storeConfig, ...(parsed.storeConfig || {}) },
          products: parsed.products && parsed.products.length ? parsed.products : JEWELUX_DATA.products,
          faqs: parsed.faqs && parsed.faqs.length ? parsed.faqs : JEWELUX_DATA.faqs,
          policies: { ...JEWELUX_DATA.policies, ...(parsed.policies || {}) },
          inquiries: parsed.inquiries || []
        };
      }
    } catch (e) {
      console.warn('Could not read custom store data from localStorage', e);
    }
    return { ...JEWELUX_DATA, inquiries: [] };
  },

  saveStoreData(customData) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(customData));
      return true;
    } catch (e) {
      console.error('Error saving store data to localStorage', e);
      return false;
    }
  },

  exportJson() {
    const data = this.getStoreData();
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", str);
    dlAnchor.setAttribute("download", `house-of-jewelux-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  },

  importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && (parsed.products || parsed.storeConfig)) {
        this.saveStoreData(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON file', e);
    }
    return false;
  },

  resetDefaults() {
    localStorage.removeItem(this.KEY);
  }
};

if (typeof window !== 'undefined') {
  window.JEWELUX_DATA = JEWELUX_DATA;
  window.JEWELUX_I18N = JEWELUX_I18N;
  window.JEWELUX_STORAGE = JEWELUX_STORAGE;
}
