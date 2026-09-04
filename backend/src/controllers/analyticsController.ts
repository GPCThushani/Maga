import { Request, Response } from 'express';
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
   SEARCH CONFIGURATION
========================================================= */

const SEARCH_ALIASES: Record<string, string[]> = {
  intern: [
    'intern',
    'internship',
    'trainee',
    'student',
    'graduate',
    'entry level',
    'entry-level',
    'junior',
  ],
  frontend: [
    'frontend',
    'front-end',
    'front end',
    'react',
    'reactjs',
    'angular',
    'vue',
    'ui developer',
    'web developer',
  ],
  backend: [
    'backend',
    'back-end',
    'back end',
    'node',
    'nodejs',
    'express',
    'java',
    'spring',
    'python',
    'django',
    '.net',
    'c#',
  ],
  fullstack: [
    'fullstack',
    'full-stack',
    'full stack',
    'software engineer',
    'software developer',
    'web developer',
  ],
  software: [
    'software engineer',
    'software developer',
    'developer',
    'programmer',
  ],
  qa: [
    'qa',
    'quality assurance',
    'quality analyst',
    'quality engineer',
    'software tester',
    'test engineer',
    'testing',
    'tester',
  ],
  data: [
    'data',
    'data analyst',
    'data engineer',
    'data scientist',
    'analytics',
    'sql',
  ],
  design: [
    'design',
    'designer',
    'ui design',
    'ux design',
    'ui/ux',
    'product designer',
    'graphic designer',
  ],
  content: [
    'content',
    'content writer',
    'technical writer',
    'copywriter',
    'copywriting',
    'editor',
    'writing',
  ],
  marketing: [
    'marketing',
    'digital marketing',
    'seo',
    'growth marketing',
  ],
  business: [
    'business analyst',
    'business analysis',
    'ba',
    'product analyst',
    'product management',
  ],
  devops: [
    'devops',
    'cloud',
    'aws',
    'azure',
    'docker',
    'kubernetes',
    'sre',
  ],
};

const SENIOR_KEYWORDS = [
  'senior',
  'sr.',
  'sr ',
  'lead',
  'principal',
  'staff',
  'architect',
  'director',
  'vp',
  'vice president',
  'head of',
  'manager',
  'chief',
];

/* =========================================================
   CACHE
========================================================= */

interface CacheEntry {
  expiresAt: number;
  jobs: NormalizedJob[];
}

const jobCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

/* =========================================================
   TEXT HELPERS
========================================================= */

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

/* =========================================================
   SEARCH HELPERS
========================================================= */

const getSearchTerms = (term: string): string[] => {
  const normalized = normalizeText(term);
  if (!normalized) return [];

  const compact = normalized.replace(/[^a-z0-9]+/g, '');

  const aliasKey = Object.keys(SEARCH_ALIASES).find((key) => {
    const normalizedKey = normalizeText(key);
    const compactKey = normalizedKey.replace(/[^a-z0-9]+/g, '');

    return (
      normalizedKey === normalized ||
      compactKey === compact ||
      SEARCH_ALIASES[key].some((alias) => {
        const normalizedAlias = normalizeText(alias);
        const compactAlias = normalizedAlias.replace(/[^a-z0-9]+/g, '');
        return normalizedAlias === normalized || compactAlias === compact;
      })
    );
  });

  if (aliasKey) {
    return uniqueStrings([normalized, ...SEARCH_ALIASES[aliasKey]]);
  }

  return [normalized];
};

const getExternalSearchTerm = (term: string): string => {
  const normalized = normalizeText(term);
  if (!normalized) return '';

  const compact = normalized.replace(/[^a-z0-9]+/g, '');
  const aliases = Object.entries(SEARCH_ALIASES);

  for (const [key, values] of aliases) {
    const keyCompact = key.replace(/[^a-z0-9]+/g, '');

    if (
      key === normalized ||
      keyCompact === compact ||
      values.some((value) => {
        const normalizedValue = normalizeText(value);
        const compactValue = normalizedValue.replace(/[^a-z0-9]+/g, '');
        return normalizedValue === normalized || compactValue === compact;
      })
    ) {
      return values[0];
    }
  }

  return normalized;
};

/* =========================================================
   JOB CLASSIFICATION
========================================================= */

const isInternshipRole = (role: string, employmentType?: string): boolean => {
  const text = normalizeText(`${role} ${employmentType || ''}`);
  return /intern|internship|trainee|graduate|student|entry[- ]level|junior/.test(text);
};

const isSeniorRole = (role: string, level?: string): boolean => {
  const text = normalizeText(`${role} ${level || ''}`);
  return SENIOR_KEYWORDS.some((keyword) => text.includes(normalizeText(keyword)));
};

const getExperiencePriority = (job: NormalizedJob): number => {
  if (isInternshipRole(job.role, job.employmentType)) {
    return 0;
  }

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

  if (isSeniorRole(job.role, job.experienceLevel)) {
    return 3;
  }

  return 2;
};

