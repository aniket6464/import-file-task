import express from 'express'
import connectDB from './model/Db.js'
import Company from './model/Compines.js';
import dotenv from 'dotenv'
import multer from 'multer';
import XLSX from 'xlsx'
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import path from 'path';

// Load environment variables
dotenv.config();

connectDB()

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Example route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Use memory storage instead of saving to disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to validate email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const parseFileFromBuffer = (buffer, originalName) => {
  const ext = originalName.split('.').pop().toLowerCase();
  if (ext === 'xlsx') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet); // returns an array of objects
  }

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      const rows = [];
      const stream = Readable.from(buffer);
      stream
        .pipe(csvParser())
        .on('data', (data) => rows.push(data))
        .on('end', () => resolve(rows))
        .on('error', (err) => reject(err));
    });
  }

  throw new Error('Unsupported file type');
};

// Route to accept single file
app.post('/api/import', upload.single('file'), async (req, res) => {
  const { importType } = req.body;
  const { buffer, originalname } = req.file;

  if (!['1', '2', '3', '4', '5'].includes(importType)) {
    return res.status(400).json({ error: 'Invalid import mode' });
  }

  try {
    const records = await parseFileFromBuffer(buffer, originalname);
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of records) {
      const email = row.email?.trim();
      
      if (!email || !isValidEmail(email)) {
        skipped++;
        continue;
      }

      if(!row.name) {skipped++;continue;}

      const companyData = {
        name: row.name?.trim(),
        industry: row.industry?.trim(),
        location: row.location?.trim(),
        phone: row.phone ? Number(row.phone) : undefined
      };

      const existing = await Company.findOne({ email });

      switch (importType) {
        case '1': // Create New Only
          if (!existing) {
            await Company.create({ email, ...companyData });
            inserted++;
          } else skipped++;
          break;

        case '2': // Create New + Update Without Overwrite
          if (!existing) {
            await Company.create({ email, ...companyData });
            inserted++;
          } else {
            let modified = false;
            for (const key in companyData) {
              if (!existing[key] && companyData[key]) {
                existing[key] = companyData[key];
                modified = true;
              }
            }
            if (modified) {
              await existing.save();
              updated++;
            } else skipped++;
          }
          break;

        case '3': // Create New + Update With Overwrite
          if (!existing) {
            await Company.create({ email, ...companyData });
            inserted++;
          } else {
            Object.assign(existing, companyData);
            await existing.save();
            updated++;
          }
          break;

        case '4': // Update Existing Only Without Overwrite
          if (existing) {
            let modified = false;
            for (const key in companyData) {
              if (!existing[key] && companyData[key]) {
                existing[key] = companyData[key];
                modified = true;
              }
            }
            if (modified) {
              await existing.save();
              updated++;
            } else skipped++;
          } else skipped++;
          break;

        case '5': // Update Existing Only With Overwrite
          if (existing) {
            Object.assign(existing, companyData);
            await existing.save();
            updated++;
          } else skipped++;
          break;
      }
    }

    // fs.unlinkSync(filePath); // Cleanup file
    res.json({ status: 'success', inserted, updated, skipped });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/companies', async (req, res) => {
  try {
    const {page=1} = req.query;
    const companies = await Company.find().limit(10).skip((parseInt(page) - 1) * 10);
    res.status(200).json({ status: 'success', data: companies });
  } catch (error) {
    console.error('Error fetching companies:', error.message);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
});

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, '/frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});