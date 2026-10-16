/**
 * NovaStore — Mock Data & Local State Store
 * Realistic product catalog across Electronics, Accessories, Home, and Lifestyle
 */

(function (window) {
  'use strict';

  const INITIAL_PRODUCTS = [
    {
      id: 1,
      name: "Nova Pro ANC Wireless Headphones",
      description: "Engineered with 40mm beryllium drivers and hybrid active noise cancellation. Features transparency mode, 38-hour battery endurance, and plush memory foam ear cushions for studio-grade acoustic clarity.",
      price: 279.00,
      category: "Electronics",
      imageUrl: "assets/images/headphones.jpg",
      stock: 24,
      rating: 4.9,
      featured: true,
      specs: {
        "Acoustic Driver": "40mm custom beryllium dynamic",
        "Battery Life": "Up to 38 hours (ANC enabled)",
        "Connectivity": "Bluetooth 5.3 + 3.5mm low-latency cable",
        "Weight": "248g",
        "Charging": "USB-C quick charge (15 mins = 5 hrs)"
      }
    },
    {
      id: 2,
      name: "Nova Studio Smart Desk Speaker",
      description: "Minimalist Scandinavian cylindrical speaker with high-density acoustic mesh, tuned dual passive radiators, and spatial room calibration. Supports Wi-Fi AirPlay 2, Spotify Connect, and Bluetooth audio.",
      price: 189.00,
      category: "Electronics",
      imageUrl: "assets/images/speaker.jpg",
      stock: 18,
      rating: 4.8,
      featured: true,
      specs: {
        "Frequency Response": "45Hz - 22,000Hz",
        "Amplification": "Class-D 60W bi-amplified",
        "Wireless": "Wi-Fi 6 (2.4/5GHz) & Bluetooth 5.2",
        "Materials": "Textured Kvadrat acoustic textile, spun aluminum",
        "Dimensions": "140mm dia × 210mm height"
      }
    },
    {
      id: 3,
      name: "Nova Tactile 75% Mechanical Keyboard",
      description: "Compact 75% layout precision keyboard with factory-lubed linear switches, solid CNC-milled aluminum chassis, sound-dampening silicone gasket mount, and south-facing warm white LED backlighting.",
      price: 139.00,
      category: "Accessories",
      imageUrl: "assets/images/keyboard.jpg",
      stock: 35,
      rating: 4.9,
      featured: true,
      specs: {
        "Key Switches": "Hot-swappable Nova Jade Tactile (55g actuation)",
        "Keycaps": "Doubleshot PBT cherry profile",
        "Polling Rate": "1000Hz wired / 2.4GHz wireless",
        "Battery": "4000mAh rechargeable (200 hrs backlight off)",
        "Chassis": "Anodized 6063 aluminum"
      }
    },
    {
      id: 4,
      name: "Nova Hydro Pure Insulated Bottle (750ml)",
      description: "Double-wall vacuum insulated 18/8 food-grade stainless steel bottle with natural bamboo cap. Keeps liquids cold for 24 hours or piping hot for 12 hours. Sweat-proof powder coat finish.",
      price: 38.00,
      category: "Lifestyle",
      imageUrl: "assets/images/bottle.jpg",
      stock: 60,
      rating: 4.7,
      featured: true,
      specs: {
        "Capacity": "750 ml (25.4 oz)",
        "Thermal Retention": "24h cold / 12h hot",
        "Material": "18/8 pro-grade stainless steel & FSC bamboo",
        "Lid": "Leakproof silicone sealed sports flip",
        "Care": "BPA-free, dishwasher safe body"
      }
    },
    {
      id: 5,
      name: "Nova UltraWide Solid Oak Monitor Stand",
      description: "Crafted from sustainable European solid oak with matte dark steel risers. Elevates your display to natural ergonomic eye level while storing full-sized keyboards and docking hubs underneath.",
      price: 119.00,
      category: "Home",
      imageUrl: "assets/images/monitor_stand.svg",
      stock: 15,
      rating: 4.8,
      featured: false,
      specs: {
        "Material": "Solid FSC certified European Oak & steel",
        "Dimensions": "1050mm W × 230mm D × 110mm H",
        "Weight Capacity": "Supports up to 45 kg (100 lbs)",
        "Clearance Height": "85mm underside space for peripherals",
        "Finish": "Matte low-VOC protective natural oil"
      }
    },
    {
      id: 6,
      name: "Nova Precision Ergonomic Wireless Mouse",
      description: "Designed with a natural 57-degree vertical handshake angle to relieve wrist strain. Features high-precision 8000 DPI optical tracking on glass surfaces and silent magnetic hyper-fast scroll wheel.",
      price: 89.00,
      category: "Accessories",
      imageUrl: "assets/images/ergonomic_mouse.svg",
      stock: 42,
      rating: 4.6,
      featured: false,
      specs: {
        "Sensor": "Darkfield 8000 DPI optical sensor",
        "Hand Angle": "57° vertical ergonomic incline",
        "Scroll Wheel": "MagSpeed electromagnetic scroll with smart shift",
        "Multi-Device": "Pair up to 3 computers with instant toggle",
        "Battery": "USB-C quick charge (70 days per charge)"
      }
    },
    {
      id: 7,
      name: "Nova Beam Ambient LED Desk Light Bar",
      description: "Screenbar monitor lamp with asymmetric optical design that casts illumination solely onto your desk without glare or reflections on screens. Includes wireless rotary desktop dial for brightness and hue.",
      price: 69.00,
      category: "Home",
      imageUrl: "assets/images/light_bar.svg",
      stock: 28,
      rating: 4.8,
      featured: false,
      specs: {
        "Color Temp": "2700K (warm) to 6500K (cool white)",
        "Color Rendering": "Ra95 high CRI natural reproduction",
        "Controls": "2.4GHz wireless dial controller",
        "Power": "USB powered (5V 1.5A)",
        "Mount": "Weighted counter-pivot clamp fits 1-32mm bezels"
      }
    },
    {
      id: 8,
      name: "Nova MagCharge 3-in-1 Aluminum Stand",
      description: "Charges your phone, wireless earbuds, and smartwatch concurrently via 15W high-speed magnetic alignment. Solid weighted CNC aluminum construction prevents tipping when lifting devices.",
      price: 79.00,
      category: "Accessories",
      imageUrl: "assets/images/charging_stand.svg",
      stock: 50,
      rating: 4.7,
      featured: false,
      specs: {
        "Output": "15W Phone + 5W Watch + 5W Earbud tray",
        "Standard": "Qi2 & MagSafe certified",
        "Material": "Space gray anodized aerospace aluminum",
        "Power Adapter": "Included 30W USB-C GaN wall brick",
        "Safety": "Foreign object detection & thermal throttling"
      }
    },
    {
      id: 9,
      name: "Nova Core Merino Wool Desk Mat",
      description: "Premium high-density non-fraying German merino wool felt with natural cork base. Provides exceptional dampening for mechanical keyboards, smooth mouse glide, and cozy thermal desktop insulation.",
      price: 49.00,
      category: "Home",
      imageUrl: "assets/images/desk_mat.svg",
      stock: 32,
      rating: 4.9,
      featured: false,
      specs: {
        "Material": "100% genuine merino wool felt + natural cork",
        "Dimensions": "900mm × 400mm × 4mm thickness",
        "Antistatic": "Naturally static-resistant & water-repellent",
        "Edge Finish": "Laser-cut anti-fray sealed perimeter",
        "Maintenance": "Spot clean with damp microfiber cloth"
      }
    },
    {
      id: 10,
      name: "Nova Peak Travel Daypack (20L)",
      description: "Weatherproof recycled Cordura ballistic nylon daypack with magnetic Fidlock clasps, clamshell opening, padded 16-inch laptop chamber, and hidden passport security pocket.",
      price: 145.00,
      category: "Lifestyle",
      imageUrl: "assets/images/travel_daypack.svg",
      stock: 20,
      rating: 4.8,
      featured: false,
      specs: {
        "Volume": "20 Liters (airline carry-on compliant)",
        "Shell": "840D recycled ballistic nylon with DWR finish",
        "Laptop Sleeve": "Suspended false bottom fits up to 16\" MacBook",
        "Hardware": "YKK AquaGuard zippers, German Fidlock magnets",
        "Weight": "1.05 kg"
      }
    },
    {
      id: 11,
      name: "Nova Pulse ANC Wireless Earbuds",
      description: "Pebble-shaped active noise canceling earbuds with custom 11mm titanium drivers, IPX5 sweat resistance, low-latency gaming mode, and 30-hour playback with the wireless charging case.",
      price: 159.00,
      category: "Electronics",
      imageUrl: "assets/images/earbuds.svg",
      stock: 25,
      rating: 4.7,
      featured: false,
      specs: {
        "Noise Cancellation": "Up to 42dB adaptive active cancellation",
        "Codecs": "LDAC, AAC, SBC high-resolution audio",
        "Microphones": "6-mic array with AI wind-noise suppression",
        "Water Resistance": "IPX5 water & sweat resistant",
        "Case": "Qi wireless charging & USB-C compatible"
      }
    },
    {
      id: 12,
      name: "Nova Ceramic Pour-Over Coffee Dripper Set",
      description: "Handcrafted matte ceramic conical dripper paired with heat-resistant borosilicate glass carafe and acacia wood collar. Optimized interior spiral ribs ensure even extraction for clean, aromatic coffee.",
      price: 54.00,
      category: "Lifestyle",
      imageUrl: "assets/images/coffee_set.svg",
      stock: 14,
      rating: 4.9,
      featured: false,
      specs: {
        "Capacity": "Carafe 600ml (2-4 cups)",
        "Materials": "High-fire stoneware ceramic, borosilicate glass",
        "Filters": "Compatible with standard #02 conical paper filters",
        "Heat Resistance": "Thermal shock resistant up to 150°C",
        "Origin": "Artisanal small-batch craft"
      }
    }
  ];

  /**
   * Reads current active products list (custom edits or initial)
   * @returns {Array<typeof INITIAL_PRODUCTS[0]>}
   */
  function getProducts() {
    try {
      const custom = localStorage.getItem(window.NovaConfig.STORAGE_KEYS.PRODUCTS);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[NovaStore MockData] Error reading custom products from localStorage:', e);
    }
    return INITIAL_PRODUCTS.map(p => ({ ...p }));
  }

  /**
   * Find product by numerical ID
   * @param {number|string} id 
   */
  function getProductById(id) {
    const numId = parseInt(id, 10);
    const products = getProducts();
    return products.find(p => p.id === numId) || null;
  }

  /**
   * Persists product list (for demo admin CRUD)
   * @param {Array} products 
   */
  function saveProductsList(products) {
    localStorage.setItem(window.NovaConfig.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('novastore:productsUpdated'));
  }

  /**
   * Add or update product in mock storage
   * @param {object} product 
   */
  function saveProduct(product) {
    const products = getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = { ...products[existingIndex], ...product };
    } else {
      const nextId = products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      products.push({ ...product, id: nextId });
    }
    saveProductsList(products);
    return product;
  }

  /**
   * Delete product by ID in mock storage
   * @param {number|string} id 
   */
  function deleteProduct(id) {
    const numId = parseInt(id, 10);
    const products = getProducts().filter(p => p.id !== numId);
    saveProductsList(products);
    return true;
  }

  /**
   * Reset mock data to factory state
   */
  function resetToFactoryData() {
    localStorage.removeItem(window.NovaConfig.STORAGE_KEYS.PRODUCTS);
    window.dispatchEvent(new CustomEvent('novastore:productsUpdated'));
    return INITIAL_PRODUCTS.map(p => ({ ...p }));
  }

  // Expose on global namespace
  window.NovaMockData = {
    INITIAL_PRODUCTS,
    getProducts,
    getProductById,
    saveProduct,
    deleteProduct,
    resetToFactoryData,
  };
})(window);
