import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Application } from '../models/Application';
import { User } from '../models/User';

// GET /api/v1/analytics/overview
export const getDashboardOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    // Run parallel query: fetch user profile details + aggregated application pipeline stats
    const [user, pipelineData] = await Promise.all([
      User.findById(req.userId).select('name skills targetRole university degree'),
      Application.aggregate([
        { $match: { userId: userObjectId } },
        {
          $facet: {
            // 1. Stage Counts Breakdown
            stageCounts: [
              {
                $group: {
                  _id: '$stage',
                  count: { $sum: 1 },
                },
              },
            ],
            // 2. High-level Overview Counts
            totalApplications: [{ $count: 'count' }],
            // 3. Upcoming Uncompleted Deadlines (Sorted chronologically)
            upcomingDeadlines: [
              { $unwind: '$deadlines' },
              {
                $match: {
                  'deadlines.completed': false,
                  'deadlines.date': { $gte: new Date() },
                },
              },
              { $sort: { 'deadlines.date': 1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  company: 1,
                  role: 1,
                  title: '$deadlines.title',
                  date: '$deadlines.date',
                },
              },
            ],
            // 4. Most In-Demand Skills Extracted from User's Applied Opportunities
            topRequestedSkills: [
              { $unwind: '$requirements' },
              {
                $group: {
                  _id: '$requirements',
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 8 },
            ],
          },
        },
      ]),
    ]);

    const facet = pipelineData[0];

    // Format stages into a predictable key-value object
    const stageSummary: Record<string, number> = {
      Saved: 0,
      Applied: 0,
      Assessment: 0,
      Interview: 0,
      Decision: 0,
    };

    facet.stageCounts.forEach((item: { _id: string; count: number }) => {
      if (stageSummary[item._id] !== undefined) {
        stageSummary[item._id] = item.count;
      }
    });

    const totalApplications = facet.totalApplications[0]?.count || 0;
    const activeInterviews = stageSummary['Interview'] || 0;
    const activeAssessments = stageSummary['Assessment'] || 0;

    res.status(200).json({
      user: {
        name: user?.name || 'Student',
        targetRole: user?.targetRole || 'Full Stack Developer Intern',
      },
      metrics: {
        totalApplications,
        activeInterviews,
        activeAssessments,
      },
      pipeline: stageSummary,
      upcomingDeadlines: facet.upcomingDeadlines,
      topRequestedSkills: facet.topRequestedSkills.map((s: { _id: string; count: number }) => ({
        skill: s._id,
        count: s.count,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error aggregating dashboard metrics.', error });
  }
};