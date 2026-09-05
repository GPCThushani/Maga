import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Application } from '../models/Application';
import { User } from '../models/User';
import { Opportunity } from '../models/Opportunity';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

interface NormalizedJob {
  _id: string;
  company: string;
  role: string;
  location: string;
  workType: string;
  url: string;
  requirements: string[];
  salary?: string;
  isLocal: boolean;
  source: string;
  publishedAt: string;
  employmentType: string;
  experienceLevel: string;
  description?: string;
}

/* =========================================================
   CANONICAL SKILL NORMALIZATION DICTIONARY
========================================================= */

const CANONICAL_SKILLS: Record<string, string> = {
  react: 'React',
  'react.js': 'React',
  reactjs: 'React',
  node: 'Node.js',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  'node js': 'Node.js',
  express: 'Express',
  'express.js': 'Express',
  expressjs: 'Express',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  sql: 'SQL',
  mssql: 'SQL',
  'ms sql': 'SQL',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  'postgres db': 'PostgreSQL',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  aws: 'AWS',
  azure: 'Azure',
  git: 'Git',
  github: 'GitHub',
  'ci/cd': 'CI/CD',
  cicd: 'CI/CD',
  html: 'HTML',
  css: 'CSS',
  'tailwind css': 'Tailwind CSS',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  redux: 'Redux',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  python: 'Python',
  java: 'Java',
  'c#': 'C#',
  '.net': '.NET',
  dotnet: '.NET',
  selenium: 'Selenium',
  postman: 'Postman',
  jira: 'Jira',
  figma: 'Figma',
  flutter: 'Flutter',
  'react native': 'React Native',
  pandas: 'Pandas',
  powerbi: 'PowerBI',
  'power bi': 'PowerBI',
};

const canonicalizeSkill = (raw: string): string => {
  const clean = raw.trim().toLowerCase();
  return CANONICAL_SKILLS[clean] || raw.trim();
};

/* =========================================================
   SEARCH CONFIGURATION & HELPERS
========================================================= */

const SEARCH_ALIASES: Record<string, string[]> = {
  intern: ['intern', 'internship', 'trainee', 'student', 'graduate', 'entry level', 'entry-level', 'junior'],
  frontend: ['frontend', 'front-end', 'front end', 'react', 'reactjs', 'vue', 'angular'],
  backend: ['backend', 'back-end', 'back end', 'node', 'nodejs', 'express', 'java', 'spring', 'python', 'django', '.net'],
  fullstack: ['fullstack', 'full-stack', 'full stack'],
  qa: ['qa', 'quality assurance', 'software tester', 'test engineer', 'testing'],
  data: ['data analyst', 'data engineer', 'data scientist', 'analytics'],
  design: ['ui designer', 'ux designer', 'ui/ux', 'product designer'],
  devops: ['devops', 'cloud engineer', 'sre', 'site reliability'],
};

const SENIOR_KEYWORDS = [
  'senior', 'sr.', 'sr ', 'lead', 'principal', 'staff', 'architect',
  'director', 'vp', 'vice president', 'head of', 'manager', 'chief',
];

interface CacheEntry {
  expiresAt: number;
  jobs: NormalizedJob[];
}

const jobCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

