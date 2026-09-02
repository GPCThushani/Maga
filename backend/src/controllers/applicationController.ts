import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Application } from '../models/Application';

// GET /api/v1/applications
export const getApplications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { stage, search } = req.query;
    const query: any = { userId: req.userId };

    if (stage) {
      query.stage = stage;
    }

    if (search) {
      query.$or = [
        { company: { $regex: String(search), $options: 'i' } },
        { role: { $regex: String(search), $options: 'i' } },
      ];
    }

    const applications = await Application.find(query).sort({ updatedAt: -1 });
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving applications.', error });
  }
};

// POST /api/v1/applications
export const createApplication = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      company,
      role,
      location,
      workType,
      source,
      stage,
      deadlines,
      jobDescription,
      requirements,
      notes,
    } = req.body;

    if (!company || !role) {
      res.status(400).json({ message: 'Company and Role are required.' });
      return;
    }

    const application = await Application.create({
      userId: req.userId,
      company,
      role,
      location,
      workType,
      source,
      stage: stage || 'Saved',
      deadlines: deadlines || [],
      jobDescription,
      requirements: requirements || [],
      notes,
      appliedDate: stage === 'Applied' ? new Date() : undefined,
    });

    res.status(201).json({ message: 'Application created successfully.', application });
  } catch (error) {
    res.status(500).json({ message: 'Error creating application.', error });
  }
};

// GET /api/v1/applications/:id
export const getApplicationById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application details.', error });
  }
};

// PATCH /api/v1/applications/:id/stage (Optimized for Kanban Drag-and-Drop)
export const updateApplicationStage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { stage, decisionStatus } = req.body;

    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    application.stage = stage;
    if (decisionStatus) application.decisionStatus = decisionStatus;
    if (stage === 'Applied' && !application.appliedDate) {
      application.appliedDate = new Date();
    }

    await application.save();

    res.status(200).json({ message: 'Stage updated.', application });
  } catch (error) {
    res.status(500).json({ message: 'Error updating application stage.', error });
  }
};

// DELETE /api/v1/applications/:id
export const deleteApplication = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    res.status(200).json({ message: 'Application removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting application.', error });
  }
};