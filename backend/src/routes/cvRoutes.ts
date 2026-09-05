import express, { Response } from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.pdf') && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are permitted.'));
    }
    cb(null, true);
  },
});

interface ATSFeedback {
  score: number;
  extractedSkills: string[];
  detectedRole?: string;
  strengths: string[];
  improvements: string[];
}

const COMMON_SKILLS = [
  'React', 'Node.js', 'Express', 'TypeScript', 'JavaScript', 'Python', 'Java',
  'C#', '.NET', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS',
  'Git', 'CI/CD', 'Selenium', 'Postman', 'Jira', 'Agile', 'HTML', 'CSS', 'Tailwind CSS',
  'Tailwind', 'Manual Testing', 'Quality Assurance', 'UML', 'Data Structures',
  'Algorithms', 'REST APIs', 'REST', 'GraphQL', 'Linux', 'Figma', 'Next.js', 'Redux'
];

const ACTION_VERBS = [
  'developed', 'built', 'created', 'implemented', 'designed', 'optimized',
  'architected', 'spearheaded', 'managed', 'automated', 'deployed', 'collaborated',
  'engineered', 'integrated', 'delivered', 'tested', 'maintained', 'resolved', 'led'
];

// Clean text extraction via pdf2json stream parser
const parsePdfBuffer = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1 specifies raw unformatted text content extraction
    const parser = new (PDFParser as any)(null, 1);

    parser.on('pdfParser_dataError', (errData: any) => {
      reject(errData.parserError || errData);
    });

    parser.on('pdfParser_dataReady', () => {
      try {
        const text = parser.getRawTextContent();
        resolve(text || '');
      } catch (err) {
        reject(err);
      }
    });

    parser.parseBuffer(buffer);
  });
};

router.post(
  '/upload',
  protect,
  upload.single('cv'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ message: 'No valid PDF file uploaded.' });
        return;
      }

      // 1. Fully extract uncompressed plain text from the PDF
      const rawText = await parsePdfBuffer(req.file.buffer);
      const text = rawText.toLowerCase();

      // 2. ATS Score Calculation
      let score = 40;
      const strengths: string[] = [];
      const improvements: string[] = [];

      // Check Key Sections
      const hasEducation = /education|academic|qualifications|university|degree/i.test(text);
      const hasExperience = /experience|projects|work history|employment|practical/i.test(text);
      const hasSkills = /skills|technical proficiencies|technologies|tools|competencies/i.test(text);

      if (hasEducation) {
        score += 10;
      } else {
        improvements.push('Include a dedicated "Education" section title.');
      }

      if (hasExperience) {
        score += 15;
      } else {
        improvements.push('Include a dedicated "Projects" or "Work Experience" section.');
      }

      if (hasSkills) {
        score += 10;
      } else {
        improvements.push('Include a dedicated "Technical Skills" heading.');
      }

      if (hasEducation && hasExperience && hasSkills) {
        strengths.push('Key structural sections (Education, Projects, and Skills) clearly identified.');
      }

      // Check Contact Details
      const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText);
      const hasLinks = /linkedin|github|portfolio|gitlab/i.test(text);

      if (hasEmail && hasLinks) {
        score += 15;
        strengths.push('Contact info with active professional links (GitHub / LinkedIn) identified.');
      } else if (hasEmail) {
        score += 5;
        improvements.push('Add an online portfolio, GitHub, or LinkedIn profile link near your contact details.');
      } else {
        improvements.push('Ensure your email address is visible and written in plain text.');
      }

      // Check Action Verbs
      const foundActionVerbs = ACTION_VERBS.filter((verb) => text.includes(verb));
      if (foundActionVerbs.length >= 3) {
        score += 10;
        strengths.push(`Uses active engineering action verbs (${foundActionVerbs.slice(0, 4).join(', ')}).`);
      } else {
        improvements.push('Start bullet points with action verbs like "Engineered", "Implemented", or "Automated".');
      }

      // Skill Extraction
      const extractedSkills = COMMON_SKILLS.filter((skill) => {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i').test(text);
      });

      if (extractedSkills.length >= 5) {
        score += 10;
        strengths.push(`Identified ${extractedSkills.length} industry-standard technical skills.`);
      } else {
        improvements.push('List more industry tools and frameworks directly in your Skills section.');
      }

      const feedback: ATSFeedback = {
        score: Math.min(Math.max(score, 25), 100),
        extractedSkills,
        strengths,
        improvements,
      };

      // 3. Save updates to user document
      await User.findByIdAndUpdate(req.userId, {
        cvUrl: req.file.originalname,
        $addToSet: { skills: { $each: extractedSkills } },
      });

      res.status(200).json({
        message: 'CV analyzed successfully',
        fileName: req.file.originalname,
        feedback,
      });
    } catch (err: any) {
      console.error('ATS Parse error:', err);
      res.status(500).json({ message: 'Failed to parse resume document', error: err.message });
    }
  }
);

export default router;