const normalizeText = (value: unknown): string => {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanHtml = (html: unknown): string => {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

const uniqueStrings = (items: unknown[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const value = String(item || '').trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
};

const getSearchTerms = (term: string): string[] => {
  const normalized = normalizeText(term);
  if (!normalized) return [];

  const aliasKey = Object.keys(SEARCH_ALIASES).find((key) => {
    return key === normalized || (SEARCH_ALIASES[key] && SEARCH_ALIASES[key].includes(normalized));
  });

  if (aliasKey) {
    return uniqueStrings([normalized, ...SEARCH_ALIASES[aliasKey]]);
  }

  return [normalized];
};

const getExternalSearchTerm = (term: string): string => {
  const normalized = normalizeText(term);
  if (!normalized) return '';

  for (const [key, values] of Object.entries(SEARCH_ALIASES)) {
    if (key === normalized || values.includes(normalized)) {
      return values[0];
    }
  }

  return normalized;
};

const isInternshipRole = (role: string, employmentType?: string): boolean => {
  const text = normalizeText(`${role} ${employmentType || ''}`);
  return /intern|internship|trainee|graduate|student|entry[- ]level|junior/.test(text);
};

const isSeniorRole = (role: string, level?: string): boolean => {
  const text = normalizeText(`${role} ${level || ''}`);
  return SENIOR_KEYWORDS.some((keyword) => text.includes(normalizeText(keyword)));
};

const getExperiencePriority = (job: NormalizedJob): number => {
  if (isInternshipRole(job.role, job.employmentType)) return 0;

  const text = normalizeText(`${job.role} ${job.experienceLevel}`);
  if (
    text.includes('trainee') ||
    text.includes('graduate') ||
    text.includes('entry') ||
    text.includes('junior') ||
    text.includes('associate')
  ) {
    return 1;
  }

  if (isSeniorRole(job.role, job.experienceLevel)) return 3;

  return 2;
};

const isRelevantForSearch = (job: NormalizedJob, searchTerms: string[]): boolean => {
  if (!searchTerms.length) return true;

  const searchableText = normalizeText(
    [
      job.role,
      job.company,
      job.location,
      job.workType,
      job.employmentType,
      ...job.requirements,
    ].join(' ')
  );

  return searchTerms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(searchableText);
  });
};

const getEmploymentType = (values: unknown): string => {
  const text = Array.isArray(values) ? values.join(' ').toLowerCase() : normalizeText(values);

  if (text.includes('intern') || text.includes('trainee')) return 'Internship';
  if (text.includes('full') || text.includes('permanent')) return 'Full-time';
  if (text.includes('part')) return 'Part-time';
  if (text.includes('contract')) return 'Contract';
  if (text.includes('freelance')) return 'Freelance';

  return 'Not specified';
};

const formatSalary = (min: unknown, max: unknown, currency: unknown, period: unknown): string | undefined => {
  const minimum = Number(min);
  const maximum = Number(max);

  if (!minimum && !maximum) return undefined;

  const currencyValue = String(currency || '').toUpperCase();
  const periodValue = String(period || '');

  if (minimum && maximum) {
    return `${currencyValue} ${minimum.toLocaleString()} - ${maximum.toLocaleString()}${
      periodValue ? ` / ${periodValue}` : ''
    }`;
  }

  const value = minimum || maximum;
  return `${currencyValue} ${value.toLocaleString()}${periodValue ? ` / ${periodValue}` : ''}`;
};

const getPublicationTime = (value: unknown): number => {
  if (!value) return 0;
  const numeric = Number(value);

  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric < 100000000000 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const safeFetch = async (url: string, timeoutMs = 8000): Promise<any | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CareerTrack/1.0',
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/* =========================================================
   DASHBOARD OVERVIEW & APPLICATION ANALYTICS
========================================================= */

export const getDashboardOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawUserId = req.userId || req.user?.id || req.user?._id;

    if (!rawUserId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(String(rawUserId));
    const user = await User.findById(userId).select('name skills targetRole');
    const userSkillsSet = new Set((user?.skills || []).map((s: string) => canonicalizeSkill(s).toLowerCase()));

    // 1. Funnel Pipeline Stage Counts
    const stageCounts = await Application.aggregate([
      { $match: { userId } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    const pipeline: Record<string, number> = {
      Saved: 0,
      Applied: 0,
      Assessment: 0,
      Interview: 0,
      Decision: 0,
    };

    stageCounts.forEach((item) => {
      if (pipeline[item._id] !== undefined) {
        pipeline[item._id] = item.count;
      }
    });

    // 2. Application Status / Outcome Counts
    const statusCounts = await Application.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const outcomes: Record<string, number> = {
      Active: 0,
      Offer: 0,
      Rejected: 0,
      Ghosted: 0,
    };

    statusCounts.forEach((item) => {
      const statusKey = item._id || 'Active';
      if (outcomes[statusKey] !== undefined) {
        outcomes[statusKey] = item.count;
      } else {
        outcomes.Active += item.count;
      }
    });

    // Offers strictly sourced from status === 'Offer', not stage === 'Decision'
    const actualOffersCount = outcomes.Offer;

    // 3. Stale Applications Count (>14 days without updates)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const staleCount = await Application.countDocuments({
      userId,
      stage: { $in: ['Applied', 'Assessment', 'Interview'] },
      updatedAt: { $lte: fourteenDaysAgo },
    });

    // 4. In-Demand Skills: Deduplicated per application before counting
    const appsWithReqs = await Application.find({
      userId,
      requirements: { $exists: true, $not: { $size: 0 } },
    }).select('requirements').lean();

    const jobsWithReqsCount = appsWithReqs.length;
    const skillCountsMap = new Map<string, number>();

    appsWithReqs.forEach((app) => {
      if (Array.isArray(app.requirements)) {
        const uniqueAppSkills = new Set<string>();
        app.requirements.forEach((reqStr) => {
          if (typeof reqStr === 'string' && reqStr.trim()) {
            uniqueAppSkills.add(canonicalizeSkill(reqStr));
          }
        });

        uniqueAppSkills.forEach((skill) => {
          skillCountsMap.set(skill, (skillCountsMap.get(skill) || 0) + 1);
        });
      }
    });

    const sortedSkills = Array.from(skillCountsMap.entries())
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: jobsWithReqsCount > 0 ? Math.round((count / jobsWithReqsCount) * 100) : 0,
        inProfile: userSkillsSet.has(skill.toLowerCase()),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 5. Explicit Funnel Quantities: Tracked vs Submitted
    const savedOpportunities = pipeline.Saved;
    const submittedApplications =
      pipeline.Applied + pipeline.Assessment + pipeline.Interview + pipeline.Decision;
    const totalTracked = savedOpportunities + submittedApplications;

    // 6. Upcoming Deadlines
    const upcomingRaw = await Application.find({
      userId,
      $or: [
        { 'deadlines.date': { $gte: new Date() } },
        { deadline: { $gte: new Date() } },
      ],
    })
      .limit(10)
      .select('company role stage deadline deadlines')
      .lean();

    const deadlines = upcomingRaw
      .map((app: any) => {
        const rawDate =
          app.deadline ||
          (Array.isArray(app.deadlines) && app.deadlines.length > 0 ? app.deadlines[0].date : null);

        if (!rawDate || new Date(rawDate) < new Date()) return null;

        return {
          id: app._id.toString(),
          role: app.role || 'Opportunity',
          company: app.company || 'Tech Company',
          type: app.stage === 'Interview' ? 'Technical Interview' : 'Application Deadline',
          date: new Date(rawDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          timestamp: new Date(rawDate).getTime(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 5)
      .map(({ timestamp, ...rest }) => rest);

    res.status(200).json({
      user: {
        name: user?.name,
        targetRole: user?.targetRole,
      },
      funnel: {
        totalTracked,
        savedOpportunities,
        submittedApplications,
        assessments: pipeline.Assessment,
        interviews: pipeline.Interview,
        offers: actualOffersCount,
      },
      outcomes,
      staleCount,
      topRequestedSkills: sortedSkills,
      deadlines,
    });
  } catch (error: any) {
    console.error('Overview analytics error:', error);
    res.status(500).json({
      message: 'Error retrieving application analytics',
      error: error.message,
    });
  }
};

/* =========================================================
   LIVE MARKET OPPORTUNITIES
========================================================= */

export const getLiveMarketJobs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawSearch = String(req.query.search || '');
    const searchTerm = normalizeText(rawSearch);
    const region = normalizeText(req.query.region || 'all');
    const employmentFilter = normalizeText(req.query.type || 'all');

    const searchTerms = getSearchTerms(searchTerm);
    const cacheKey = `${searchTerm}|${region}|${employmentFilter}`;

    const cached = jobCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.status(200).json({
        jobs: cached.jobs,
        meta: {
          search: searchTerm,
          region,
          type: employmentFilter,
          count: cached.jobs.length,
          cached: true,
          sources: ['CareerTrack', 'Jobicy', 'Remotive', 'Arbeitnow'],
          fetchedAt: new Date().toISOString(),
        },
      });
      return;
    }

    const allJobs: NormalizedJob[] = [];

    /* 1. Local Opportunities */
    try {
      const localJobs = await Opportunity.find({ isLocal: true })
        .sort({ createdAt: -1 })
        .limit(50);

      for (const job of localJobs) {
        const normalized: NormalizedJob = {
          _id: `local-${job._id.toString()}`,
          company: job.company,
          role: job.role,
          location: job.location || 'Sri Lanka',
          workType: job.workType || 'Hybrid',
          url: job.url,
          requirements: Array.isArray(job.requirements) ? uniqueStrings(job.requirements) : [],
          salary: job.salary || undefined,
          isLocal: true,
          source: 'CareerTrack',
          publishedAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
          employmentType: isInternshipRole(job.role) ? 'Internship' : 'Full-time',
          experienceLevel: isInternshipRole(job.role) ? 'Entry-level' : 'Not specified',
        };

        if (!searchTerm || isRelevantForSearch(normalized, searchTerms)) {
          allJobs.push(normalized);
        }
      }
    } catch (error: any) {
      console.warn('Local opportunity query skipped:', error.message);
    }

    /* 2. External Search Parameters & Fetch */
    const externalSearch = getExternalSearchTerm(searchTerm);

    const jobicyUrl = externalSearch
      ? `https://jobicy.com/api/v2/remote-jobs?count=100&tag=${encodeURIComponent(externalSearch)}`
      : 'https://jobicy.com/api/v2/remote-jobs?count=100';

    const remotiveUrl = externalSearch
      ? `https://remotive.com/api/remote-jobs?limit=50&search=${encodeURIComponent(externalSearch)}`
      : 'https://remotive.com/api/remote-jobs?limit=50';

    const arbeitnowUrl = 'https://www.arbeitnow.com/api/job-board-api?page=1';

    const [jobicyData, remotiveData, arbeitnowData] = await Promise.all([
      safeFetch(jobicyUrl),
      safeFetch(remotiveUrl),
      safeFetch(arbeitnowUrl),
    ]);

    /* 3. Parse Jobicy */
    if (Array.isArray(jobicyData?.jobs)) {
      for (const job of jobicyData.jobs) {
        const description = cleanHtml(job.jobDescription || job.jobExcerpt || '');
        const requirements = uniqueStrings([
          ...(Array.isArray(job.jobIndustry) ? job.jobIndustry : []),
          ...(Array.isArray(job.jobType) ? job.jobType : []),
        ]).slice(0, 8);

        const normalized: NormalizedJob = {
          _id: `jobicy-${job.id}`,
          company: job.companyName || 'Tech Company',
          role: job.jobTitle || 'Opportunity',
          location: job.jobGeo || 'Remote',
          workType: 'Remote',
          url: job.url || '',
          requirements,
          salary: formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod),
          isLocal: false,
          source: 'Jobicy',
          publishedAt: job.pubDate ? new Date(job.pubDate).toISOString() : new Date().toISOString(),
          employmentType: getEmploymentType(job.jobType),
          experienceLevel: job.jobLevel || 'Not specified',
          description,
        };

        if (normalized.url && (!searchTerm || isRelevantForSearch(normalized, searchTerms))) {
          allJobs.push(normalized);
        }
      }
    }

    /* 4. Parse Remotive */
    if (Array.isArray(remotiveData?.jobs)) {
      for (const job of remotiveData.jobs) {
        const description = cleanHtml(job.description || '');
        const tags = Array.isArray(job.tags) ? job.tags : [];

        const normalized: NormalizedJob = {
          _id: `remotive-${job.id}`,
          company: job.company_name || 'Tech Company',
          role: job.title || 'Opportunity',
          location: job.candidate_required_location || 'Worldwide',
          workType: 'Remote',
          url: job.url || '',
          requirements: uniqueStrings(tags).slice(0, 8),
          salary: job.salary || undefined,
          isLocal: false,
          source: 'Remotive',
          publishedAt: job.publication_date ? new Date(job.publication_date).toISOString() : new Date().toISOString(),
          employmentType: getEmploymentType(job.job_type),
          experienceLevel: 'Not specified',
          description,
        };

        if (normalized.url && (!searchTerm || isRelevantForSearch(normalized, searchTerms))) {
          allJobs.push(normalized);
        }
      }
    }

    /* 5. Parse Arbeitnow */
    if (Array.isArray(arbeitnowData?.data)) {
      for (const job of arbeitnowData.data) {
        const description = cleanHtml(job.description || '');
        const tags = Array.isArray(job.tags) ? job.tags : [];

        const normalized: NormalizedJob = {
          _id: `arbeitnow-${job.slug || job.id}`,
          company: job.company_name || 'Company',
          role: job.title || 'Opportunity',
          location: job.location || (job.remote ? 'Remote' : 'Europe'),
          workType: job.remote ? 'Remote' : 'On-site',
          url: job.url || '',
          requirements: uniqueStrings(tags).slice(0, 8),
          salary: undefined,
          isLocal: false,
          source: 'Arbeitnow',
          publishedAt: job.created_at ? new Date(getPublicationTime(job.created_at)).toISOString() : new Date().toISOString(),
          employmentType: getEmploymentType(job.job_types),
          experienceLevel: tags.find((tag: string) => /junior|entry|intern|trainee|graduate/i.test(tag)) || 'Not specified',
          description,
        };

        if (normalized.url && (!searchTerm || isRelevantForSearch(normalized, searchTerms))) {
          allJobs.push(normalized);
        }
      }
    }

    /* 6. Region & Employment Type Filters */
    let filteredJobs = allJobs.filter((job) => {
      if (region === 'sri-lanka') return job.isLocal;
      if (region === 'remote') return !job.isLocal && normalizeText(job.workType) === 'remote';
      return true;
    });

    if (employmentFilter !== 'all') {
      filteredJobs = filteredJobs.filter((job) => {
        const type = normalizeText(job.employmentType);
        if (employmentFilter === 'internship') {
          return type.includes('intern') || isInternshipRole(job.role, job.employmentType);
        }
        if (employmentFilter === 'full-time') {
          return type.includes('full') || (!isInternshipRole(job.role, job.employmentType) && type === 'not specified');
        }
        return true;
      });
    }

    /* 7. Deduplication & Priority Sorting */
    const uniqueJobs = new Map<string, NormalizedJob>();
    for (const job of filteredJobs) {
      const normalizedUrl = job.url
        ? job.url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase()
        : '';
      const fallbackKey = `${normalizeText(job.company)}-${normalizeText(job.role)}`;
      const key = normalizedUrl || fallbackKey;
      if (!uniqueJobs.has(key)) uniqueJobs.set(key, job);
    }

    const finalJobs = Array.from(uniqueJobs.values())
      .sort((a, b) => {
        const priorityA = getExperiencePriority(a);
        const priorityB = getExperiencePriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return getPublicationTime(b.publishedAt) - getPublicationTime(a.publishedAt);
      })
      .slice(0, 75);

    jobCache.set(cacheKey, {
      jobs: finalJobs,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    for (const [key, entry] of jobCache) {
      if (entry.expiresAt <= Date.now()) jobCache.delete(key);
    }

    res.status(200).json({
      jobs: finalJobs,
      meta: {
        search: searchTerm,
        region,
        type: employmentFilter,
        count: finalJobs.length,
        sources: ['CareerTrack', 'Jobicy', 'Remotive', 'Arbeitnow'],
        cached: false,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error serving market opportunities:', error);
    res.status(200).json({
      jobs: [],
      meta: {
        search: String(req.query.search || ''),
        count: 0,
        sources: [],
        error: 'Some job sources are temporarily unavailable.',
        fetchedAt: new Date().toISOString(),
      },
    });
  }
};