/* =========================================================
   SEARCH MATCHING
========================================================= */

const isRelevantForSearch = (job: NormalizedJob, searchTerms: string[]): boolean => {
  if (!searchTerms.length) return true;

  const searchableText = normalizeText(
    [
      job.role,
      job.company,
      job.location,
      job.workType,
      job.employmentType,
      job.experienceLevel,
      job.description,
      ...job.requirements,
    ].join(' ')
  );

  return searchTerms.some((term) => searchableText.includes(normalizeText(term)));
};

/* =========================================================
   EMPLOYMENT TYPE & FORMATTERS
========================================================= */

const getEmploymentType = (values: unknown): string => {
  const text = Array.isArray(values)
    ? values.join(' ').toLowerCase()
    : normalizeText(values);

  if (text.includes('intern') || text.includes('trainee')) return 'Internship';
  if (text.includes('full') || text.includes('permanent')) return 'Full-time';
  if (text.includes('part')) return 'Part-time';
  if (text.includes('contract')) return 'Contract';
  if (text.includes('freelance')) return 'Freelance';

  return 'Not specified';
};

const formatSalary = (
  min: unknown,
  max: unknown,
  currency: unknown,
  period: unknown
): string | undefined => {
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
  return `${currencyValue} ${value.toLocaleString()}${
    periodValue ? ` / ${periodValue}` : ''
  }`;
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

/* =========================================================
   SAFE FETCH
========================================================= */

const safeFetch = async (url: string, timeoutMs = 8000): Promise<any | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Maga-Career-Platform/1.0',
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
   DASHBOARD OVERVIEW
========================================================= */

export const getDashboardOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('name skills targetRole');
    const applications = await Application.find({ userId });

    const pipeline: Record<string, number> = {
      Saved: 0,
      Applied: 0,
      Assessment: 0,
      Interview: 0,
      Decision: 0,
    };

    applications.forEach((app: any) => {
      const stage = app.stage || 'Saved';
      if (pipeline[stage] !== undefined) {
        pipeline[stage] += 1;
      }
    });

    const metrics = {
      totalApplications: applications.filter((app: any) => app.stage !== 'Saved').length,
      activeInterviews: pipeline.Interview || 0,
      activeAssessments: pipeline.Assessment || 0,
    };

    const deadlines = applications
      .filter((app: any) => {
        const date =
          app.deadline ||
          (Array.isArray(app.deadlines) ? app.deadlines[0]?.date : undefined);
        return date && new Date(date) >= new Date();
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.deadline || a.deadlines?.[0]?.date).getTime();
        const dateB = new Date(b.deadline || b.deadlines?.[0]?.date).getTime();
        return dateA - dateB;
      })
      .slice(0, 5)
      .map((app: any) => ({
        id: app._id.toString(),
        role: app.role || 'Internship Role',
        company: app.company || 'Tech Company',
        type:
          app.stage === 'Interview'
            ? 'Technical Interview'
            : 'Application Deadline',
        date: new Date(app.deadline || app.deadlines?.[0]?.date).toLocaleDateString(
          'en-US',
          { month: 'short', day: 'numeric' }
        ),
      }));

    let careerInsight = null;
    const userSkills: string[] = user?.skills || [];
    const benchmarkSkills = [
      'React',
      'Node.js',
      'MongoDB',
      'TypeScript',
      'Docker',
      'Git',
    ];

    if (userSkills.length > 0) {
      const matched = userSkills.filter((skill: string) =>
        benchmarkSkills.some(
          (benchmark) => benchmark.toLowerCase() === skill.toLowerCase()
        )
      );

      const missing = benchmarkSkills.filter(
        (benchmark) =>
          !userSkills.some(
            (skill) => skill.toLowerCase() === benchmark.toLowerCase()
          )
      );

      const matchPercentage = Math.round(
        (matched.length / benchmarkSkills.length) * 100
      );

      careerInsight = {
        matchPercentage,
        targetRole: user?.targetRole || 'Full Stack Developer',
        matchedSkills: matched,
        missingSkills: missing,
      };
    }

    res.status(200).json({
      user: { name: user?.name },
      metrics,
      pipeline,
      deadlines,
      careerInsight,
    });
  } catch (error: any) {
    console.error('Overview analytics error:', error);
    res.status(500).json({
      message: 'Error retrieving overview data',
      error: error.message,
    });
  }
};

