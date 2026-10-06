//------------------------------------------------------------
// Populates the database with realistic synthetic demo data.
// Usage: npm run seed
//
// WARNING:
// This script clears existing demo data.
// Use only with a development/demo database.

const { pool } = require('../config/db');

// ---------------------------------------------------------
// DATA SETS
// ---------------------------------------------------------

const FIRST_NAMES = [
  'James',
  'Olivia',
  'William',
  'Emma',
  'Benjamin',
  'Sophia',
  'Henry',
  'Isabella',
  'Lucas',
  'Mia',
  'Alexander',
  'Charlotte',
  'Daniel',
  'Amelia',
  'Michael',
  'Harper',
  'Ethan',
  'Evelyn',
  'Matthew',
  'Abigail',
  'David',
  'Emily',
  'Joseph',
  'Ella',
  'Samuel',
  'Elizabeth',
  'Jackson',
  'Sofia',
  'Sebastian',
  'Avery',
];

const LAST_NAMES = [
  'Anderson',
  'Bennett',
  'Carter',
  'Collins',
  'Cooper',
  'Davis',
  'Edwards',
  'Foster',
  'Garcia',
  'Graham',
  'Harris',
  'Harrison',
  'Hayes',
  'Henderson',
  'Johnson',
  'Kelly',
  'King',
  'Lewis',
  'Martin',
  'Mitchell',
  'Morgan',
  'Nelson',
  'Parker',
  'Peterson',
  'Phillips',
  'Roberts',
  'Scott',
  'Smith',
  'Taylor',
  'Thompson',
  'Turner',
  'Walker',
  'Watson',
  'White',
  'Williams',
  'Wilson',
  'Wright',
  'Young',
];

const PRODUCTS = [
  // -------------------------------------------------------
  // Electronics
  // -------------------------------------------------------

  {
    name: 'Wireless Noise-Cancelling Headphones',
    category: 'Electronics',
    priceMin: 89,
    priceMax: 249,
  },
  {
    name: 'Bluetooth Portable Speaker',
    category: 'Electronics',
    priceMin: 39,
    priceMax: 149,
  },
  {
    name: 'Mechanical Gaming Keyboard',
    category: 'Electronics',
    priceMin: 59,
    priceMax: 179,
  },
  {
    name: 'Wireless Gaming Mouse',
    category: 'Electronics',
    priceMin: 35,
    priceMax: 119,
  },
  {
    name: 'Smart LED Desk Lamp',
    category: 'Electronics',
    priceMin: 29,
    priceMax: 89,
  },
  {
    name: 'USB-C Fast Charging Hub',
    category: 'Electronics',
    priceMin: 29,
    priceMax: 99,
  },
  {
    name: 'Portable Power Bank 20000mAh',
    category: 'Electronics',
    priceMin: 35,
    priceMax: 89,
  },
  {
    name: '4K Streaming Webcam',
    category: 'Electronics',
    priceMin: 69,
    priceMax: 179,
  },

  // -------------------------------------------------------
  // Apparel
  // -------------------------------------------------------

  {
    name: 'Classic Cotton T-Shirt',
    category: 'Apparel',
    priceMin: 19,
    priceMax: 39,
  },
  {
    name: 'Premium Cotton Hoodie',
    category: 'Apparel',
    priceMin: 45,
    priceMax: 89,
  },
  {
    name: 'Slim Fit Denim Jeans',
    category: 'Apparel',
    priceMin: 49,
    priceMax: 109,
  },
  {
    name: 'Lightweight Casual Jacket',
    category: 'Apparel',
    priceMin: 69,
    priceMax: 149,
  },
  {
    name: 'Athletic Performance T-Shirt',
    category: 'Apparel',
    priceMin: 29,
    priceMax: 59,
  },
  {
    name: 'Everyday Running Shorts',
    category: 'Apparel',
    priceMin: 25,
    priceMax: 49,
  },
  {
    name: 'Classic Canvas Sneakers',
    category: 'Apparel',
    priceMin: 49,
    priceMax: 99,
  },
  {
    name: 'Leather Casual Belt',
    category: 'Apparel',
    priceMin: 29,
    priceMax: 69,
  },

  // -------------------------------------------------------
  // Home & Kitchen
  // -------------------------------------------------------

  {
    name: 'Stainless Steel Water Bottle',
    category: 'Home & Kitchen',
    priceMin: 22,
    priceMax: 49,
  },
  {
    name: 'Ceramic Coffee Mug Set',
    category: 'Home & Kitchen',
    priceMin: 24,
    priceMax: 59,
  },
  {
    name: 'Non-Stick Cookware Set',
    category: 'Home & Kitchen',
    priceMin: 89,
    priceMax: 199,
  },
  {
    name: 'Digital Kitchen Scale',
    category: 'Home & Kitchen',
    priceMin: 19,
    priceMax: 45,
  },
  {
    name: 'Electric Coffee Grinder',
    category: 'Home & Kitchen',
    priceMin: 39,
    priceMax: 99,
  },
  {
    name: 'Memory Foam Pillow',
    category: 'Home & Kitchen',
    priceMin: 29,
    priceMax: 69,
  },
  {
    name: 'Minimalist Table Clock',
    category: 'Home & Kitchen',
    priceMin: 25,
    priceMax: 65,
  },
  {
    name: 'Modern Storage Basket',
    category: 'Home & Kitchen',
    priceMin: 18,
    priceMax: 45,
  },

  // -------------------------------------------------------
  // Beauty
  // -------------------------------------------------------

  {
    name: 'Vitamin C Face Serum',
    category: 'Beauty',
    priceMin: 24,
    priceMax: 59,
  },
  {
    name: 'Hydrating Facial Moisturizer',
    category: 'Beauty',
    priceMin: 22,
    priceMax: 55,
  },
  {
    name: 'Daily Sunscreen SPF 50',
    category: 'Beauty',
    priceMin: 18,
    priceMax: 45,
  },
  {
    name: 'Gentle Facial Cleanser',
    category: 'Beauty',
    priceMin: 15,
    priceMax: 39,
  },
  {
    name: 'Argan Hair Repair Oil',
    category: 'Beauty',
    priceMin: 19,
    priceMax: 49,
  },
  {
    name: 'Nourishing Body Lotion',
    category: 'Beauty',
    priceMin: 17,
    priceMax: 39,
  },
  {
    name: 'Professional Makeup Brush Set',
    category: 'Beauty',
    priceMin: 29,
    priceMax: 79,
  },
  {
    name: 'Overnight Recovery Face Mask',
    category: 'Beauty',
    priceMin: 25,
    priceMax: 59,
  },

  // -------------------------------------------------------
  // Sports
  // -------------------------------------------------------

  {
    name: 'Premium Yoga Mat',
    category: 'Sports',
    priceMin: 29,
    priceMax: 69,
  },
  {
    name: 'Adjustable Dumbbell Set',
    category: 'Sports',
    priceMin: 99,
    priceMax: 249,
  },
  {
    name: 'Insulated Sports Bottle',
    category: 'Sports',
    priceMin: 24,
    priceMax: 49,
  },
  {
    name: 'Resistance Band Set',
    category: 'Sports',
    priceMin: 19,
    priceMax: 45,
  },
  {
    name: 'Running Waist Bag',
    category: 'Sports',
    priceMin: 18,
    priceMax: 39,
  },
  {
    name: 'Training Jump Rope',
    category: 'Sports',
    priceMin: 15,
    priceMax: 35,
  },
  {
    name: 'Fitness Tracking Watch',
    category: 'Sports',
    priceMin: 79,
    priceMax: 199,
  },
  {
    name: 'Lightweight Training Gloves',
    category: 'Sports',
    priceMin: 19,
    priceMax: 45,
  },
];

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
  return array[randBetween(0, array.length - 1)];
}

