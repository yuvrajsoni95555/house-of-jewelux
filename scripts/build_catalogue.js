const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scratchDataFile = 'C:/Users/yuvra/.gemini/antigravity/scratch/house-of-jewelux/data.js';
const code = fs.readFileSync(scratchDataFile, 'utf8');
const jeweluxData = vm.runInThisContext(code + '; JEWELUX_DATA');

// Exact INR price mapping from brand audit
const inrPriceMap = {
  // Rings
  "HJ-RNG-001": 15448, // The Celestial Radiance 925 Solitaire Ring
  "HJ-RNG-002": 20040, // The Amore Eternity Couple Bands (Pair)
  "HJ-RNG-003": 18370, // The Empress Emerald-Cut Halo Ring
  "HJ-RNG-004": 48430, // The Royal Marquise Diamond Pavilion Ring
  "HJ-RNG-005": 13778, // The Verona Pavé Crisscross Band
  "HJ-RNG-006": 16283, // The Luminary Oval Solitaire in 925 Silver
  "HJ-RNG-007": 14613, // The Sovereign Signet Promise Band
  "HJ-RNG-008": 17535, // The Florence Pear Teardrop Solitaire
  "HJ-RNG-009": 12525, // The Eternal Vow Dual Contour Band
  "HJ-RNG-010": 19205, // The Starlight Triple Pavé Eternity Ring

  // Earrings
  "HJ-EAR-001": 14613, // The Lumina Teardrop Solitaire Earrings
  "HJ-EAR-002": 11690, // The Milanese Pavé Huggie Hoops
  "HJ-EAR-003": 24215, // The Cascade Chandelier Diamond Drops
  "HJ-EAR-004": 31730, // The Royal Colombian Emerald Halo Studs
  "HJ-EAR-005": 10855, // The Starlight 4-Claw Solitaire Studs
  "HJ-EAR-006": 12943, // The Roman Arc Architectural Ear Cuffs
  "HJ-EAR-007": 22963, // The Bellini South Sea Pearl Drops
  "HJ-EAR-008": 16283, // The Celestial Starburst Pavé Drops
  "HJ-EAR-009": 18370, // The Deco Geometric Baguette Dangles
  "HJ-EAR-010": 25885, // The Sovereign Bridal Jhumka Drops

  // Bracelets
  "HJ-BRC-001": 21710, // The Riviera 4mm Tennis Bracelet
  "HJ-BRC-002": 17535, // The Milanese Sculpted Torque Cuff
  "HJ-BRC-003": 28390, // The Royal Baguette Bar Link Bracelet
  "HJ-BRC-004": 15865, // The Eternal Knot Bridal Charm Bracelet
  "HJ-BRC-005": 12108, // The Pavé Diamond Station Cable Chain
  "HJ-BRC-006": 24633, // The Intricate Mesh Ribbon Silver Bracelet
  "HJ-BRC-007": 14613, // The Emerald Solitaire Station Chain Bracelet
  "HJ-BRC-008": 22545, // The Dual Contour Couple Cuff (His & Hers)
  "HJ-BRC-009": 13360, // The Sovereign Herringbone Liquid Metal Ribbon
  "HJ-BRC-010": 18788, // The Celestial Orbit Double Wrap Pavé Bracelet

  // Necklaces
  "HJ-NCK-001": 23380, // The Luna Pavé Halo Bridal Mangalsutra
  "HJ-NCK-002": 104375, // The Empress Emerald & Diamond Regal Choker
  "HJ-NCK-003": 13778, // The Solitaire Floating Illusion Pendant
  "HJ-NCK-004": 37575, // The Sacred Heritage Temple Locket Necklace
  "HJ-NCK-005": 43420, // The Riviera Diamond Tennis Collar
  "HJ-NCK-006": 16283, // The Artisanal Lariat Y-Drop Pavé Chain
  "HJ-NCK-007": 12525, // The Celestial Star Constellation Pendant
  "HJ-NCK-008": 32983, // The Royal Sapphire Halo Duchess Necklace
  "HJ-NCK-009": 14195, // The Sovereign Bar Monogram Medallion
  "HJ-NCK-010": 26720, // The Florence Baroque Pearl & Gold Link Collar

  // Brooches & Pins
  "HJ-BRH-001": 24215, // The Sovereign Crest Royal Falcon Brooch
  "HJ-BRH-002": 17535, // The Royal Fleur Diamond Lapel Pin
  "HJ-BRH-003": 15448, // The Celestial Crescent Moon & Star Brooch
  "HJ-BRH-004": 30060, // The Royal Peacock Feather Emerald Brooch
  "HJ-BRH-005": 20040, // The Art Deco Geometric Sunburst Brooch
  "HJ-BRH-006": 16283, // The Bridal Ribbon Corsage Brooch Pin
  "HJ-BRH-007": 19205, // The Golden Palm Leaf Statement Pin
  "HJ-BRH-008": 22128, // The Dragonfly Luminary Pavé Brooch
  "HJ-BRH-009": 25885, // The Monarch Butterfly Basra Pearl Brooch
  "HJ-BRH-010": 14613  // The Minimalist Architectural Gold Quill Pin
};

