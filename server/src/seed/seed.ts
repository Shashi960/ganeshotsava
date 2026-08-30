import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Year } from '../models/Year';
import { Admin } from '../models/Admin';
import { Place } from '../models/Place';
import { Event } from '../models/Event';
import { FinancialRecord } from '../models/FinancialRecord';
import { Setting } from '../models/Setting';
import { Member } from '../models/Member';
import { Team } from '../models/Team';
import { Volunteer } from '../models/Volunteer';
import { KatheParticipant } from '../models/KatheParticipant';
import { PrasadaDelivery } from '../models/PrasadaDelivery';
import { AuctionItem } from '../models/AuctionItem';

const seed = async (shouldClose = true) => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ganeshotsava';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(connStr);
      console.log('Connected to MongoDB for seeding...');
    }

    // Clean current database
    await Year.deleteMany({});
    await Admin.deleteMany({});
    await Place.deleteMany({});
    await Event.deleteMany({});
    await FinancialRecord.deleteMany({});
    await Setting.deleteMany({});
    await Member.deleteMany({});
    await Team.deleteMany({});
    await Volunteer.deleteMany({});
    await KatheParticipant.deleteMany({});
    await PrasadaDelivery.deleteMany({});
    await AuctionItem.deleteMany({});

    console.log('Cleared existing data.');

    // 1. Seed Years (2024, 2025, 2026)
    await Year.create({ year: '2024', isCurrent: false, status: 'archived' });
    await Year.create({ year: '2025', isCurrent: false, status: 'archived' });
    await Year.create({ year: '2026', isCurrent: true, status: 'active' });
    console.log('Seeded operational years.');

    // 2. Seed Admin User
    const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@ganeshotsava.com';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';
    const passwordHash = await bcrypt.hash(password, 10);
    await Admin.create({
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      active: true,
    });
    console.log(`Seeded Super Admin user: ${email}`);

    // 3. Seed Places (Kelaginuru, Najagara Cross, Najagara, Salebail, Karki)
    const placesData = [
      { name: 'Najagara', nameKannada: 'ನಾಜಗಾರ', year: '2026' },
      { name: 'Najagara Cross', nameKannada: 'ನಾಜಗಾರ ಕ್ರಾಸ್', year: '2026' },
      { name: 'Salebail', nameKannada: 'ಸಾಲೆಬೈಲ್', year: '2026' },
      { name: 'Kelaginuru', nameKannada: 'ಕೆಳಗಿನೂರು', year: '2026' },
      { name: 'Karki', nameKannada: 'ಕರ್ಕಿ', year: '2026' }
    ];
    const places = await Place.insertMany(placesData);
    console.log('Seeded places/areas.');

    const najagaraPlace = places.find(p => p.name === 'Najagara')!;
    const najagaraCrossPlace = places.find(p => p.name === 'Najagara Cross')!;
    const salebailPlace = places.find(p => p.name === 'Salebail')!;
    const kelaginuruPlace = places.find(p => p.name === 'Kelaginuru')!;

    // 4. Seed Members for 2026 (strictly from Image 4)
    const memberData = [
      // 2026 Committee (Image 4 Headers)
      { firstName: 'ತಿಮ್ಮಪ್ಪ ಎಲ್.', lastName: 'ಆಚಾರ್ಯ', role: 'President', memberType: 'Committee Member', year: '2026' },
      { firstName: 'ಮಂಜುನಾಥ ಜಿ.', lastName: 'ಮಹಾಲೆ', role: 'Secretary', memberType: 'Committee Member', year: '2026' },
      { firstName: 'ಎಸ್. ಡಿ.', lastName: 'ಗೌಡ', role: 'Treasurer', memberType: 'Committee Member', year: '2026' },
      
      // General Members list 1 to 37 (Image 4)
      { firstName: 'ಅಶೋಕ ಎಸ್.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಗಣೇಶ ನಾಗಪ್ಪ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026', notes: 'Ratna & Ganesh (Singapore) Ganesha Idol Sponsor' },
      { firstName: 'ಗಣೇಶ ಬಿ.', lastName: 'ಮಹಾಲೆ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಬಾಬು ಎಂ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಈಶ್ವರ ಟಿ.', lastName: 'ಗೌಡ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಸೀತಾರಾಮ ಜಿ.', lastName: 'ಶೆಟ್ಟಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಸಂತೋಷ ಎ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ದತ್ತಾತ್ರೇಯ ಎಂ.', lastName: 'ಆಚಾರಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಂಜುನಾಥ ಜಿ.', lastName: 'ಮಹಾಲೆ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಂಜುನಾಥ ಡಿ.', lastName: 'ಗೌಡ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಂಜುನಾಥ ರಾಮು', lastName: 'ಆಚಾರಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಎಂ.ಪಿ.', lastName: 'ಶೆಟ್ಟಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಸೂರ್ಯ ಎಂ.', lastName: 'ಗೌಡ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಕೊಟೇಶ್ವರ ಮಂಜುನಾಥ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಅಭಿಷೇಕ ಡಿ.', lastName: 'ಗೌಡ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಗಣಪತಿ ನಾರಾಯಣ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಹರೀಶ ಆರ್.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಕಿರಣ ಬಿ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಉಮೇಶ ಜಿ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಬಾಬು ಜಿ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಾರುತಿ ಮಂಜುನಾಥ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ರಂಜನ್ ಜಿ.', lastName: 'ಗೌಡ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಗಣೇಶ ನಾಗೇಶ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಾರುತಿ ಎಂ.', lastName: 'ಆಚಾರ್ಯ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ರಾಮಚಂದ್ರ ಜಿ.', lastName: 'ಕೊಡಕಣಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಕೇಶವ ಜಿ.', lastName: 'ಕೊಡಕಣಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ರಾಜೇಶ ಎನ್.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಸಂತೋಷ ಎಂ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಗಗನ ಗಣಪತಿ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಅಜಿತ್ ಆರ್.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಂಜುನಾಥ ಜಿ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಗಂಗಾಧರ ಡಿ.', lastName: 'ಗೌಡ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಮಾರುತಿ ಗಂಗಾಧರ', lastName: 'ಮಹಾಲೆ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಅಜಿತ್', lastName: 'ಕೊಡಕಣಿ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಹರೀಶ', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ರಂಜನ ದಿಟ್ಟು', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },
      { firstName: 'ಲೋಕೇಶ ಜಿ.', lastName: 'ನಾಯ್ಕ', role: 'Member', memberType: 'Member', year: '2026' },

      // Junior Members (Image 4 Bottom Box)
      { firstName: 'ಸಂಜಯ್ ಎಸ್.', lastName: 'ಗೌಡ', memberType: 'Junior Member', year: '2026' },
      { firstName: 'ಪ್ರಶಾಂತ್ ಎಸ್.', lastName: 'ಕೊಡಿಯಾ', memberType: 'Junior Member', year: '2026' },
      { firstName: 'ಕಾರ್ತಿಕ್ ಜಿ.', lastName: 'ಮಹಾಲೆ', memberType: 'Junior Member', year: '2026' },
      { firstName: 'ಕಿರಣ್ ಬಿ.', lastName: 'ನಾಯ್ಕ', memberType: 'Junior Member', year: '2026' },
      { firstName: 'ತಿಲಕರಾಜ ಎ.', lastName: 'ನಾಯ್ಕ', memberType: 'Junior Member', year: '2026' },
      { firstName: 'ನಾಗರಾಜ ಯು.', lastName: 'ಮಹಾಲೆ', memberType: 'Junior Member', year: '2026' }
    ];
    const seededMembers = await Member.insertMany(memberData);
    console.log('Seeded actual members list.');

    // 5. Seed Teams for 2026
    const teamCultural = await Team.create({
      name: 'Cultural Team',
      nameKannada: 'ಸಾಂಸ್ಕೃತಿಕ ಸಮಿತಿ',
      description: 'Manages cultural events and competitions',
      leader: seededMembers[0]._id,
      members: [seededMembers[0]._id, seededMembers[3]._id],
      year: '2026'
    });

    const teamPuja = await Team.create({
      name: 'Puja Team',
      nameKannada: 'ಪೂಜಾ ಸಮಿತಿ',
      description: 'Manages daily rituals, prasada and pooja items',
      leader: seededMembers[2]._id,
      members: [seededMembers[1]._id, seededMembers[2]._id],
      year: '2026'
    });
    console.log('Seeded teams.');

    // 6. Seed actual Volunteers (derived from junior members in Image 4)
    const volunteersData = [
      { name: 'ಸಂಜಯ್ ಎಸ್. ಗೌಡ', phone: '9060698911', team: teamPuja._id, availability: 'All Days', active: true, year: '2026', areas: [najagaraPlace._id] },
      { name: 'ಪ್ರಶಾಂತ್ ಎಸ್. ಕೊಡಿಯಾ', phone: '9060698912', team: teamCultural._id, availability: 'Evenings', active: true, year: '2026', areas: [najagaraCrossPlace._id] },
      { name: 'ಕಾರ್ತಿಕ್ ಜಿ. ಮಹಾಲೆ', phone: '9060698913', team: teamPuja._id, availability: 'All Days', active: true, year: '2026', areas: [salebailPlace._id] },
      { name: 'ಕಿರಣ್ ಬಿ. ನಾಯ್ಕ', phone: '9060698914', team: teamCultural._id, availability: 'Evenings', active: true, year: '2026', areas: [kelaginuruPlace._id] },
      { name: 'ತಿಲಕರಾಜ ಎ. ನಾಯ್ಕ', phone: '9060698915', team: teamPuja._id, availability: 'All Days', active: true, year: '2026', areas: [najagaraPlace._id] },
      { name: 'ನಾಗರಾಜ ಯು. ಮಹಾಲೆ', phone: '9060698916', team: teamCultural._id, availability: 'All Days', active: true, year: '2026', areas: [kelaginuruPlace._id] }
    ];
    await Volunteer.insertMany(volunteersData);
    console.log('Seeded actual volunteers.');

    // 7. Seed Events for 2026 (strictly from Image 2 & 6)
    const eventsData = [
      {
        title: 'Shri Ganesh Idol Installation & Afternoon Pooja',
        titleKannada: 'ಶ್ರೀ ಗಣೇಶ ಮೂರ್ತಿಯ ಪ್ರತಿಷ್ಠಾಪನೆ ಹಾಗೂ ಪೂಜೆ',
        description: 'Installation of Shri Ganesha idol. Sponsor: Smt. Ratna & Ganesh Nagappa Nayak, Singapore.',
        descriptionKannada: 'ಶ್ರೀ ಗಣೇಶ ಮೂರ್ತಿಯ ಪ್ರತಿಷ್ಠಾಪನೆ, ಪೂಜೆ. ಮೂರ್ತಿಯ ಸೇವಾದಾರರು: ಶ್ರೀಮತಿ ರತ್ನ ಮತ್ತು ಗಣೇಶ ನಾಗಪ್ಪ ನಾಯ್ಕ, ನಾಜಗಾರ (ಸಿಂಗಾಪುರ).',
        date: new Date('2026-09-14'),
        startTime: '12:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Puja',
        year: '2026',
        status: 'Upcoming',
        featured: true,
        team: teamPuja._id
      },
      {
        title: 'Night Seva Pooja - Day 1',
        titleKannada: 'ರಾತ್ರಿ ಸೇವಾಪೂಜೆ - ದಿನ 1',
        description: 'Devotional night service and prayers.',
        descriptionKannada: 'ರಾತ್ರಿ ವಿಶೇಷ ಸೇವಾಪೂಜೆ ಹಾಗೂ ಪ್ರಾರ್ಥನೆ.',
        date: new Date('2026-09-14'),
        startTime: '08:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Religious',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Afternoon Seva Pooja - Day 2',
        titleKannada: 'ಮಧ್ಯಾಹ್ನ ಸೇವಾಪೂಜೆ - ದಿನ 2',
        description: 'Afternoon devotional service.',
        descriptionKannada: 'ಮಧ್ಯಾಹ್ನ ವಿಶೇಷ ಸೇವಾಪೂಜೆ.',
        date: new Date('2026-09-15'),
        startTime: '12:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Religious',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Night Seva Pooja - Day 2',
        titleKannada: 'ರಾತ್ರಿ ಸೇವಾಪೂಜೆ - ದಿನ 2',
        description: 'Night service by Maruti M. Gowda, Najagara.',
        descriptionKannada: 'ರಾತ್ರಿ ಮಾರುತಿ ಎಂ. ಗೌಡ, ನಾಜಗಾರ ಇವರಿಂದ ಸೇವಾಪೂಜೆ.',
        date: new Date('2026-09-15'),
        startTime: '08:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Religious',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Mass Shri Satya Ganapati Vrata',
        titleKannada: 'ಸಾಮೂಹಿಕ ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ',
        description: 'Mass prayers and Satya Ganapati Vrata for universal welfare. Registration fee: Rs 150. Sponsor: Ganapati R. Nayak.',
        descriptionKannada: 'ಲೋಕ ಕಲ್ಯಾಣಾರ್ಥವಾಗಿ ಸಾಮೂಹಿಕ ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ. ವ್ರತ ಕಾಣಿಕೆ ರೂ. 150/-. ಪ್ರಸಾದ ಹಾಗೂ ಪೂಜಾ ಸಾಮಗ್ರಿಗಳ ಸೇವಾದಾರರು: ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಜಗಾರ ಕ್ರಾಸ್.',
        date: new Date('2026-09-16'),
        startTime: '08:30 AM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Religious',
        year: '2026',
        status: 'Upcoming',
        featured: true,
        team: teamPuja._id
      },
      {
        title: 'Maha Pooja & Community Feast (Annasantarpane)',
        titleKannada: 'ಮಹಾಪೂಜೆ ಹಾಗೂ ಮಹಾ ಅನ್ನಸಂತರ್ಪಣೆ',
        description: 'Maha Pooja followed by community feast. Sponsor: Rajesh Nagesh Nayak & Family, Singapore.',
        descriptionKannada: 'ಮಧ್ಯಾಹ್ನ ಮಹಾಪೂಜೆ, ನಂತರ ಮಹಾ ಅನ್ನಸಂತರ್ಪಣೆ. ಅನ್ನದಾನ ಸೇವಾದಾರರು: ರಾಜೇಶ ನಾಗೇಶ ನಾಯ್ಕ ಹಾಗೂ ಕುಟುಂಬದವರು, ನಾಜಗಾರ (ಸಿಂಗಾಪುರ).',
        date: new Date('2026-09-16'),
        startTime: '12:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Food',
        year: '2026',
        status: 'Upcoming',
        featured: true,
        team: teamPuja._id
      },
      {
        title: 'Night Seva Pooja & Bhajans Program',
        titleKannada: 'ರಾತ್ರಿ ಸೇವಾಪೂಜೆ ಹಾಗೂ ಭಜನಾ ಕಾರ್ಯಕ್ರಮ',
        description: 'Night Seva Pooja by Vishnumurthy Yaji followed by Devotional Bhajana. Sponsors: Thimmappa Acharya & Maruti Acharya, Salebail.',
        descriptionKannada: 'ರಾತ್ರಿ ವಿಷ್ಣುಮೂರ್ತಿ ಯಾಜಿ ಇವರಿಂದ ಸೇವಾಪೂಜೆ ಹಾಗೂ ನಂತರ ತಿಮ್ಮಪ್ಪ ಆಚಾರ್ಯ ಮತ್ತು ಮಾರುತಿ ಆಚಾರ್ಯ ಸಾಲೆಬೈಲ್ ಇವರಿಂದ ಭಜನಾ ಕಾರ್ಯಕ್ರಮ.',
        date: new Date('2026-09-16'),
        startTime: '08:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Cultural',
        year: '2026',
        status: 'Upcoming',
        team: teamCultural._id
      },
      {
        title: 'Afternoon Seva Pooja - Day 4',
        titleKannada: 'ಮಧ್ಯಾಹ್ನ ಸೇವಾಪೂಜೆ - ದಿನ 4',
        description: 'Devotional afternoon prayers.',
        descriptionKannada: 'ಮಧ್ಯಾಹ್ನ ವಿಶೇಷ ಸೇವಾಪೂಜೆ.',
        date: new Date('2026-09-17'),
        startTime: '12:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Religious',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Cultural Programs & Drawing Competition',
        titleKannada: 'ವಿವಿಧ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮ ಹಾಗೂ ಚಿತ್ರಕಲೆ ಸ್ಪರ್ಧೆ',
        description: 'Cultural programs starting with Bhakti Geethe (juniors & seniors) and spot drawing competition.',
        descriptionKannada: 'ಸಂಜೆ 4:00 ಗಂಟೆಯಿಂದ ವಿವಿಧ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮ, ಭಕ್ತಿಗೀತೆ ಸ್ಪರ್ಧೆ ಹಾಗೂ ಚಿತ್ರಕಲೆ ಸ್ಪರ್ಧೆ.',
        date: new Date('2026-09-17'),
        startTime: '04:00 PM',
        location: 'Main Pandal, Kelaginuru',
        category: 'Cultural',
        year: '2026',
        status: 'Upcoming',
        featured: true,
        team: teamCultural._id
      },
      {
        title: 'Night Seva Pooja - Day 4',
        titleKannada: 'ರಾತ್ರಿ ಸೇವಾಪೂಜೆ - ದಿನ 4',
        description: 'Night service by Manjunath Deva Gowda.',
        descriptionKannada: 'ರಾತ್ರಿ 8-00 ಗಂಟೆಗೆ ಮಂಜುನಾಥ್ ದೇವ ಗೌಡ ಇವರಿಂದ ಸೇವಾಪೂಜೆ.',
        date: new Date('2026-09-17'),
        startTime: '08:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Religious',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Pooja and Visarjana Pooja',
        titleKannada: 'ಪೂಜೆ ಹಾಗೂ ವಿಸರ್ಜನಾ ಪೂಜೆ',
        description: 'Final day rituals and prayers before immersion. Sweet Prasada sponsors: Manjunatha Deva Gowda, Ashoka Honnappa Nayak, etc.',
        descriptionKannada: 'ಮಧ್ಯಾಹ್ನ ಪೂಜೆ ಹಾಗೂ ಮಂಗಳಮೂರ್ತಿಯ ವಿಸರ್ಜನಾ ಪೂಜೆ. ಸಿಹಿ ಪ್ರಸಾದದ ಪ್ರಾಯೋಜಕರು: ಮಂಜುನಾಥ ದೇವ ಗೌಡ, ಅಶೋಕ ಹೊನ್ನಪ್ಪ ನಾಯ್ಕ, ಗಣಪತಿ ರಾಮ ನಾಯ್ಕ, ರಾಮು ಮಂಜುನಾಥ ಆಚಾರಿ, ಮಂಜುನಾಥ ಗಣಪತಿ ಕೊಡಿಯಾ, ಗಣಪತಿ ಹೊನ್ನಯ್ಯ ಕೊಡಿಯಾ, ಗಜಾನನ ಗೋವಿಂದ ಮಡಿವಾಳ, ಮಾದೇವಿ ಗಣಪತಿ ಕೊಡಿಯಾ, ರಾಮಚಂದ್ರ ಗಣಪತಿ ಕೊಡಿಯಾ, ಶ್ರೀಧರ ಸುಬ್ಬು ನಾಯ್ಕ, ಗಜಾನನ ಈರಯ್ಯ ನಾಯ್ಕ, ಪರಮೇಶ್ವರ ಮಂಜುನಾಥ ನಾಯ್ಕ.',
        date: new Date('2026-09-18'),
        startTime: '12:00 PM',
        location: 'Sri Ganapati Sannidhi, Kelaginuru',
        category: 'Puja',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Fruits and Offerings Auction',
        titleKannada: 'ಫಲಾವಳಿ ಹಾಗೂ ವಿವಿಧ ಸಾಮಾನಿನ ಹರಾಜು',
        description: 'Community auction of offerings and items.',
        descriptionKannada: 'ಮಧ್ಯಾಹ್ನ 3:00 ಗಂಟೆಗೆ ಫಲಾವಳಿ ಹಾಗೂ ವಿವಿಧ ಪೂಜಾ ಸಾಮಾನಿನ ಬಹಿರಂಗ ಹರಾಜು.',
        date: new Date('2026-09-18'),
        startTime: '03:00 PM',
        location: 'Main Pandal, Kelaginuru',
        category: 'Community',
        year: '2026',
        status: 'Upcoming',
        team: teamPuja._id
      },
      {
        title: 'Maha Visarjana Procession',
        titleKannada: 'ಮಂಗಳಮೂರ್ತಿಯ ವಿಸರ್ಜನಾ ಮೆರವಣಿಗೆ',
        description: 'Grand immersion procession of Lord Ganesha.',
        descriptionKannada: 'ಸಂಜೆ 4:00 ಗಂಟೆಗೆ ಸರಿಯಾಗಿ ಮಂಗಳಮೂರ್ತಿಯ ಭವ್ಯ ವಿಸರ್ಜನಾ ಮೆರವಣಿಗೆ.',
        date: new Date('2026-09-18'),
        startTime: '04:00 PM',
        location: 'Kelaginuru Main Road to River',
        category: 'Procession',
        year: '2026',
        status: 'Upcoming',
        featured: true,
        team: teamPuja._id
      }
    ];
    await Event.insertMany(eventsData);
    console.log('Seeded program events.');

    // 8. Seed Financial Statement (2025-2026 Data - strictly from Image 3 & 5)
    const financialData = [
      // Income 2025-26
      { year: '2025', category: 'Ledger Balance', description: 'ಕಡ್ತಿಯಿಂದ ಬಂದ ಜಮಾ', amount: 28200, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donation', description: 'ದೇಣಿಗೆ ರೂಪದಲ್ಲಿ ಬಂದದ್ದು', amount: 16783, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Offerings', description: 'ಕಾಣಿಕೆ ಜಮಾ', amount: 3809, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Seva Pooja Receipts', description: 'ಸೇವಾ ಪೂಜೆ ರಸೀದಿ ಪಾಪ್ತಿ', amount: 561, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Member Subscription', description: 'ಸದಸ್ಯ ಶುಲ್ಕ ರೂಪದಲ್ಲಿ ಬಂದದ್ದು', amount: 14350, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: '2025 Auction Receipts', description: '2025ರ ಸವಾಲು ಜಮಾ', amount: 7850, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Bank Withdrawal', description: 'ಅಕೌಂಟ್‌ದಿಂದ ತೆಗೆದದ್ದು', amount: 20000, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: '2024 Auction Carryover', description: '2024ರ ಸವಾಲಿನಿಂದ ಜಮಾ', amount: 65050, type: 'INCOME', visibility: 'PUBLIC' },

      // Prominent Donors Listing (Image 5)
      { year: '2025', category: 'Donor Listing', description: 'ಶ್ರೀ ದುರ್ಗಾಂಬಾ ಹೋಟೆಲ್', amount: 2000, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಡಾ. ರಾಜೇಶ ಶೆಟ್ಟಿ, ಕೆಳಗಿನೂರು', amount: 1000, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ವಿಷ್ಣು ನಾಗಪ್ಪ ನಾಯ್ಕ, ನಾಜಗಾರ', amount: 551, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಗಣೇಶ ವಿಷ್ಣು ಹೆಗಡೆ, ಹೊಸಮನೆ', amount: 501, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಚಂದ್ರಪ್ಪ ಕೃಷ್ಣಯ್ಯ ಗೌಡ, ನಾಜಗಾರ', amount: 501, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಜಯಲಕ್ಷ್ಮಿ ಭಟ್', amount: 501, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಭೀಮರಾವ್, ಹೊಸಪಟ್ಟಣ ಕ್ರಾಸ್', amount: 501, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ತಿಮ್ಮಪ್ಪ ಗೌಡ (ಅಡುಗೆಯವರು)', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ರಾಮನ್ ರಾಜಾರಾಂ, ಕಾರ್ಕಾಳಕೋಡು', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಅಣ್ಣಪ್ಪ ಗಣಪತಿ ಶೇಟ್, ಕಲ್ಲೇಮನೆ', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಗಣಪತಿ ಭಟ್, ಕಡೇಮನೆ', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ನಾಗರಾಜ ತಿಮ್ಮಪ್ಪ ಗೌಡ, ನಾಜಗಾರ', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಸಂತೋಷ ಬಿ. ಶೇಟ್, ಕಲ್ಲೇಮನೆ', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಕಲ್ಪನಾ ದೇವ ನಾಯ್ಕ, ಕುಳೀಮನೆ', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },
      { year: '2025', category: 'Donor Listing', description: 'ಜಾರ್ಜ್ ಫರ್ನಾಂಡಿಸ್', amount: 500, type: 'INCOME', visibility: 'PUBLIC' },

      // Expenses 2025-26
      { year: '2025', category: 'Printing', description: 'ಪ್ರಿಂಟಿಂಗ್ ಖರ್ಚು', amount: 6200, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Daily Pooja', description: 'ನಿತ್ಯಪೂಜೆ ವೆಚ್ಚ', amount: 8235, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Entertainment & Cultural', description: 'ಮನರಂಜನಾ ಹಾಗೂ ಸಾಂಸ್ಕೃತಿಕ ವೆಚ್ಚ', amount: 3805, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Satya Ganapati Kathe', description: 'ಕಥೆ ಬಾಬು ವೆಚ್ಚ', amount: 10836, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Decoration & Auction Items', description: 'ಡೆಕೋರೇಶನ್ ಮತ್ತು ಸವಾಲು ಸಾಮಾನ', amount: 16013, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Building Pandal', description: 'ಕಟ್ಟಡ ಹಾಗೂ ಚಪ್ಪರ ವೆಚ್ಚ', amount: 16223, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Immersion Procession', description: 'ವಿಸರ್ಜನೆ ಹಾಗೂ ಮೆರವಣಿಗೆ ವೆಚ್ಚ', amount: 35657, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Electricity Bill', description: 'ಕರೆಂಟ್ ಬಿಲ್ ಪಾವತಿ', amount: 3024, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Miscellaneous', description: 'ಇತರೇ ವೆಚ್ಚಗಳು', amount: 9891, type: 'EXPENSE', visibility: 'PUBLIC' },
      { year: '2025', category: 'Carry Forward Balance', description: 'ಉಳಿತಾಯ ಶಿಲ್ಕು ಮೊತ್ತ', amount: 46719, type: 'EXPENSE', visibility: 'PUBLIC' }
    ];
    await FinancialRecord.insertMany(financialData);
    console.log('Seeded financial statement.');

    // 9. Keep active workflows (Kathe registrations, Prasada deliveries, Auction bids) empty for clean production launch!
    console.log('Active collections left empty for clean production slate.');

    // 10. Seed Global Settings for 2026
    const settingsData = [
      { key: 'festivalName', value: '35th Annual Ganeshotsava Kelaginuru' },
      { key: 'currentYear', value: '2026' },
      { key: 'contactPhone', value: '+91 9060698906' },
      { key: 'contactEmail', value: 'info@najagaraganeshotsava.com' },
      { key: 'financialVisibility', value: 'PUBLIC' },
      { key: 'memberPrivacy', value: 'HIDE_CONTACT' },
      { key: 'defaultLanguage', value: 'kn' }
    ];
    await Setting.insertMany(settingsData);
    console.log('Seeded global system settings.');

    console.log('Database seeded successfully!');
    if (shouldClose) {
      mongoose.connection.close();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    if (shouldClose) {
      process.exit(1);
    }
  }
};

export const runSeed = async (shouldClose = true) => {
  await seed(shouldClose);
};

if (process.argv[1] && (process.argv[1].includes('seed') || process.argv[1].includes('update_brochure') || process.argv[1].includes('change_admin_password'))) {
  seed(true);
}
