const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ganeshotsava';

// Define schema
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const Setting = mongoose.model('Setting', SettingSchema);

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database to update brochure sponsors...');

    const sponsors = [
      { key: 'festivalName', value: '35ನೇ ವರ್ಷದ ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಕಾರ್ಯಕ್ರಮ' },
      { key: 'currentYear', value: '2026' },
      { key: 'idolSponsor', value: 'ಶ್ರೀಮತಿ ರೇಖಾ ಮತ್ತು ಗಣೇಶ ನಾಗೇಶ ನಾಯ್ಕ, ನಾಜಗಾರ (ಪ್ರಭಾತನಗರ, ಹೊನ್ನಾವರ)' },
      { key: 'annasantharpaneSponsor', value: 'ರಾಜೀಶ ನಾಗೇಶ ನಾಯ್ಕ ಹಾಗೂ ಕುಟುಂಬದವರು, ನಾಜಗಾರ (ಪ್ರಭಾತನಗರ, ಹೊನ್ನಾವರ)' },
      { key: 'bhajansSponsor', value: 'ತಿಮ್ಮಪ್ಪ ಆಚಾರ್ಯ ಹಾಗೂ ಮಾಯಿತಿ ಆಚಾರ್ಯ, ಸಾಲೇಬೈಲ್' },
      { key: 'samuvasadaSponsor', value: 'ಅಕ್ಷಯ್ಯ ಆಚಾರ್ಯ ಸಾಲೇಬೈಲ್ ಹಾಗೂ __________________' },
      { key: 'prasadaSponsor', value: 'ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಗೇಶ್ವರ ಕ್ರಾಸ್' }
    ];

    for (const item of sponsors) {
      await Setting.findOneAndUpdate(
        { key: item.key },
        { value: item.value },
        { upsert: true, new: true }
      );
      console.log(`Updated setting: ${item.key}`);
    }

    console.log('Sponsors successfully updated in MongoDB!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating sponsors:', error);
    process.exit(1);
  }
};

run();