function randomPrice(min, max) {
  const price = Math.random() * (max - min) + min;
  return Number(price.toFixed(2));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function randomDateWithinDays(days) {
  const date = new Date();

  date.setDate(date.getDate() - randBetween(0, days));

  date.setHours(
    randBetween(8, 22),
    randBetween(0, 59),
    randBetween(0, 59),
    0
  );

  return date;
}

function generateSku(index) {
  const prefix = randomItem([
    'EL',
    'AP',
    'HK',
    'BT',
    'SP',
  ]);

  const number = randBetween(1000, 9999);

  return `${prefix}-${number}-${String(index).padStart(3, '0')}`;
}

function generateCustomerEmail(firstName, lastName, index) {
  const first = slugify(firstName);
  const last = slugify(lastName);

  const formats = [
    `${first}.${last}`,
    `${first}${last}`,
    `${first}.${last}${randBetween(10, 99)}`,
    `${first}${randBetween(10, 999)}.${last}`,
  ];

  const username = randomItem(formats);

  // example.com is intentionally used so these remain
  // synthetic demo addresses rather than real accounts.
  return `${username}${index}@example.com`;
}

// ---------------------------------------------------------
// SEED
// ---------------------------------------------------------

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('');
    console.log('Starting database seed...');
    console.log('');

    // -----------------------------------------------------
    // CLEAR EXISTING DEMO DATA
    // -----------------------------------------------------

    await client.query(`
      TRUNCATE
        inventory_alerts,
        order_items,
        orders,
        products,
        customers
      RESTART IDENTITY CASCADE
    `);

    console.log('Existing demo data cleared.');

    // -----------------------------------------------------
    // CUSTOMERS
    // -----------------------------------------------------

    const customers = [];
    const usedNames = new Set();

    for (let i = 1; i <= 30; i++) {
      let firstName;
      let lastName;
      let fullName;

      // Make sure customers don't have duplicate names.
      do {
        firstName = randomItem(FIRST_NAMES);
        lastName = randomItem(LAST_NAMES);
        fullName = `${firstName} ${lastName}`;
      } while (usedNames.has(fullName));

      usedNames.add(fullName);

      const email = generateCustomerEmail(
        firstName,
        lastName,
        i
      );

      const result = await client.query(
        `
        INSERT INTO customers (
          name,
          email
        )
        VALUES ($1, $2)
        RETURNING id
        `,
        [
          fullName,
          email,
        ]
      );

      customers.push({
        id: result.rows[0].id,
        name: fullName,
      });
    }

    console.log('Created 30 customers.');

    // -----------------------------------------------------
    // PRODUCTS
    // -----------------------------------------------------

    const products = [];

    for (let i = 0; i < PRODUCTS.length; i++) {
      const product = PRODUCTS[i];

      let stockQuantity;

      // Create a realistic mixture of inventory levels.
      const stockType = Math.random();

      if (stockType < 0.15) {
        // Low or out of stock.
        stockQuantity = randBetween(0, 12);
      } else if (stockType < 0.30) {
        // Medium stock.
        stockQuantity = randBetween(13, 35);
      } else {
        // Healthy stock.
        stockQuantity = randBetween(36, 150);
      }

      // const reorderLevel = randBetween(10, 20);
      const reorderLevel = 10;


      const price = randomPrice(
        product.priceMin,
        product.priceMax
      );

      const sku = generateSku(i + 1);

      const result = await client.query(
        `
        INSERT INTO products (
          name,
          sku,
          category,
          price,
          stock_quantity,
          reorder_level
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, price
        `,
        [
          product.name,
          sku,
          product.category,
          price,
          stockQuantity,
          reorderLevel,
        ]
      );

      products.push({
        id: result.rows[0].id,
        name: product.name,
        price: Number(result.rows[0].price),
      });
    }

    console.log(`Created ${products.length} products.`);

    // -----------------------------------------------------
    // ORDERS
    // -----------------------------------------------------

    const statuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];

    // Only 100 orders.
    const TOTAL_ORDERS = 100;

    for (let i = 0; i < TOTAL_ORDERS; i++) {
      const customer = randomItem(customers);

      const status = randomItem(statuses);

      // Spread orders across the last 90 days.
      const createdAt = randomDateWithinDays(90);

      // Create the order first so we get an order ID.
      const orderResult = await client.query(
        `
        INSERT INTO orders (
          customer_id,
          status,
          total_amount,
          created_at
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [
          customer.id,
          status,
          0,
          createdAt,
        ]
      );

      const orderId = orderResult.rows[0].id;

      // ---------------------------------------------------
      // ORDER ITEMS
      // ---------------------------------------------------

      const itemCount = randBetween(1, 4);

      let total = 0;

      // Prevent the same product from appearing twice
      // inside one order.
      const selectedProductIds = new Set();

      for (let j = 0; j < itemCount; j++) {
        let product;

        do {
          product = randomItem(products);
        } while (selectedProductIds.has(product.id));

        selectedProductIds.add(product.id);

        const quantity = randBetween(1, 3);

        const unitPrice = product.price;

        total += unitPrice * quantity;

        await client.query(
          `
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price
          )
          VALUES ($1, $2, $3, $4)
          `,
          [
            orderId,
            product.id,
            quantity,
            unitPrice,
          ]
        );
      }

      // Store the calculated order total.
      await client.query(
        `
        UPDATE orders
        SET total_amount = $1
        WHERE id = $2
        `,
        [
          Number(total.toFixed(2)),
          orderId,
        ]
      );
    }

    console.log(`Created ${TOTAL_ORDERS} orders.`);

    // -----------------------------------------------------
    // INVENTORY ALERTS
    // -----------------------------------------------------

    // Find products whose current stock is at or below
    // their configured reorder level.
    const lowStockProducts = await client.query(`
      SELECT
        id,
        name,
        stock_quantity,
        reorder_level
      FROM products
      WHERE stock_quantity <= reorder_level
    `);

    for (const product of lowStockProducts.rows) {
      const isOutOfStock = product.stock_quantity === 0;

      const alertType = isOutOfStock
        ? 'out_of_stock'
        : 'low_stock';

      const message = isOutOfStock
        ? `${product.name} is out of stock and needs immediate restocking.`
        : `${product.name} is running low. Only ${product.stock_quantity} units remaining.`;

      await client.query(
        `
        INSERT INTO inventory_alerts (
          product_id,
          alert_type,
          stock_at_time,
          message,
          is_read
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          product.id,
          alertType,
          product.stock_quantity,
          message,
          false,
        ]
      );
    }

    console.log(
      `Created ${lowStockProducts.rows.length} inventory alerts.`
    );

    // -----------------------------------------------------
    // COMMIT
    // -----------------------------------------------------

    await client.query('COMMIT');

    console.log('');
    console.log('========================================');
    console.log('       SEED COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log('Customers:         30');
    console.log(`Products:          ${products.length}`);
    console.log(`Orders:            ${TOTAL_ORDERS}`);
    console.log(
      `Inventory alerts:  ${lowStockProducts.rows.length}`
    );
    console.log('========================================');
    console.log('');
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('');
    console.error('Seed failed. Transaction rolled back.');
    console.error(error);
    console.error('');
  } finally {
    client.release();
    await pool.end();
  }
}

seed();


