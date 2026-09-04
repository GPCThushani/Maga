import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Opportunity } from '../models/Opportunity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedJobs = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found');
    await mongoose.connect(mongoUri);

    await Opportunity.deleteMany({ isLocal: true });

    await Opportunity.create([
      {
        company: 'Sysco LABS Sri Lanka',
        role: 'Associate Software Engineer Intern',
        location: 'Colombo, Sri Lanka',
        workType: 'Hybrid',
        url: 'https://syscolabs.lk/careers',
        requirements: ['React', 'Node.js', 'AWS', 'TypeScript'],
        salary: 'LKR Stipend',
        isLocal: true,
      },
      {
        company: 'WSO2',
        role: 'Software Engineering Intern (Cloud & Middleware)',
        location: 'Colombo, Sri Lanka',
        workType: 'Hybrid',
        url: 'https://wso2.com/careers',
        requirements: ['Java', 'Docker', 'Kubernetes', 'Go'],
        salary: 'LKR Stipend',
        isLocal: true,
      },
      {
        company: 'Virtusa',
        role: 'Full Stack Engineering Intern',
        location: 'Colombo, Sri Lanka',
        workType: 'On-site',
        url: 'https://www.virtusa.com/careers',
        requirements: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
        salary: 'LKR Stipend',
        isLocal: true,
      },
      {
        company: 'IFS',
        role: 'Software Engineering Intern',
        location: 'Colombo, Sri Lanka',
        workType: 'Hybrid',
        url: 'https://www.ifs.com/about/careers',
        requirements: ['C#', '.NET Core', 'SQL Server', 'Angular'],
        salary: 'LKR Stipend',
        isLocal: true,
      },
      {
        company: '99x',
        role: 'Trainee Software Engineer',
        location: 'Colombo, Sri Lanka',
        workType: 'Hybrid',
        url: 'https://99x.io/careers',
        requirements: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        salary: 'LKR Stipend',
        isLocal: true,
      },
    ]);

    console.log('Sri Lankan opportunities saved to MongoDB Atlas');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedJobs();