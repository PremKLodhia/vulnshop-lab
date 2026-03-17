const bcrypt = require('bcryptjs');
const { db } = require('./database');

function seed() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existing.count > 0) {
    console.log('Database already seeded. Run reset-db first to re-seed.');
    return;
  }

  console.log('Seeding secure database...');

  // FIX: Hash passwords before storing
  const aliceHash = bcrypt.hashSync('password123', 10);
  const bobHash = bcrypt.hashSync('bobspassword', 10);
  const adminHash = bcrypt.hashSync('admin1234', 10);

  db.prepare('INSERT INTO users (username, email, password, role, bio) VALUES (?, ?, ?, ?, ?)')
    .run('alice', 'alice@vulnshop.lab', aliceHash, 'user', 'Hi, I am Alice! I love shopping online.');
  db.prepare('INSERT INTO users (username, email, password, role, bio) VALUES (?, ?, ?, ?, ?)')
    .run('bob', 'bob@vulnshop.lab', bobHash, 'user', 'Bob here. Bargain hunter!');
  db.prepare('INSERT INTO users (username, email, password, role, bio) VALUES (?, ?, ?, ?, ?)')
    .run('admin', 'admin@vulnshop.lab', adminHash, 'admin', 'Site administrator.');

  const products = [
    ['Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30hr battery.', 89.99, 'Electronics', 'https://via.placeholder.com/300x200?text=Headphones', 50],
    ['Running Shoes', 'Lightweight performance running shoes for all terrains.', 64.99, 'Footwear', 'https://via.placeholder.com/300x200?text=Shoes', 35],
    ['Coffee Maker', 'Programmable 12-cup drip coffee maker with thermal carafe.', 49.99, 'Kitchen', 'https://via.placeholder.com/300x200?text=Coffee+Maker', 20],
    ['Yoga Mat', 'Non-slip eco-friendly yoga mat, 6mm thick.', 29.99, 'Fitness', 'https://via.placeholder.com/300x200?text=Yoga+Mat', 100],
    ['Mechanical Keyboard', 'Compact TKL mechanical keyboard with RGB backlight.', 79.99, 'Electronics', 'https://via.placeholder.com/300x200?text=Keyboard', 15],
    ['Backpack', '30L waterproof hiking backpack with laptop compartment.', 54.99, 'Bags', 'https://via.placeholder.com/300x200?text=Backpack', 40],
  ];

  const insertProduct = db.prepare('INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)');
  products.forEach((p) => insertProduct.run(...p));

  db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)').run(1, 89.99, 'delivered');
  db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(1, 1, 1, 89.99);

  db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)').run(1, 94.98, 'shipped');
  db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(2, 4, 2, 29.99);
  db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(2, 3, 1, 49.99);

  db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)').run(2, 64.99, 'pending');
  db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(3, 2, 1, 64.99);

  db.prepare('INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(1, 2, 'bob', 5, 'Amazing headphones! Sound quality is superb.');
  db.prepare('INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(1, 1, 'alice', 4, 'Great product, comfortable to wear for long sessions.');
  db.prepare('INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(2, 1, 'alice', 5, 'Super lightweight, perfect for my morning runs!');

  db.prepare('INSERT INTO support_tickets (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)')
    .run(1, 'Alice', 'alice@vulnshop.lab', 'Order question', 'When will my order arrive?');

  console.log('Secure database seeded successfully!');
  console.log('Demo accounts:');
  console.log('  alice / password123 (user)');
  console.log('  bob   / bobspassword (user)');
  console.log('  admin / admin1234   (admin)');
}

seed();
