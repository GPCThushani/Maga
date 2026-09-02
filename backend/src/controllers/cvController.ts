import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

// CommonJS require avoids TypeScript call signature conflicts with pdf-parse
const pdfParse = require('pdf-parse');

// POST /api/v1/cv/upload
export const uploadAndParseCV = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please attach a PDF file.' });
      return;
    }

    // Explicitly parse the buffer and assign to pdfData
    const pdfData: { text: string } = await pdfParse(req.file.buffer);
    const extractedText = (pdfData?.text || '').trim();

    if (!extractedText) {
      res.status(422).json({
        message: 'Could not extract readable text from this PDF. Please ensure it is not a scanned image.',
      });
      return;
    }

    // Save extracted text and original file name to user profile
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.cvRawText = extractedText;
    user.cvUrl = req.file.originalname;
    await user.save();

    res.status(200).json({
      message: 'CV uploaded and text extracted successfully.',
      fileName: req.file.originalname,
      characterCount: extractedText.length,
      sampleText: extractedText.substring(0, 200) + '...',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to process CV file.',
      error: error.message || error,
    });
  }
};