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
    { id: 'all', name: 'All Masterpieces', hash: '#shop' },
    { id: 'new-arrivals', name: 'New Arrivals', hash: '#new-arrivals' },
    { id: 'best-sellers', name: 'Best Sellers', hash: '#best-sellers' },
    { id: 'rings', name: 'Rings', hash: '#rings' },
    { id: 'earrings', name: 'Earrings', hash: '#earrings' },
    { id: 'necklaces', name: 'Necklaces', hash: '#necklaces' },
    { id: 'bracelets', name: 'Bracelets', hash: '#bracelets' },
    { id: 'bangles', name: 'Bangles', hash: '#bangles' },
    { id: 'silver', name: 'Silver Jewellery', hash: '#silver' },
    { id: 'temple', name: 'Temple Jewellery', hash: '#temple' }
  ],

  collections: [
    {
      id: 'eternal',
      name: 'The Eternal Collection',
      tagline: 'Bridal masterpieces and solitaires conceived to endure across generations.',
      image: 'images/jewelux_solitaire_ring.jpg',
      category: 'rings',
      description: 'D-Flawless certified solitaires and diamond pavé bands crafted in solid Platinum 950 and 18K fairmined gold.'
    },
    {
      id: 'signature',
      name: 'The Signature Collection',
      tagline: 'The pinnacle of Italian Didone elegance sculpted with rare gemstones.',
      image: 'images/jewelux_hero_necklace.jpg',
      category: 'necklaces',
      description: 'Sculptural parures boasting certified Colombian Muzo emeralds, Ceylon royal sapphires, and blinding river diamonds.'
    },
    {
      id: 'heritage',
      name: 'The Heritage Collection',
      tagline: 'Old-world savoir-faire inspired by historic European and Asian royal vaults.',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85',
      category: 'earrings',
      description: 'Art Deco geometric cascades, calibré-cut Burmese rubies, and hand-pierced filigree gold mounts.'
    },
    {
      id: 'temple',
      name: 'The Temple Collection',
      tagline: 'Sacred Indian artisanal heritage harmonized with contemporary Italian grace.',
      image: 'images/jewelux_temple_heritage.jpg',
      category: 'temple',
      description: 'Hand-chased 22K antique matte gold, uncut polki diamonds, and sacred divine motifs reimagined for the global aesthete.'
    },
    {
      id: 'silver-edit',
      name: 'The Silver Edit',
      tagline: 'Pristine 925 Sterling Silver veiled in liquid platinum-rhodium lustre.',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      category: 'silver',
      description: 'Modern architectural forms set with brilliant lab-certified moissanite and micro-pavé diamonds.'
    },
    {
      id: 'everyday-icons',
      name: 'The Everyday Icons',
      tagline: 'Understated brilliance designed to empower everyday personal rituals.',
      image: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      category: 'bracelets',
      description: 'Articulated tennis bracelets, stackable gold bangles, and luminous diamond studs that drape effortlessly.'
    }
  ],

  products: [
    {
      id: 'HJ-001',
      name: 'The Sovereign Radiant Solitaire Ring',
      category: 'rings',
      collection: 'eternal',
      tag: 'Iconic Masterpiece',
      priceUSD: 14500,
      image: 'images/jewelux_solitaire_ring.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_solitaire_ring.jpg',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Platinum 950 & 18K Warm Yellow Gold',
      stone: '3.20 ct D-Flawless Natural Diamond',
      cut: 'Brilliant Round Ideal Cut',
      clarity: 'FL (Flawless)',
      certificate: 'GIA Dossier #221894031',
      description: 'Handcrafted in our Geneva atelier, The Sovereign features an ultra-rare 3.20 carat D-Flawless diamond held by eight whisper-thin platinum claws over an 18K warm gold gallery with a hidden halo of pink melee diamonds.',
      badge: 'Best Seller',
      isNew: false,
      isBestSeller: true,
      sizes: ['US 5 / 49mm', 'US 6 / 52mm', 'US 7 / 54mm', 'US 8 / 57mm', 'Bespoke Sizing Complimentary'],
      specs: {
        dimensions: 'Central Diamond: 9.42 x 9.45 x 5.82 mm',
        grossWeight: '5.85 grams Platinum 950',
        purity: '950/1000 Fine Platinum + 750/1000 Fine Gold',
        accentGems: '0.24 ctw Argyle Pink Melee Diamonds'
      },
      craftsmanship: 'Cast and assembled by hand in Geneva. Eight-prong micro-pavé setting requiring 48 hours of optical alignment.',
      care: 'Clean gently using warm distilled water and an ultra-soft horsehair brush. Complimentary annual ultrasonic inspection at all boutiques.'
    },
    {
      id: 'HJ-002',
      name: 'Empress Emerald & Diamond Cascade Collar',
      category: 'necklaces',
      collection: 'signature',
      tag: 'High Jewellery',
      priceUSD: 38200,
      image: 'images/jewelux_hero_necklace.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_hero_necklace.jpg',
        'images/jewelux_editorial_hero.jpg',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K White Gold & Solid Platinum',
      stone: '12.40 ctw Muzo Colombian Emeralds & F-VS1 Diamonds',
      cut: 'Emerald Cut & Marquise Cluster',
      clarity: 'VVS1 Natural Untreated Green',
      certificate: 'SSEF Swiss Gemmological Report #10928',
      description: 'A breathtaking high-jewellery statement collar boasting vivid green Colombian emeralds from the historic Muzo mines, framed by cascading marquise and brilliant round diamonds in articulated platinum bezels.',
      badge: 'Haute Joaillerie',
      isNew: true,
      isBestSeller: true,
      sizes: ['Choker (38 cm)', 'Princess (42 cm)', 'Bespoke Length by Atelier'],
      specs: {
        dimensions: 'Neckline Drop: 42 mm; Total Length: 410 mm',
        grossWeight: '46.2 grams 18K Fairmined White Gold',
        purity: '750/1000 Pure Gold',
        accentGems: '14.80 ctw D-E Color Marquise & Brilliant Diamonds'
      },
      craftsmanship: '180 hours of hand-piercing and microscopic setting by master goldsmiths in Milan and Geneva.',
      care: 'Do not expose natural emeralds to ultrasonic cleaners or steam. Wipe with microfiber cloth and store in Jewelux suede case.'
    },
    {
      id: 'HJ-003',
      name: 'Padmavati Antique Temple Choker Parure',
      category: 'temple',
      collection: 'temple',
      tag: 'Sacred Heritage',
      priceUSD: 26500,
      image: 'images/jewelux_temple_heritage.jpg',
      hoverImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'images/jewelux_temple_heritage.jpg',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
        'images/jewelux_atelier_craft.jpg'
      ],
      metal: '22K Solid Antique Champagne-Toned Gold',
      stone: 'Natural Basra Pearls, Uncut Polki Diamonds & Burmese Rubies',
      cut: 'Traditional Polki & Cabochon Ruby',
      clarity: 'Natural Untreated Royal Red',
      certificate: 'IGI Heritage Jewellery Certificate #99281',
      description: 'A sovereign heirloom honoring centuries of South Indian temple nakshi artistry. Featuring hand-embossed divine motifs, suspended Basra seed pearls, and unheated pigeon-blood rubies set in 22-karat warm matte gold.',
      badge: 'Heritage Masterpiece',
      isNew: true,
      isBestSeller: false,
      sizes: ['Adjustable Handcrafted Dori (Silk Cord)', 'Solid 22K Gold Link Extension'],
      specs: {
        dimensions: 'Central Pendant: 62 x 48 mm; Necklace Width: 28 mm',
        grossWeight: '88.5 grams 22K Gold',
        purity: '916/1000 Pure Gold (Hallmarked)',
        accentGems: '4.50 ctw Uncut Polki Diamonds + 18.2 ct Natural Basra Pearls'
      },
      craftsmanship: 'Hand-chased by generational nakshi artisans in Tamil Nadu and refined with Italian clasp ergonomics in Milan.',
      care: 'Preserve antique patina by avoiding direct perfume or moisture. Store flat in bespoke Jewelux velvet casket.'
    },
    {
      id: 'HJ-004',
      name: 'Aura Pavé Diamond Tennis Bracelet',
      category: 'bracelets',
      collection: 'everyday-icons',
      tag: 'Signature Everyday',
      priceUSD: 8900,
      image: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K Warm Champagne Gold',
      stone: '5.50 ctw E-F VS1 Lab-Certified Natural Diamonds',
      cut: 'Brilliant Round Four-Prong',
      clarity: 'VS1 Eye-Clean',
      certificate: 'House of Jewelux Authenticity Certificate',
      description: 'The quintessential luxury essential. Engineered with a double safety catch and fluid articulated links that drape effortlessly over the wrist like molten golden silk.',
      badge: 'Best Seller',
      isNew: false,
      isBestSeller: true,
      sizes: ['6.5 Inches (Small)', '7.0 Inches (Standard)', '7.5 Inches (Comfort)', 'Custom Link Adjustment'],
      specs: {
        dimensions: 'Width: 3.2 mm; Individual Stone Size: 2.7 mm',
        grossWeight: '14.2 grams 18K Gold',
        purity: '750/1000 Fine Champagne Gold',
        accentGems: '54 Individually Calibrated Round Diamonds'
      },
      craftsmanship: 'Precision micro-drilled links providing 360-degree flexibility without catching on fine silk fabrics.',
      care: 'Safe for warm ultrasonic bath. Rinse thoroughly and dry with non-abrasive chamois cloth.'
    },
    {
      id: 'HJ-005',
      name: 'The Celeste Pear Diamond Drops',
      category: 'earrings',
      collection: 'eternal',
      tag: 'Bridal Splendor',
      priceUSD: 16400,
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: 'Platinum 950 & 18K White Gold',
      stone: '4.60 ctw D-E Color Matched Pear Diamonds',
      cut: 'Artisan Pear Brilliant',
      clarity: 'VVS2 High Dispersion',
      certificate: 'GIA Dual Dossier #5521948',
      description: 'Graceful articulated earrings featuring twin matched pear-shaped diamonds that catch and reflect candlelight with every subtle movement, framing the countenance with timeless luminescence.',
      badge: 'Bridal Selection',
      isNew: true,
      isBestSeller: true,
      sizes: ['Comfort Screw-Back', 'French Clip & Post (Salon Standard)'],
      specs: {
        dimensions: 'Drop Length: 36 mm; Pear Stone: 8.8 x 5.6 mm each',
        grossWeight: '7.6 grams Platinum 950',
        purity: '950/1000 Pure Platinum',
        accentGems: '0.80 ctw Brilliant Cut Halo Accent Diamonds'
      },
      craftsmanship: 'Hand-matched pair taking over 6 months to gemologically curate for color, proportion, and optic symmetry.',
      care: 'Polish prongs gently after wear. Store separately in dedicated earring compartments.'
    },
    {
      id: 'HJ-006',
      name: 'Sovereign Champagne Gold Royal Kada Bangle',
      category: 'bangles',
      collection: 'signature',
      tag: 'Sculptural Gold',
      priceUSD: 11200,
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K Solid Champagne Gold',
      stone: '2.80 ctw Flush-Set Baguette & Brilliant Diamonds',
      cut: 'Tapered Baguette & Pavé',
      clarity: 'VS1 Natural',
      certificate: 'House of Jewelux Gold Purity & Diamond Guarantee',
      description: 'An architectural oval bangle inspired by Didone classical proportions. Cast in solid 18K champagne gold with an invisible concealed hinge and double safety click clasp.',
      badge: 'New Arrival',
      isNew: true,
      isBestSeller: false,
      sizes: ['Size 2.4 (Small - 57.2mm)', 'Size 2.6 (Medium - 60.3mm)', 'Size 2.8 (Large - 63.5mm)'],
      specs: {
        dimensions: 'Band Thickness: 6.5 mm; Inner Profile: Comfort-Fit Oval',
        grossWeight: '32.4 grams Solid 18K Gold',
        purity: '750/1000 Fine Champagne Gold',
        accentGems: '36 Channel-Set Diamond Baguettes'
      },
      craftsmanship: 'Hand-honed satin finish with high-polish champagne beveled margins, crafted in Valenza, Italy.',
      care: 'Avoid wearing during strenuous exercise. Buff with jeweler polishing cloth.'
    },
    {
      id: 'HJ-007',
      name: 'L’Étoile Sterling Silver Pavé Collar',
      category: 'silver',
      collection: 'silver-edit',
      tag: 'The Silver Edit',
      priceUSD: 1850,
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '925 Sterling Silver with Heavy Platinum-Rhodium Finish',
      stone: 'Lab-Certified VVS Moissanite & Cultured Freshwater Pearls',
      cut: 'Ideal Cushion & Marquise Cluster',
      clarity: 'VVS1 Equivalent',
      certificate: 'Jewelux Fine Silver Hallmark Certificate',
      description: 'From The Silver Edit: An ethereal collar forged in 925 sterling silver, plated in liquid platinum-rhodium for an anti-tarnish mirror finish. Accented with luminescent pearls and moissanite stars.',
      badge: 'Silver Edit',
      isNew: true,
      isBestSeller: false,
      sizes: ['Standard 40 cm with 5 cm Extension Chain'],
      specs: {
        dimensions: 'Center Motif: 32 x 22 mm; Pearl Diameter: 7-8 mm',
        grossWeight: '24.8 grams 925 Silver',
        purity: '92.5% Pure Silver with 3-Micron Platinum Plating',
        accentGems: '3.80 ctw Lab VVS Moissanite'
      },
      craftsmanship: 'Hand-finished in Vicenza, Italy, featuring high-precision micro-prong setting.',
      care: 'Keep in airtight Jewelux anti-tarnish pouch when not worn. Do not spray fragrance directly.'
    },
    {
      id: 'HJ-008',
      name: 'Devi Meenakari Antique Kada Bangles (Pair)',
      category: 'temple',
      collection: 'temple',
      tag: 'Temple Artistry',
      priceUSD: 18900,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'images/jewelux_temple_heritage.jpg',
      gallery: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
        'images/jewelux_temple_heritage.jpg'
      ],
      metal: '22K Antique Hallmarked Gold',
      stone: 'Kundan Uncut Polki Diamonds, Emerald Meenakari & Cabochon Rubies',
      cut: 'Traditional Jadau Kundan',
      clarity: 'Natural Untreated Royal Gemstones',
      certificate: 'National Gemological Laboratory Certificate',
      description: 'A pair of handcrafted temple kada bangles adorned with delicate peacock and floral meenakari enameling on the inner rim, crowned with uncut polki diamonds in pure 24K gold foil jadau settings.',
      badge: 'Temple Heirloom',
      isNew: false,
      isBestSeller: true,
      sizes: ['Pair Size 2.4 (57.2 mm)', 'Pair Size 2.6 (60.3 mm)', 'Pair Size 2.8 (63.5 mm)'],
      specs: {
        dimensions: 'Width per bangle: 12 mm; Screw pin closure with safety chain',
        grossWeight: '94.6 grams (Combined Pair Weight)',
        purity: '22 Karat (91.6% Pure Gold)',
        accentGems: '6.20 ctw Uncut Polki Diamonds + 8.4 ct Natural Rubies'
      },
      craftsmanship: '6 weeks of artisan hand-carving and furnace enameling by master Jaipur and Madurai goldsmiths.',
      care: 'Clean with a soft dry cloth only. Never immerse meenakari or kundan in water.'
    },
    {
      id: 'HJ-009',
      name: 'Reine de Rubis Oval Halo Ring',
      category: 'rings',
      collection: 'heritage',
      tag: 'Collector Series',
      priceUSD: 29500,
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K Rose Gold & Platinum 950',
      stone: '5.10 ct Unheated Pigeon Blood Burmese Ruby',
      cut: 'Oval Brilliant Cut with Tapered Baguettes',
      clarity: 'Natural Vivid Red With Fiery Red Fluorescence',
      certificate: 'GRS Swiss Gem Research Report #GRS2025-081',
      description: 'An exceptionally rare Burmese ruby endowed with hypnotic crimson fluorescence, set between hand-calibrated diamond baguettes in a sculptural hand-beveled mount.',
      badge: 'Rare Collector Gem',
      isNew: false,
      isBestSeller: true,
      sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'Bespoke Atelier Fit'],
      specs: {
        dimensions: 'Center Ruby: 11.2 x 8.9 x 5.8 mm',
        grossWeight: '6.8 grams 18K Rose Gold + Platinum Claws',
        purity: '750/1000 Fine Gold + 950/1000 Platinum',
        accentGems: '1.40 ctw Tapered Diamond Baguettes (E/VVS)'
      },
      craftsmanship: 'Hand-faceted in Geneva to maximize ruby optical fire while ensuring absolute stone security.',
      care: 'Wash gently with warm soapy water and dry with micro-silk cloth.'
    },
    {
      id: 'HJ-010',
      name: 'L’Étoile Ceylon Sapphire & Diamond Choker',
      category: 'necklaces',
      collection: 'signature',
      tag: 'Rare Gemstone',
      priceUSD: 24800,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K Fairmined White Gold',
      stone: '7.85 ct Royal Blue Ceylon Sapphire',
      cut: 'Cushion Brilliant Cut',
      clarity: 'Eye-Clean Royal Blue Unheated',
      certificate: 'Gübelin Gem Lab Certified #240188',
      description: 'Centering a majestic unheated Royal Blue Ceylon sapphire cradled by an asymmetric constellation of pear-shaped brilliant diamonds, celebrating eternal celestial harmony.',
      badge: 'Rare Find',
      isNew: false,
      isBestSeller: false,
      sizes: ['38 cm with 4 cm Extension'],
      specs: {
        dimensions: 'Center Sapphire: 12.1 x 10.4 x 6.9 mm',
        grossWeight: '32.1 grams 18K White Gold',
        purity: '750/1000 Fine Gold',
        accentGems: '6.40 ctw Pear & Round Brilliant Diamonds'
      },
      craftsmanship: 'Artisan hand-prongs calibrated under 40x magnification for zero gemstone stress.',
      care: 'Sapphire is 9 on Mohs scale, durable for daily evening wear. Keep away from harsh chemicals.'
    },
    {
      id: 'HJ-011',
      name: 'Nocturne Diamond Lineage Cuff',
      category: 'bracelets',
      collection: 'heritage',
      tag: 'Sculptural Art',
      priceUSD: 21500,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K Blackened & White Gold',
      stone: '8.10 ctw Mixed Cut F-G Diamonds',
      cut: 'Baguette & Brilliant Geometric Pavé',
      clarity: 'VS1',
      certificate: 'Jewelux Haute Joaillerie Archive',
      description: 'Bold architectural lines inspired by Didone typographic contrast and Art Deco facades. Blackened gold prongs accentuate the blinding fire of precision-set diamond baguettes.',
      badge: 'Artisan Crafted',
      isNew: true,
      isBestSeller: false,
      sizes: ['Small (15 cm)', 'Medium (17 cm)', 'Large (19 cm)'],
      specs: {
        dimensions: 'Cuff Height: 22 mm; Open back with safety tension spring',
        grossWeight: '38.6 grams 18K Gold',
        purity: '750/1000 Fine Gold',
        accentGems: '112 Hand-Set Diamonds'
      },
      craftsmanship: 'Black ruthenium electro-accent on white gold claws, handcrafted in Milan atelier.',
      care: 'Store in soft velvet pouch to avoid scratch friction against other metals.'
    },
    {
      id: 'HJ-012',
      name: 'Solstice Golden Sunburst Pendant',
      category: 'necklaces',
      collection: 'everyday-icons',
      tag: 'Everyday Elegance',
      priceUSD: 4600,
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
      hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      gallery: [
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=85',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85'
      ],
      metal: '18K Warm Champagne Gold',
      stone: '1.20 ct Central Diamond + Sunburst Micro-pavé',
      cut: 'Round Brilliant Ideal Cut',
      clarity: 'VS1',
      certificate: 'GIA Certified #812903',
      description: 'A luminous celebration of eternal warmth and light. The sunburst fluted gold border magnifies the center diamond, suspended from an adjustable Italian wheat chain.',
      badge: 'New Arrival',
      isNew: true,
      isBestSeller: true,
      sizes: ['Adjustable 42 cm / 45 cm / 48 cm'],
      specs: {
        dimensions: 'Pendant Diameter: 18.5 mm; Chain Thickness: 1.1 mm',
        grossWeight: '8.2 grams 18K Gold',
        purity: '750/1000 Fine Gold',
        accentGems: '0.45 ctw Pavé Melee'
      },
      craftsmanship: 'Hand-fluted radial facets with mirror-bright Italian diamond burnishing.',
      care: 'Ideal for daily wear. Clean with mild soapy water and dry with cotton cloth.'
    }
  ],

  craftsmanshipSteps: [
    {
      step: '01',
      title: 'Rare Mineral Provenance',
      subtitle: 'Ethical Gemological Sourcing',
      desc: 'Our gemologists traverse the globe from Muzo, Colombia to Ratnapura, Sri Lanka to hand-select only the top 0.01% of natural, conflict-free rough stones.',
      image: 'images/jewelux_atelier_craft.jpg'
    },
    {
      step: '02',
      title: 'Atelier Gouache Renderings',
      subtitle: 'Didone Editorial Aesthetics',
      desc: 'Every jewel begins as a hand-painted gouache illustration on parchment, studying light dispersion, balance, and the sensual contours of feminine form.',
      image: 'images/jewelux_hero_necklace.jpg'
    },
    {
      step: '03',
      title: 'Fairmined Metallurgy',
      subtitle: '18K Champagne Gold & Platinum',
      desc: 'We smelt our proprietary champagne-gold alloy in-house, balancing copper, silver, and 75% pure gold to achieve our signature warm vanilla shimmer.',
      image: 'images/jewelux_solitaire_ring.jpg'
    },
    {
      step: '04',
      title: 'Generational Nakshi & Micro-Setting',
      subtitle: 'Indian Heritage Meets Milan Mastery',
      desc: 'Master artisans execute whisper-thin optical claw settings and intricate hand-chased nakshi motifs requiring up to 200 hours per creation.',
      image: 'images/jewelux_temple_heritage.jpg'
    },
    {
      step: '05',
      title: 'Mirror Hand-Burnishing',
      subtitle: 'The Eternal Glow',
      desc: 'Using traditional wooden lap wheels and diamond compound, the piece receives multiple stages of hand-buffing to eliminate micro-imperfections.',
      image: 'images/jewelux_editorial_hero.jpg'
    },
    {
      step: '06',
      title: 'Dual Swiss Certification',
      subtitle: 'GIA, Gübelin & SSEF Provenance',
      desc: 'Each creation is accompanied by independent dossiers certifying 4Cs authenticity, origin disclosure, and our lifetime warranty archive covenant.',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85'
    }
  ],

  faqs: [
    {
      q: 'Are all diamonds and gemstones at House of Jewelux ethically certified?',
      a: 'Yes, without exception. House of Jewelux strictly adheres to the Kimberley Process and the Responsible Jewellery Council (RJC) Code of Practices. Every center diamond is accompanied by an authentic GIA (Gemological Institute of America) dossier, and rare colored gemstones carry reports from Gübelin, SSEF, or GRS.'
    },
    {
      q: 'What is your bespoke commission timeline and process?',
      a: 'Bespoke commissions typically require 4 to 6 weeks from initial design consultation to final white-glove presentation. You will be paired with a Master Gemologist and goldsmith who will prepare gouache illustrations, 3D resin prototypes for fit inspection, and regular video updates from our Geneva or Milan atelier.'
    },
    {
      q: 'How does your complimentary insured global white-glove delivery work?',
      a: 'All orders over $10,000 USD (or local currency equivalent) receive complimentary armored white-glove courier transport (Malca-Amit or Brinks). Shipments are 100% insured until signed for in person with photographic ID verification.'
    },
    {
      q: 'Can I resize my ring or adjust necklace lengths after purchase?',
      a: 'We provide complimentary lifetime resizing (within 2 sizes) for all House of Jewelux solitaires and bands. Custom necklace and bracelet link adjustments can also be performed at any of our flagship salons or arranged via our courier concierge.'
    },
    {
      q: 'What is the signature House of Jewelux Champagne Gold?',
      a: 'Unlike harsh bright yellow gold, our proprietary 18K Champagne Gold is an Italian alloy blending fine gold, silver, and subtle rose undertones. It creates a soft, warm vanilla metallic finish that flatters every skin tone and echoes the warm editorial atmosphere of our brand.'
    },
    {
      q: 'What is your return and exchange policy for fine jewellery?',
      a: 'We offer a 30-day complimentary return or exchange period for all catalogue masterpieces in pristine, unworn condition with intact security tags and original certification. Bespoke custom commissions are non-refundable but include unlimited adjustments.'
    }
  ],

  bespokeOptions: {
    metals: [
      { id: 'yellow-gold', name: '18K Champagne Gold', color: '#D2B585', border: '#B6925B', basePrice: 2800 },
      { id: 'rose-gold', name: '18K Rose Gold', color: '#E8A798', border: '#D98978', basePrice: 2850 },
      { id: 'white-gold', name: '18K White Gold', color: '#E5E7EB', border: '#D1D5DB', basePrice: 2950 },
      { id: 'platinum', name: 'Platinum 950', color: '#F3F4F6', border: '#CBD5E1', basePrice: 3500 }
    ],
    gemstones: [
      { id: 'diamond', name: 'D-Flawless Diamond', hex: '#F0F9FF', sparkle: 'rgba(240, 249, 255, 0.95)', multiplier: 4.2 },
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
      title: 'The Italian Gala: Timeless Elegance',
      subtitle: 'Sculptural diamonds and champagne gold crafted for dramatic entrances.',
      image: 'images/jewelux_editorial_hero.jpg',
      featuredProduct: 'HJ-002',
      featuredProductTitle: 'Empress Emerald & Diamond Cascade'
    },
    {
      id: 'bridal',
      title: 'Eternal Vows: The Bridal Sanctuary',
      subtitle: 'Flawless solitaires and matching eternity bands blessed by hand-engraved inscriptions.',
      image: 'images/jewelux_solitaire_ring.jpg',
      featuredProduct: 'HJ-001',
      featuredProductTitle: 'The Sovereign Radiant Solitaire Ring'
    },
    {
      id: 'temple-chic',
      title: 'Sacred Heritage: The Temple Edit',
      subtitle: 'Generational Indian artisanal nakshi carvings harmonized with European modern minimalism.',
      image: 'images/jewelux_temple_heritage.jpg',
      featuredProduct: 'HJ-003',
      featuredProductTitle: 'Padmavati Antique Temple Choker Parure'
    }
  ],

  testimonials: [
    {
      quote: "House of Jewelux doesn't merely sell jewellery; they curate wearable sculptures that will be whispered about for generations. My bespoke bridal solitaire exceeded all imagination.",
      author: 'Contessa Beatrice R.',
      city: 'Milan & Geneva',
      piece: 'Bespoke 3.5ct Solitaire Ring',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    {
      quote: "The gemological knowledge and quiet discretion of their atelier team is unmatched. The Temple Collection choker is our family's proudest heirloom.",
      author: 'Devika & Alok Singhania',
      city: 'London & Mumbai',
      piece: 'Padmavati Temple Choker Parure',
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
    { city: 'Geneva Atelier', address: '12 Rue du Rhône, 1204 Genève, Switzerland', phone: '+41 22 819 9200', hours: 'Mon–Fri: 10:00 – 18:30 (Private Salon by Appointment)' },
    { city: 'Milan Montenapoleone', address: 'Via Monte Napoleone 8, 20121 Milano, Italy', phone: '+39 02 7600 4811', hours: 'Mon–Sat: 10:30 – 19:30' },
    { city: 'London Mayfair', address: '14 New Bond Street, Mayfair, London W1S 3PF', phone: '+44 20 7946 0912', hours: 'Mon–Sat: 10:00 – 18:30' },
    { city: 'Paris Place Vendôme', address: '22 Place Vendôme, 75001 Paris, France', phone: '+33 1 42 68 55 00', hours: 'Mon–Sat: 10:30 – 19:00' },
    { city: 'New York Fifth Avenue', address: '742 Fifth Avenue, New York, NY 10019', phone: '+1 212 555 0199', hours: 'Mon–Sat: 10:00 – 19:00' },
    { city: 'Dubai Fashion Avenue', address: 'The Fashion Avenue, The Dubai Mall, Level 1', phone: '+971 4 362 7500', hours: 'Daily: 10:00 – 23:00' }
  ]
};

if (typeof window !== 'undefined') {
  window.JEWELUX_DATA = JEWELUX_DATA;
}
