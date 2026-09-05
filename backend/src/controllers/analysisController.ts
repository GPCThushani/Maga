import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Application } from '../models/Application';

export interface ActionPlanStep {
  title: string;
  action: string;
  tags?: string[];
}

// Canonical skill normalization dictionary to prevent false positives (e.g. NoSQL matching SQL)
const SKILL_ALIASES: Record<string, string> = {
  // Frontend
  react: 'react',
  'react.js': 'react',
  reactjs: 'react',
  ts: 'typescript',
  typescript: 'typescript',
  'typescript.js': 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  tailwind: 'tailwind css',
  'tailwind css': 'tailwind css',
  tailwindcss: 'tailwind css',
  html: 'html',
  html5: 'html',
  css: 'css',
  css3: 'css',
  redux: 'redux',
  'next.js': 'next.js',
  nextjs: 'next.js',
  'next js': 'next.js',
  vue: 'vue.js',
  'vue.js': 'vue.js',

  // Backend & Databases
  node: 'node.js',
  'node.js': 'node.js',
  nodejs: 'node.js',
  'node js': 'node.js',
  express: 'express',
  'express.js': 'express',
  expressjs: 'express',
  sql: 'sql',
  'ms sql': 'sql',
  mssql: 'sql',
  mysql: 'mysql',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  'postgres db': 'postgresql',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  nosql: 'nosql',
  redis: 'redis',
  python: 'python',
  java: 'java',
  'c#': 'c#',
  '.net': '.net',
  dotnet: '.net',

  // DevOps, Cloud & Version Control (Git != GitHub)
  docker: 'docker',
  k8s: 'kubernetes',
  kubernetes: 'kubernetes',
  aws: 'aws',
  azure: 'azure',
  git: 'git',
  github: 'github',
  'ci/cd': 'ci/cd',
  cicd: 'ci/cd',

  // Mobile & Analytics
  flutter: 'flutter',
  'react native': 'react native',
  dart: 'dart',
  firebase: 'firebase',
  pandas: 'pandas',
  powerbi: 'powerbi',
  'power bi': 'powerbi',
  excel: 'excel',

  // QA & Testing
  selenium: 'selenium',
  postman: 'postman',
  jira: 'jira',
  jest: 'jest',
  'unit testing': 'unit testing',
  'manual testing': 'manual testing',
  qa: 'quality assurance',
  'quality assurance': 'quality assurance',

  // Design & Architecture
  figma: 'figma',
  wireframing: 'wireframing',
  prototyping: 'prototyping',
  'user research': 'user research',
  'design systems': 'design systems',
  'rest api': 'rest apis',
  'rest apis': 'rest apis',
  rest: 'rest apis',
  graphql: 'graphql',
};

