import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { calculateSkillMatch } from '../services/matchingService';

// POST /api/v1/analysis/match
export const analyzeJobFit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { applicationId, requiredSkills, jobRole } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    let skillsToEvaluate: string[] = requiredSkills || [];

    // If an applicationId was passed, look up its requirements directly
    if (applicationId) {
      const application = await Application.findOne({
        _id: applicationId,
        userId: req.userId,
      });
      if (application && application.requirements?.length > 0) {
        skillsToEvaluate = application.requirements;
      }
    }

    if (!skillsToEvaluate || skillsToEvaluate.length === 0) {
      res.status(400).json({
        message: 'Please provide required skills or an application with requirements to analyze.',
      });
      return;
    }

    // 1. Deterministic Calculation (Node.js engine)
    const matchAnalysis = calculateSkillMatch(
      user.skills || [],
      user.cvRawText || '',
      skillsToEvaluate
    );

    // 2. Pragmatic Advice Synthesis
    const recommendations: string[] = [];
    if (matchAnalysis.missingSkills.length > 0) {
      recommendations.push(
        `Highlight experience or completed projects involving ${matchAnalysis.missingSkills.slice(0, 2).join(' and ')} to strengthen fit.`
      );
      recommendations.push(
        `Consider reviewing core fundamentals for ${matchAnalysis.missingSkills[0]} before technical assessments.`
      );
    } else {
      recommendations.push(
        'Your profile covers all primary stated requirements. Focus on interview storytelling around your practical projects.'
      );
    }

    // Save matchScore back to the application if linked
    if (applicationId) {
      await Application.updateOne(
        { _id: applicationId, userId: req.userId },
        { matchScore: matchAnalysis.matchScore }
      );
    }

    res.status(200).json({
      targetRole: jobRole || user.targetRole || 'Target Role',
      matchScore: matchAnalysis.matchScore,
      matchedRequirements: `${matchAnalysis.matchedSkills.length}/${matchAnalysis.totalRequirements}`,
      matchedSkills: matchAnalysis.matchedSkills,
      missingSkills: matchAnalysis.missingSkills,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing job match.', error });
  }
};