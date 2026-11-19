/**
 * HOUSE OF JEWELUX — Product & Category Controller
 * Handles catalog browsing, multi-criteria filtering, and category lookups.
 */

const { readJSON } = require('../db/jsonDb');

const getProducts = (req, res, next) => {
  try {
    const products = readJSON('products.json');
    let result = [...products];

    const { category, collection, material, search, metal, sort, min_price, max_price } = req.query;

    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      result = result.filter(p => (p.category && p.category.toLowerCase() === cat) || (p.productType && p.productType.toLowerCase() === cat));
    }

    if (collection && collection !== 'all') {
      const col = collection.toLowerCase();
      result = result.filter(p => 
        (p.collection && p.collection.toLowerCase() === col) || 
        (Array.isArray(p.collections) && p.collections.map(c => c.toLowerCase()).includes(col))
      );
    }

    if (material && material !== 'all') {
      const mat = material.toLowerCase();
      result = result.filter(p => 
        (Array.isArray(p.materials) && p.materials.map(m => m.toLowerCase()).includes(mat)) || 
        (p.primaryMaterial && p.primaryMaterial.toLowerCase() === mat) ||
        (p.metal && p.metal.toLowerCase().includes(mat)) ||
        (mat === 'diamond' && p.stone && p.stone.toLowerCase().includes('diamond')) ||
        (mat === 'gold' && (p.isGold || (p.metal && p.metal.toLowerCase().includes('gold'))))
      );
    }

    if (metal) {
      result = result.filter(p => (p.metal || '').toLowerCase().includes(metal.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        (p.description || '').toLowerCase().includes(q) ||
        (p.stone || '').toLowerCase().includes(q)
      );
    }

    if (min_price) {
      result = result.filter(p => p.price >= Number(min_price));
    }
    if (max_price) {
      result = result.filter(p => p.price <= Number(max_price));
    }

    // Sorting
    if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sort === 'newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    res.json({ success: true, count: result.length, total: result.length, products: result });
  } catch (err) {
    next(err);
  }
};

const getProductByIdentifier = (req, res, next) => {
  try {
    const products = readJSON('products.json');
    const idOrHandle = req.params.identifier.toLowerCase();
    const product = products.find(p => 
      p.id.toLowerCase() === idOrHandle || 
      p.handle.toLowerCase() === idOrHandle
    );

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const related = products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    res.json({ success: true, product, related });
  } catch (err) {
    next(err);
  }
};

const getCategories = (req, res, next) => {
  try {
    const categories = readJSON('categories.json');
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductByIdentifier,
  getCategories
};