/* =========================================================
   LIVE / CURRENT MARKET OPPORTUNITIES
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
          sources: ['Maga', 'Jobicy', 'Remotive', 'Arbeitnow'],
          fetchedAt: new Date().toISOString(),
        },
      });
      return;
    }

    const allJobs: NormalizedJob[] = [];

    /* =====================================================
       1. MAGA LOCAL OPPORTUNITIES
    ===================================================== */
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
          requirements: Array.isArray(job.requirements)
            ? uniqueStrings(job.requirements)
            : [],
          salary: job.salary || undefined,
          isLocal: true,
          source: 'Maga',
          publishedAt: job.createdAt
            ? new Date(job.createdAt).toISOString()
            : new Date().toISOString(),
          employmentType: isInternshipRole(job.role) ? 'Internship' : 'Full-time',
          experienceLevel: isInternshipRole(job.role) ? 'Entry-level' : 'Not specified',
        };

        if (!searchTerm || isRelevantForSearch(normalized, searchTerms)) {
          allJobs.push(normalized);
        }
      }
    } catch (error: any) {
      console.warn('Maga local opportunity query skipped:', error.message);
    }

    /* =====================================================
       2. EXTERNAL SEARCH PARAMETERS & CONCURRENT FETCH
    ===================================================== */
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

    /* =====================================================
       3. PARSE JOBICY
    ===================================================== */
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
          salary: formatSalary(
            job.salaryMin,
            job.salaryMax,
            job.salaryCurrency,
            job.salaryPeriod
          ),
          isLocal: false,
          source: 'Jobicy',
          publishedAt: job.pubDate
            ? new Date(job.pubDate).toISOString()
            : new Date().toISOString(),
          employmentType: getEmploymentType(job.jobType),
          experienceLevel: job.jobLevel || 'Not specified',
          description,
        };

        if (
          normalized.url &&
          (!searchTerm || isRelevantForSearch(normalized, searchTerms))
        ) {
          allJobs.push(normalized);
        }
      }
    }

    /* =====================================================
       4. PARSE REMOTIVE
    ===================================================== */
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
          publishedAt: job.publication_date
            ? new Date(job.publication_date).toISOString()
            : new Date().toISOString(),
          employmentType: getEmploymentType(job.job_type),
          experienceLevel: 'Not specified',
          description,
        };

        if (
          normalized.url &&
          (!searchTerm || isRelevantForSearch(normalized, searchTerms))
        ) {
          allJobs.push(normalized);
        }
      }
    }

    /* =====================================================
       5. PARSE ARBEITNOW
    ===================================================== */
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
          publishedAt: job.created_at
            ? new Date(getPublicationTime(job.created_at)).toISOString()
            : new Date().toISOString(),
          employmentType: getEmploymentType(job.job_types),
          experienceLevel:
            tags.find((tag: string) =>
              /junior|entry|intern|trainee|graduate/i.test(tag)
            ) || 'Not specified',
          description,
        };

        if (
          normalized.url &&
          (!searchTerm || isRelevantForSearch(normalized, searchTerms))
        ) {
          allJobs.push(normalized);
        }
      }
    }

    /* =====================================================
       6. REGION FILTER
    ===================================================== */
    let filteredJobs = allJobs.filter((job) => {
      if (region === 'sri-lanka') return job.isLocal;
      if (region === 'remote') {
        return !job.isLocal && normalizeText(job.workType) === 'remote';
      }
      return true;
    });

    /* =====================================================
       7. EMPLOYMENT TYPE FILTER
    ===================================================== */
    if (employmentFilter !== 'all') {
      filteredJobs = filteredJobs.filter((job) => {
        const type = normalizeText(job.employmentType);

        if (employmentFilter === 'internship') {
          return (
            type.includes('intern') ||
            isInternshipRole(job.role, job.employmentType)
          );
        }

        if (employmentFilter === 'full-time') {
          return (
            type.includes('full') ||
            (!isInternshipRole(job.role, job.employmentType) &&
              type === 'not specified')
          );
        }

        return true;
      });
    }

    /* =====================================================
       8. DEDUPLICATION
    ===================================================== */
    const uniqueJobs = new Map<string, NormalizedJob>();

    for (const job of filteredJobs) {
      const normalizedUrl = job.url
        ? job.url
            .trim()
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .replace(/\/$/, '')
            .toLowerCase()
        : '';

      const fallbackKey = `${normalizeText(job.company)}-${normalizeText(job.role)}`;
      const key = normalizedUrl || fallbackKey;

      if (!uniqueJobs.has(key)) {
        uniqueJobs.set(key, job);
      }
    }

    /* =====================================================
       9. SORTING: INTERNSHIPS FIRST, THEN CHRONOLOGICAL
    ===================================================== */
    const finalJobs = Array.from(uniqueJobs.values())
      .sort((a, b) => {
        const priorityA = getExperiencePriority(a);
        const priorityB = getExperiencePriority(b);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return getPublicationTime(b.publishedAt) - getPublicationTime(a.publishedAt);
      })
      .slice(0, 75);

    /* =====================================================
       10. CACHE
    ===================================================== */
    jobCache.set(cacheKey, {
      jobs: finalJobs,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    for (const [key, entry] of jobCache) {
      if (entry.expiresAt <= Date.now()) {
        jobCache.delete(key);
      }
    }

    res.status(200).json({
      jobs: finalJobs,
      meta: {
        search: searchTerm,
        region,
        type: employmentFilter,
        count: finalJobs.length,
        sources: ['Maga', 'Jobicy', 'Remotive', 'Arbeitnow'],
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