/**
 * Seed script to populate vehicle collection with 50 dummy records
 * Run: node seeds/seedVehicles.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Vehicle Schema (if not using models from models directory)
const vehicleSchema = new mongoose.Schema({
  carNumber: String,
  weight: Number,
  status: String, // 'ALLOWED' or 'BLOCKED'
  timestamp: Date,
  image: String,
  vehicleType: String, // 'LTV', 'HTV', 'BIKE', 'OTHER'
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Dummy data generation
const generateDummyVehicles = () => {
  const plates = [
    'ABC-1234', 'XYZ-5678', 'PQR-9012', 'DEF-3456', 'GHI-7890',
    'JKL-2345', 'MNO-6789', 'STU-0123', 'VWX-4567', 'YZA-8901',
    'BCD-2345', 'EFG-6789', 'HIJ-0123', 'KLM-4567', 'NOP-8901',
    'QRS-2345', 'TUV-6789', 'WXY-0123', 'ZAB-4567', 'CDE-8901',
    'FGH-2345', 'IJK-6789', 'LMN-0123', 'OPQ-4567', 'RST-8901',
    'UVW-2345', 'XYZ-6789', 'ABC-0123', 'DEF-4567', 'GHI-8901',
    'JKL-2345', 'MNO-6789', 'PQR-0123', 'STU-4567', 'VWX-8901',
    'YZA-2345', 'BCD-6789', 'EFG-0123', 'HIJ-4567', 'KLM-8901',
    'NOP-2345', 'QRS-6789', 'TUV-0123', 'WXY-4567', 'ZAB-8901',
    'CDE-2345', 'FGH-6789', 'IJK-0123', 'LMN-4567', 'OPQ-8901',
  ];

  const vehicleTypes = ['LTV', 'HTV', 'BIKE', 'OTHER'];
  const statuses = ['ALLOWED', 'BLOCKED'];

  const vehicles = [];

  for (let i = 0; i < 50; i++) {
    // Random entry time within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const secondsAgo = Math.floor(Math.random() * 60);

    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
    timestamp.setSeconds(timestamp.getSeconds() - secondsAgo);

    // Weight range based on vehicle type
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    let weight;
    if (vehicleType === 'LTV') {
      weight = Math.floor(Math.random() * (3500 - 1500) + 1500); // 1500-3500 kg
    } else if (vehicleType === 'HTV') {
      weight = Math.floor(Math.random() * (25000 - 5000) + 5000); // 5000-25000 kg
    } else if (vehicleType === 'BIKE') {
      weight = Math.floor(Math.random() * (300 - 100) + 100); // 100-300 kg
    } else {
      weight = Math.floor(Math.random() * (5000 - 500) + 500); // 500-5000 kg
    }

    // 80% allowed, 20% blocked
    const status = Math.random() > 0.2 ? 'ALLOWED' : 'BLOCKED';

    // Generate dummy image path
    const image = `/images/vehicles/${i + 1}.jpg`;

    vehicles.push({
      carNumber: plates[i],
      weight,
      status,
      timestamp,
      image,
      vehicleType,
    });
  }

  return vehicles;
};

// Main seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loadgate', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing vehicles
    await Vehicle.deleteMany({});
    console.log('🗑️  Cleared existing vehicle records');

    // Generate dummy vehicles
    const dummyVehicles = generateDummyVehicles();
    console.log(`📝 Generated ${dummyVehicles.length} dummy vehicle records`);

    // Insert into database
    const insertedVehicles = await Vehicle.insertMany(dummyVehicles);
    console.log(`✅ Inserted ${insertedVehicles.length} vehicle records into database`);

    // Display summary
    console.log('\n📊 Database Summary:');
    const total = await Vehicle.countDocuments();
    const allowed = await Vehicle.countDocuments({ status: 'ALLOWED' });
    const blocked = await Vehicle.countDocuments({ status: 'BLOCKED' });
    const ltvCount = await Vehicle.countDocuments({ vehicleType: 'LTV' });
    const htvCount = await Vehicle.countDocuments({ vehicleType: 'HTV' });
    const bikeCount = await Vehicle.countDocuments({ vehicleType: 'BIKE' });
    const otherCount = await Vehicle.countDocuments({ vehicleType: 'OTHER' });

    console.log(`  Total Records: ${total}`);
    console.log(`  Allowed: ${allowed} (${((allowed / total) * 100).toFixed(1)}%)`);
    console.log(`  Blocked: ${blocked} (${((blocked / total) * 100).toFixed(1)}%)`);
    console.log(`\n  Vehicle Types:`);
    console.log(`    LTV:   ${ltvCount}`);
    console.log(`    HTV:   ${htvCount}`);
    console.log(`    BIKE:  ${bikeCount}`);
    console.log(`    OTHER: ${otherCount}`);

    // Display sample records
    console.log('\n📋 Sample Records:');
    const samples = await Vehicle.find().limit(3);
    samples.forEach((vehicle, index) => {
      console.log(`  ${index + 1}. ${vehicle.carNumber} | ${vehicle.weight}kg | ${vehicle.vehicleType} | ${vehicle.status} | ${vehicle.timestamp.toLocaleString()}`);
    });

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