const ACTION_STEP_MAP: Record<string, ActionPlanStep> = {
  // Frontend
  react: {
    title: 'Build reusable component patterns',
    action: 'Build an interactive feature using custom hooks, typed props, and clear state boundaries in your portfolio.',
    tags: ['Hooks', 'State Management'],
  },
  'tailwind css': {
    title: 'Implement utility-first styling',
    action: 'Style a responsive multi-breakpoint interface using Tailwind without writing raw CSS overrides.',
    tags: ['Responsive UI', 'Design Tokens'],
  },
  typescript: {
    title: 'Enforce strict static type safety',
    action: 'Convert core components and route handlers to TypeScript with strict type definitions and zero any types.',
    tags: ['Strict Types', 'Generics'],
  },
  redux: {
    title: 'Implement centralized state management',
    action: 'Set up Redux Toolkit (RTK) with asynchronous thunks or RTK Query for backend API state caching.',
    tags: ['Redux Toolkit', 'Slice Architecture'],
  },

  // Backend & Databases
  'node.js': {
    title: 'Structure production-grade API architecture',
    action: 'Implement layered architecture (controllers, services, and repositories) with clean error handling in Node.',
    tags: ['Middleware', 'Async/Await'],
  },
  express: {
    title: 'Harden route handlers and middleware',
    action: 'Add centralized error handling middleware, input validation schemas, and rate limiting to your Express server.',
    tags: ['Express Routers', 'Validation'],
  },
  mongodb: {
    title: 'Design document schemas and indexes',
    action: 'Model MongoDB collections with Mongoose validation, compound indexes, and write an aggregation pipeline.',
    tags: ['Mongoose', 'Aggregation'],
  },
  postgresql: {
    title: 'Design relational schemas with joins',
    action: 'Model normalized tables with explicit foreign keys, indexes, and write complex multi-table queries.',
    tags: ['PostgreSQL', 'Relational Modeling'],
  },
  'rest apis': {
    title: 'Formalize REST interface standards',
    action: 'Document your endpoints with consistent HTTP verbs, standardized status codes, and clear JSON response schemas.',
    tags: ['REST conventions', 'OpenAPI'],
  },

  // DevOps & Cloud
  docker: {
    title: 'Containerize an active application',
    action: 'Add a multi-stage Dockerfile and a docker-compose.yml file managing both frontend and database services.',
    tags: ['Dockerfile', 'docker-compose'],
  },
  aws: {
    title: 'Deploy to cloud infrastructure',
    action: 'Deploy a containerized API or static web frontend to AWS (EC2, S3, or Lambda) and document the architecture.',
    tags: ['AWS EC2', 'S3', 'Cloud Deployment'],
  },
  git: {
    title: 'Demonstrate clean version control discipline',
    action: 'Follow conventional commit standards, feature branch workflows, and descriptive pull request summaries.',
    tags: ['Git Flow', 'Feature Branches'],
  },
  github: {
    title: 'Document open-source repository workflows',
    action: 'Set up repository issue templates, branch protection rules, and structured PR discussions on your GitHub profile.',
    tags: ['Pull Requests', 'Branch Protection'],
  },
  'ci/cd': {
    title: 'Automate delivery pipelines',
    action: 'Configure a GitHub Actions workflow that executes automated linting and unit test suites on pull requests.',
    tags: ['GitHub Actions', 'YAML'],
  },

  // QA & Testing
  selenium: {
    title: 'Build automated end-to-end tests',
    action: 'Write regression test scripts validating critical user journeys (such as authentication and data submission).',
    tags: ['Selenium WebDriver', 'E2E Testing'],
  },
  'unit testing': {
    title: 'Expand automated test suites',
    action: 'Write automated unit and integration tests using Jest or Supertest covering core business logic.',
    tags: ['Jest', 'Supertest'],
  },
  postman: {
    title: 'Build structured API test collections',
    action: 'Export documented Postman test suites with environment variables, auth tokens, and pre-request scripts.',
    tags: ['Collections', 'API Testing'],
  },

  // Design & Mobile
  figma: {
    title: 'Create polished design systems',
    action: 'Create high-fidelity wireframes, interactive prototypes, and reusable UI components in Figma before coding.',
    tags: ['Wireframing', 'Design Tokens'],
  },
  flutter: {
    title: 'Build cross-platform mobile interfaces',
    action: 'Create a Flutter application with declarative state management (Bloc or Provider) and responsive screen layouts.',
    tags: ['Flutter', 'Dart', 'Mobile UI'],
  },
  python: {
    title: 'Develop data analysis workflows',
    action: 'Clean, transform, and visualize structured datasets using Python, Pandas, and Matplotlib notebooks.',
    tags: ['Pandas', 'Data Processing'],
  },
  sql: {
    title: 'Practice advanced relational querying',
    action: 'Write complex SQL queries utilizing GROUP BY, aggregation functions, subqueries, and window functions.',
    tags: ['SQL', 'Aggregations'],
  },
};

const canonicalizeSkill = (raw: string): string => {
  const clean = raw.trim().toLowerCase();
  return SKILL_ALIASES[clean] || clean;
};

export const analyzeJobFit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { jobRole, requiredSkills, applicationId } = req.body;

    if (!jobRole || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      res.status(400).json({ message: 'Job role and a non-empty list of requirements are required.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    const rawUserSkills: string[] = user.skills || [];
    const normalizedUserSkills = new Set(rawUserSkills.map((s) => canonicalizeSkill(s)));

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    // Exact canonical matching avoids false positives (e.g. NoSQL matching SQL)
    requiredSkills.forEach((rawReq: string) => {
      const trimmed = rawReq.trim();
      if (!trimmed) return;

      const canonicalReq = canonicalizeSkill(trimmed);
      if (normalizedUserSkills.has(canonicalReq)) {
        matchedSkills.push(trimmed);
      } else {
        missingSkills.push(trimmed);
      }
    });

    const totalReqs = requiredSkills.length;
    const matchScore = totalReqs > 0 ? Math.round((matchedSkills.length / totalReqs) * 100) : 0;
    const matchedRequirements = `${matchedSkills.length} of ${totalReqs}`;

    // Generate tailored next steps
    const actionPlan: ActionPlanStep[] = [];
    missingSkills.forEach((missing) => {
      const canonical = canonicalizeSkill(missing);
      if (ACTION_STEP_MAP[canonical]) {
        actionPlan.push(ACTION_STEP_MAP[canonical]);
      } else {
        actionPlan.push({
          title: `Build practical competency with ${missing}`,
          action: `Develop a focused demonstration or feature branch in your portfolio project highlighting ${missing}.`,
          tags: [missing],
        });
      }
    });

    if (actionPlan.length === 0) {
      actionPlan.push({
        title: 'Maintain interview readiness',
        action: 'Your profile covers all core requirements for this role. Focus on explaining system architecture and trade-offs.',
        tags: ['Interview Prep'],
      });
    }

    // Persist alignment score directly to the tracked application document if provided
    if (applicationId) {
      await Application.findOneAndUpdate(
        { _id: applicationId, userId },
        { matchScore }
      );
    }

    res.status(200).json({
      matchScore,
      matchedRequirements,
      matchedSkills,
      missingSkills,
      actionPlan: actionPlan.slice(0, 4),
    });
  } catch (err: any) {
    console.error('Job alignment analysis failed:', err);
    res.status(500).json({ message: 'Failed to analyze job alignment.', error: err.message });
  }
};