// Studio & lifestyle imagery curated for fine luxury aesthetics
const categoryImageCurations = {
  earrings: [
    {
      main: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85",
      hover: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=85"
      ]
    },
    {
      main: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=85",
      hover: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=85"
      ]
    }
  ],
  rings: [
    {
      main: "images/authentic_solitaire_ring.jpg",
      hover: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85",
      gallery: [
        "images/authentic_solitaire_ring.jpg",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85"
      ]
    },
    {
      main: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85",
      hover: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85",
        "images/authentic_solitaire_ring.jpg"
      ]
    }
  ],
  bracelets: [
    {
      main: "https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=800&q=85",
      hover: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85"
      ]
    }
  ],
  necklaces: [
    {
      main: "images/authentic_necklace_hero.jpg",
      hover: "images/authentic_temple_heritage.jpg",
      gallery: [
        "images/authentic_necklace_hero.jpg",
        "images/authentic_temple_heritage.jpg",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85"
      ]
    },
    {
      main: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85",
      hover: "images/authentic_necklace_hero.jpg",
      gallery: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85",
        "images/authentic_necklace_hero.jpg",
        "images/user_flagship_hero_model.jpg"
      ]
    }
  ],
  brooches: [
    {
      main: "images/user_falcon_brooch_white.jpg",
      hover: "images/authentic_brooch_antique.jpg",
      gallery: [
        "images/user_falcon_brooch_white.jpg",
        "images/authentic_brooch_antique.jpg",
        "images/authentic_atelier_craft.jpg"
      ]
    }
  ]
};

const enrichedProducts = jeweluxData.products.map((p, idx) => {
  const inrPrice = inrPriceMap[p.id] || (p.priceUSD ? Math.round(p.priceUSD * 83.5) : 14990);
  const compareAtPrice = Math.round(inrPrice * 1.35 / 100) * 100 - 1; // e.g. 35% higher MRP
  const discountPercent = Math.round((1 - (inrPrice / compareAtPrice)) * 100);
  
  // Assign curated high-res studio & hover imagery
  const catCurations = categoryImageCurations[p.category] || categoryImageCurations.earrings;
  const curation = catCurations[idx % catCurations.length];
  
  const mainImage = (p.image && !p.image.includes('images.unsplash.com/photo-1599643477877')) 
    ? p.image 
    : curation.main;
  const hoverImage = (p.hoverImage && !p.hoverImage.includes('images.unsplash.com/photo-1599643477877'))
    ? p.hoverImage
    : curation.hover;
  const gallery = curation.gallery;

  return {
    id: p.id,
    handle: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + p.id.toLowerCase(),
    name: p.name,
    category: p.category,
    collection: p.collection || 'signature-collection',
    price: inrPrice,
    compareAtPrice: compareAtPrice,
    discountPercent: discountPercent,
    rating: (4.7 + ((idx % 4) * 0.1)).toFixed(1),
    reviewsCount: 38 + (idx * 7) % 180,
    badge: p.badge || (idx % 3 === 0 ? "Bestseller" : (idx % 2 === 0 ? "Trending" : "New")),
    tag: p.tag || "BIS 925 Hallmarked",
    image: mainImage,
    hoverImage: hoverImage,
    gallery: gallery,
    metal: p.metal || "BIS Hallmarked 925 Sterling Silver (Anti-Tarnish Rhodium Finish)",
    stone: p.stone || "Certified Lab Moissanite / Diamond Accents",
    purity: p.purity || "Stamped 925 Hallmarked",
    cut: p.cut || "Hearts & Arrows Ideal Brilliant",
    clarity: p.clarity || "VVS1 Specialist Certified",
    dimensions: p.dimensions || "Handcrafted standard proportions",
    certificate: "BIS Hallmarked 925 Silver • Specialist Gemological Inspection Card",
    description: p.description || `${p.name} is meticulously handcrafted in solid 925 sterling silver with a protective liquid rhodium and 18K micron gold finish. Built for enduring elegance and lifetime luster.`,
    isSilver: p.isSilver !== false,
    isGold: p.isGold || false,
    isNew: p.isNew || (idx % 4 === 0),
    stockStatus: p.stockStatus || "In Stock",
    sku: p.id,
    weight: `${(3.5 + (idx % 7) * 1.8).toFixed(1)}g`,
    specifications: [
      { label: "Base Metal", value: "Solid 925 Sterling Silver" },
      { label: "Plating", value: "Liquid Rhodium & 18K Micron Gold" },
      { label: "Hallmark", value: "BIS 925 Hallmarked & Stamped" },
      { label: "Stone Type", value: p.stone || "Certified Lab-Grown Moissanite" },
      { label: "Hypoallergenic", value: "100% Nickel-Free & Lead-Free" },
      { label: "Water Resistance", value: "Water-Safe & Anti-Tarnish Coating" },
      { label: "Origin", value: "Designed & Handcrafted in Jaipur, India" }
    ]
  };
});

fs.mkdirSync('C:/houseofjewelux/data', { recursive: true });

fs.writeFileSync(
  'C:/houseofjewelux/data/products.json',
  JSON.stringify(enrichedProducts, null, 2),
  'utf8'
);

fs.writeFileSync(
  'C:/houseofjewelux/data/storeConfig.json',
  JSON.stringify(jeweluxData.storeConfig, null, 2),
  'utf8'
);

fs.writeFileSync(
  'C:/houseofjewelux/data/coupons.json',
  JSON.stringify(jeweluxData.coupons, null, 2),
  'utf8'
);

console.log(`Successfully generated data/products.json with ${enrichedProducts.length} enriched products.`);
