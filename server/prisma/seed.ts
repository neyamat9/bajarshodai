import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/&channel_binding=[^&]*/, '');
dbUrl = dbUrl.replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const categories = [
  {
    name: 'Computers',
    subCategories: [
      'Desktop PCs', 'Laptops', 'Mini PCs', 'Workstations',
      'All-in-One PCs', 'Servers',
    ],
  },
  {
    name: 'Mobile Devices',
    subCategories: [
      'Smartphones', 'Tablets', 'Smartwatches', 'Feature Phones', 'E-Readers',
    ],
  },
  {
    name: 'Computer Components',
    subCategories: [
      'CPUs (Processors)', 'GPUs (Graphics Cards)', 'Motherboards', 'RAM',
      'SSDs', 'HDDs', 'Power Supplies (PSUs)', 'PC Cases', 'Cooling Systems',
    ],
  },
  {
    name: 'Audio Equipment',
    subCategories: [
      'Microphones', 'Headphones', 'Earbuds', 'Speakers',
      'Sound Cards', 'Audio Interfaces', 'Mixers',
    ],
  },
  {
    name: 'Cameras & Video',
    subCategories: [
      'DSLR Cameras', 'Mirrorless Cameras', 'Action Cameras', 'Webcams',
      'Camcorders', 'Drones', 'Camera Lenses',
    ],
  },
  {
    name: 'Gaming',
    subCategories: [
      'Gaming PCs', 'Gaming Laptops', 'Gaming Monitors',
      'Gaming Keyboards', 'Gaming Mice', 'Controllers',
      'Consoles', 'VR Headsets',
    ],
  },
  {
    name: 'Networking',
    subCategories: [
      'Routers', 'Modems', 'Switches', 'Access Points',
      'Network Adapters', 'NAS Devices',
    ],
  },
  {
    name: 'Peripherals',
    subCategories: [
      'Monitors', 'Keyboards', 'Mice', 'Printers', 'Scanners',
      'Drawing Tablets', 'Projectors',
    ],
  },
  {
    name: 'Storage',
    subCategories: [
      'External SSDs', 'External HDDs', 'USB Flash Drives',
      'Memory Cards', 'NAS Storage',
    ],
  },
  {
    name: 'Smart Home',
    subCategories: [
      'Smart Speakers', 'Smart Displays', 'Smart Lights',
      'Smart Locks', 'Smart Cameras', 'Smart Thermostats',
    ],
  },
  {
    name: 'Wearables',
    subCategories: [
      'Smartwatches', 'Fitness Trackers', 'Smart Rings', 'AR Glasses',
    ],
  },
  {
    name: 'TV & Entertainment',
    subCategories: [
      'Smart TVs', 'Streaming Devices', 'TV Boxes',
      'Home Theater Systems', 'Soundbars',
    ],
  },
  {
    name: 'Accessories',
    subCategories: [
      'Chargers', 'Power Banks', 'Cables', 'Adapters',
      'Laptop Bags', 'Phone Cases', 'Screen Protectors', 'Docking Stations',
    ],
  },
  {
    name: 'Office Tech',
    subCategories: [
      'Printers', 'Label Makers', 'Conference Cameras',
      'VoIP Phones', 'Barcode Scanners',
    ],
  },
  {
    name: 'Creator Equipment',
    subCategories: [
      'Studio Microphones', 'Capture Cards', 'Stream Decks',
      'Green Screens', 'Lighting Kits', 'Tripods',
    ],
  },
  {
    name: 'Emerging Tech',
    subCategories: [
      'AI Devices', 'VR Headsets', 'AR Glasses',
      'Robotics Kits', '3D Printers', 'Development Boards (Arduino, Raspberry Pi)',
    ],
  },
];

async function main() {
  console.log('Seeding categories...');

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: slug(cat.name) },
      update: { name: cat.name, status: 'ACTIVE', displayOrder: categories.indexOf(cat) },
      create: {
        name: cat.name,
        slug: slug(cat.name),
        status: 'ACTIVE',
        displayOrder: categories.indexOf(cat),
      },
    });
    console.log(`  ✓ Category: ${cat.name}`);

    for (const subName of cat.subCategories) {
      const subSlug = `${slug(cat.name)}-${slug(subName)}`;
      await prisma.subCategory.upsert({
        where: { slug: subSlug },
        update: { name: subName, parentCategoryId: category.id, status: 'ACTIVE' },
        create: {
          name: subName,
          slug: subSlug,
          parentCategoryId: category.id,
          status: 'ACTIVE',
        },
      });
    }
    console.log(`    ${cat.subCategories.length} subcategories`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
