import {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import { api } from '../services/api';
import { ApplicationDrawer } from '../components/ApplicationDrawer';
import { AddApplicationModal } from '../components/AddApplicationModal';

export type Stage =
  | 'Saved'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Decision';

export interface ApplicationItem {
  _id: string;
  company: string;
  role: string;
  location: string;
  workType: string;
  stage: Stage;
  appliedDate?: string;
  matchScore?: number;
  source?: string;
  requirements?: string[];
  notes?: string;
  deadline?: string;
}

interface MarketJob {
  _id: string;
  company: string;
  role: string;
  location: string;
  workType: string;
  url: string;
  requirements: string[];
  salary?: string;
  isLocal: boolean;
  source?: string;
  publishedAt?: string;
  employmentType?: string;
  experienceLevel?: string;
  description?: string;
}

const STAGES: Stage[] = [
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Decision',
];

const QUICK_SEARCHES = [
  'Intern',
  'Frontend',
  'Backend',
  'Full Stack',
  'QA',
  'Data',
  'Design',
  'Marketing',
];

const formatPublishedDate = (
  date?: string
): string => {
  if (!date) {
    return 'Date unavailable';
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return 'Date unavailable';
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    parsed.getTime();

  /*
   * Future dates should not show
   * negative hours.
   */
  if (difference < 0) {
    return 'Recently posted';
  }

  const hours =
    Math.floor(
      difference /
        (1000 * 60 * 60)
    );

  if (hours < 1) {
    return 'Posted recently';
  }

  if (hours < 24) {
    return `Posted ${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `Posted ${days}d ago`;
  }

  return parsed.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year:
        parsed.getFullYear() !==
        now.getFullYear()
          ? 'numeric'
          : undefined,
    }
  );
};

export const Applications =
  () => {
    const [
      viewMode,
      setViewMode,
    ] = useState<
      'board' | 'list' | 'explore'
    >('board');

    const [
      apps,
      setApps,
    ] = useState<
      ApplicationItem[]
    >([]);

    const [
      marketJobs,
      setMarketJobs,
    ] = useState<
      MarketJob[]
    >([]);

    const [
      loadingMarket,
      setLoadingMarket,
    ] = useState(false);

    const [
      marketError,
      setMarketError,
    ] = useState('');

    const [
      marketFilter,
      setMarketFilter,
    ] = useState<
      'all' | 'sri-lanka' | 'remote'
    >('all');

    const [
      employmentFilter,
      setEmploymentFilter,
    ] = useState<
      'all' | 'internship' | 'full-time'
    >('internship');

    const [
      exploreKeyword,
      setExploreKeyword,
    ] = useState('');

    const [
      search,
      setSearch,
    ] = useState('');

    const [
      filterStage,
      setFilterStage,
    ] = useState('All');

    const [
      sortBy,
      setSortBy,
    ] = useState<
      'default' | 'match-desc' | 'match-asc'
    >('default');

    const [
      selectedApp,
      setSelectedApp,
    ] =
      useState<ApplicationItem | null>(
        null
      );

    const [
      isDrawerOpen,
      setIsDrawerOpen,
    ] = useState(false);

    const [
      isModalOpen,
      setIsModalOpen,
    ] = useState(false);

    /* =====================================================
       FETCH TRACKED APPLICATIONS
    ===================================================== */

    const fetchApps =
      async () => {
        try {
          const response =
            await api.get(
              '/applications'
            );

          if (
            Array.isArray(
              response.data
                ?.applications
            )
          ) {
            setApps(
              response.data
                .applications
            );
          }
        } catch (error) {
          console.error(
            'Failed to fetch tracked applications:',
            error
          );
        }
      };

    useEffect(() => {
      fetchApps();
    }, []);

    /* =====================================================
       FETCH CURRENT OPPORTUNITIES
    ===================================================== */

    useEffect(() => {
      if (
        viewMode !==
        'explore'
      ) {
        return;
      }

      const controller =
        new AbortController();

      const timer =
        window.setTimeout(
          async () => {
            setLoadingMarket(
              true
            );

            setMarketError('');

            try {
              const params =
                new URLSearchParams();

              const keyword =
                exploreKeyword.trim();

              if (keyword) {
                params.set(
                  'search',
                  keyword
                );
              }

              params.set(
                'region',
                marketFilter
              );

              params.set(
                'type',
                employmentFilter
              );

              const response =
                await api.get(
                  `/analytics/live-jobs?${params.toString()}`,
                  {
                    signal:
                      controller.signal,
                  }
                );

              if (
                Array.isArray(
                  response.data
                    ?.jobs
                )
              ) {
                setMarketJobs(
                  response.data.jobs
                );
              } else {
                setMarketJobs(
                  []
                );
              }
            } catch (error: any) {
              /*
               * Ignore requests cancelled
               * because the user typed another
               * search term.
               */
              if (
                controller.signal
                  .aborted
              ) {
                return;
              }

              if (
                axios.isCancel(
                  error
                )
              ) {
                return;
              }

              console.error(
                'Failed to query market jobs:',
                error
              );

              setMarketJobs(
                []
              );

              setMarketError(
                'Unable to load some opportunity sources right now. Please try again.'
              );
            } finally {
              if (
                !controller.signal
                  .aborted
              ) {
                setLoadingMarket(
                  false
                );
              }
            }
          },
          500
        );

      return () => {
        window.clearTimeout(
          timer
        );

        controller.abort();
      };
    }, [
      viewMode,
      exploreKeyword,
      marketFilter,
      employmentFilter,
    ]);

    /* =====================================================
       CHANGE APPLICATION STAGE
    ===================================================== */

    const handleStageChange =
      async (
        id: string,
        nextStage: Stage
      ) => {
        const previousApps =
          apps;

        setApps(
          (previous) =>
            previous.map(
              (app) =>
                app._id === id
                  ? {
                      ...app,
                      stage:
                        nextStage,
                    }
                  : app
            )
        );

        try {
          await api.patch(
            `/applications/${id}/stage`,
            {
              stage:
                nextStage,
            }
          );
        } catch (error) {
          console.error(
            'Failed to update stage:',
            error
          );

          /*
           * Restore previous UI state
           * if the API update fails.
           */
          setApps(
            previousApps
          );
        }
      };

    /* =====================================================
       TRACK MARKET OPPORTUNITY
    ===================================================== */

    const handleTrackOpportunity =
      async (
        job: MarketJob
      ) => {
        try {
          const payload = {
            company:
              job.company,

            role:
              job.role,

            location:
              job.location,

            workType:
              job.workType,

            stage:
              'Saved' as Stage,

            requirements:
              job.requirements ||
              [],

            source:
              job.source ||
              'Explore Openings',
          };

          const response =
            await api.post(
              '/applications',
              payload
            );

          const newApp =
            response.data
              ?.application ||
            response.data;

          if (
            newApp
          ) {
            setApps(
              (previous) => [
                newApp,
                ...previous,
              ]
            );
          }

          window.alert(
            `"${job.role}" at ${job.company} was added to your Saved pipeline.`
          );
        } catch (error: any) {
          console.error(
            'Failed to track opportunity:',
            error
          );

          window.alert(
            error.response
              ?.data
              ?.message ||
              'Could not track this opportunity.'
          );
        }
      };

    /* =====================================================
       EXPORT CSV
    ===================================================== */

    const exportToCSV =
      () => {
        const headers = [
          'Company',
          'Role',
          'Location',
          'Work Type',
          'Stage',
          'Match Score (%)',
          'Requirements',
          'Deadline',
        ];

        const escapeCSV =
          (
            value: unknown
          ) => {
            const text =
              String(
                value ?? ''
              );

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          };

        const rows =
          apps.map(
            (app) => [
              escapeCSV(
                app.company
              ),

              escapeCSV(
                app.role
              ),

              escapeCSV(
                app.location
              ),

              escapeCSV(
                app.workType
              ),

              escapeCSV(
                app.stage
              ),

              app.matchScore ??
                'N/A',

              escapeCSV(
                (
                  app.requirements ||
                  []
                ).join(', ')
              ),

              app.deadline
                ? escapeCSV(
                    new Date(
                      app.deadline
                    ).toLocaleDateString()
                  )
                : escapeCSV(
                    'None'
                  ),
            ]
          );

        const csvContent =
          [
            headers.join(
              ','
            ),

            ...rows.map(
              (row) =>
                row.join(
                  ','
                )
            ),
          ].join(
            '\n'
          );

        const blob =
          new Blob(
            [
              csvContent,
            ],
            {
              type: 'text/csv;charset=utf-8;',
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            'a'
          );

        link.href =
          url;

        link.download =
          `maga_applications_${
            new Date()
              .toISOString()
              .split(
                'T'
              )[0]
          }.csv`;

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        URL.revokeObjectURL(
          url
        );
      };

    /* =====================================================
       FILTER TRACKED APPLICATIONS
    ===================================================== */

    const filteredApps =
      apps
        .filter(
          (item) => {
            const searchTerm =
              search
                .trim()
                .toLowerCase();

            const company =
              (
                item.company ||
                ''
              ).toLowerCase();

            const role =
              (
                item.role ||
                ''
              ).toLowerCase();

            const matchesSearch =
              !searchTerm ||
              company.includes(
                searchTerm
              ) ||
              role.includes(
                searchTerm
              );

            const matchesStage =
              filterStage ===
                'All' ||
              item.stage ===
                filterStage;

            return (
              matchesSearch &&
              matchesStage
            );
          }
        )
        .sort(
          (a, b) => {
            if (
              sortBy ===
              'match-desc'
            ) {
              return (
                (b.matchScore ||
                  0) -
                (a.matchScore ||
                  0)
              );
            }

            if (
              sortBy ===
              'match-asc'
            ) {
              return (
                (a.matchScore ||
                  0) -
                (b.matchScore ||
                  0)
              );
            }

            return 0;
          }
        );

    /* =====================================================
       UI
    ===================================================== */

    return (
      <div className="space-y-6 pb-12">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
              Applications
            </h1>

            <p className="mt-0.5 text-sm text-textSecondary">
              Manage your application pipeline or discover current opportunities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {viewMode !==
              'explore' && (
              <button
                onClick={
                  exportToCSV
                }
                className="rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-background transition-colors"
              >
                Export CSV
              </button>
            )}

            <button
              onClick={() =>
                setIsModalOpen(
                  true
                )
              }
              className="rounded-btn bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
            >
              + Add Opportunity
            </button>

            <div className="flex rounded-btn border border-border bg-surface p-0.5 text-xs">

              <button
                onClick={() =>
                  setViewMode(
                    'board'
                  )
                }
                className={`px-3 py-1.5 rounded-btn font-medium transition-colors ${
                  viewMode ===
                  'board'
                    ? 'bg-background text-textPrimary font-semibold shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Pipeline Board
              </button>

              <button
                onClick={() =>
                  setViewMode(
                    'list'
                  )
                }
                className={`px-3 py-1.5 rounded-btn font-medium transition-colors ${
                  viewMode ===
                  'list'
                    ? 'bg-background text-textPrimary font-semibold shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Table View
              </button>

              <button
                onClick={() =>
                  setViewMode(
                    'explore'
                  )
                }
                className={`px-3 py-1.5 rounded-btn font-medium transition-colors ${
                  viewMode ===
                  'explore'
                    ? 'bg-background text-textPrimary font-semibold shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Explore Openings
              </button>

            </div>
          </div>
        </div>

        {/* =================================================
            EXPLORE
        ================================================= */}

        {viewMode ===
          'explore' && (
          <div className="space-y-5">

            {/* SEARCH PANEL */}

            <div className="rounded-card border border-border bg-surface p-4">

              <div className="flex flex-col lg:flex-row lg:items-end gap-4">

                <div className="flex-1">

                  <label className="block text-xs font-medium text-textSecondary mb-1.5">
                    Search opportunities
                  </label>

                  <div className="relative">

                    <input
                      type="text"
                      value={
                        exploreKeyword
                      }
                      onChange={(
                        event
                      ) =>
                        setExploreKeyword(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Search by role, skill, or keyword"
                      className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
                    />

                    {exploreKeyword && (
                      <button
                        type="button"
                        onClick={() =>
                          setExploreKeyword(
                            ''
                          )
                        }
                        className="absolute right-3 top-2.5 text-xs text-textMuted hover:text-textPrimary"
                      >
                        Clear
                      </button>
                    )}

                  </div>
                </div>

                {/* LOCATION */}

                <div>

                  <label className="block text-xs font-medium text-textSecondary mb-1.5">
                    Location
                  </label>

                  <select
                    value={
                      marketFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setMarketFilter(
                        event
                          .target
                          .value as
                          | 'all'
                          | 'sri-lanka'
                          | 'remote'
                      )
                    }
                    className="rounded-input border border-border bg-background px-3 py-2 text-sm text-textSecondary focus:outline-none focus:border-accent"
                  >
                    <option value="all">
                      All locations
                    </option>

                    <option value="sri-lanka">
                      Sri Lanka
                    </option>

                    <option value="remote">
                      Remote
                    </option>
                  </select>

                </div>

                {/* TYPE */}

                <div>

                  <label className="block text-xs font-medium text-textSecondary mb-1.5">
                    Opportunity type
                  </label>

                  <select
                    value={
                      employmentFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setEmploymentFilter(
                        event
                          .target
                          .value as
                          | 'all'
                          | 'internship'
                          | 'full-time'
                      )
                    }
                    className="rounded-input border border-border bg-background px-3 py-2 text-sm text-textSecondary focus:outline-none focus:border-accent"
                  >
                    <option value="internship">
                      Internships
                    </option>

                    <option value="full-time">
                      Full-time
                    </option>

                    <option value="all">
                      All opportunities
                    </option>
                  </select>

                </div>

              </div>

              {/* POPULAR SEARCHES */}

              <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-border">

                <span className="text-xs text-textMuted mr-1">
                  Popular:
                </span>

                {QUICK_SEARCHES.map(
                  (tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() =>
                        setExploreKeyword(
                          tag
                        )
                      }
                      className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                        exploreKeyword.toLowerCase() ===
                        tag.toLowerCase()
                          ? 'bg-accent text-white border-accent'
                          : 'bg-background border-border text-textSecondary hover:border-accent hover:text-accent'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                )}

              </div>

            </div>

            {/* RESULTS HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

              <div>

                <h2 className="text-sm font-semibold text-textPrimary">

                  {exploreKeyword
                    ? `Results for "${exploreKeyword}"`
                    : 'Latest internship opportunities'}

                </h2>

                <p className="text-xs text-textMuted mt-0.5">
                  {marketJobs.length}{' '}
                  opportunities found
                </p>

              </div>

              <div className="text-xs text-textMuted">
                Current listings from Maga and selected public job boards
              </div>

            </div>

            {/* ERROR */}

            {marketError && (
              <div className="rounded-card border border-border bg-surface px-4 py-3">
                <p className="text-xs text-textSecondary">
                  {marketError}
                </p>
              </div>
            )}

            {/* LOADING */}

            {loadingMarket ? (
              <div className="py-16 text-center border border-border rounded-card bg-surface">

                <p className="text-sm text-textSecondary">
                  Searching current opportunities...
                </p>

                <p className="text-xs text-textMuted mt-1">
                  Checking available job sources
                </p>

              </div>
            ) : marketJobs.length ===
              0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-card bg-surface">

                <p className="text-sm font-medium text-textPrimary">
                  No matching opportunities
                </p>

                <p className="text-xs text-textMuted mt-1 max-w-md mx-auto">
                  Try a broader role or skill, or change the location or opportunity type.
                </p>

              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {marketJobs.map(
                  (job) => (
                    <div
                      key={
                        job._id
                      }
                      className="rounded-card border border-border bg-surface p-5 flex flex-col justify-between hover:border-textSecondary/40 transition-colors"
                    >

                      <div>

                        {/* SOURCE + TYPE */}

                        <div className="flex items-center justify-between gap-3">

                          <span className="text-[11px] font-medium text-textMuted">
                            {job.source ||
                              'Opportunity'}
                          </span>

                          <span className="text-[10px] font-medium text-textSecondary border border-border rounded px-2 py-0.5">
                            {job.employmentType ||
                              job.workType}
                          </span>

                        </div>

                        {/* COMPANY */}

                        <p className="text-sm font-semibold text-textPrimary mt-3">
                          {job.company}
                        </p>

                        {/* ROLE */}

                        <h3 className="text-sm text-textSecondary mt-1 leading-snug">
                          {job.role}
                        </h3>

                        {/* LOCATION */}

                        <p className="text-xs text-textMuted mt-2">
                          {job.location}

                          {job.workType &&
                            job.workType !==
                              job.location
                            ? ` · ${job.workType}`
                            : ''}
                        </p>

                        {/* EXPERIENCE */}

                        {job.experienceLevel &&
                          job.experienceLevel !==
                            'Not specified' && (
                            <p className="text-xs text-textMuted mt-1">
                              {
                                job.experienceLevel
                              }
                            </p>
                          )}

                        {/* REQUIREMENTS */}

                        {job.requirements?.length >
                          0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">

                            {job.requirements
                              .slice(
                                0,
                                5
                              )
                              .map(
                                (
                                  requirement,
                                  index
                                ) => (
                                  <span
                                    key={`${job._id}-${requirement}-${index}`}
                                    className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-textSecondary"
                                  >
                                    {
                                      requirement
                                    }
                                  </span>
                                )
                              )}

                          </div>
                        )}

                        {/* SALARY */}

                        {job.salary && (
                          <p className="text-xs text-textSecondary mt-3">
                            {job.salary}
                          </p>
                        )}

                      </div>

                      {/* FOOTER */}

                      <div className="mt-5 pt-3 border-t border-border">

                        <div className="flex items-center justify-between mb-3">

                          <span className="text-[11px] text-textMuted">
                            {formatPublishedDate(
                              job.publishedAt
                            )}
                          </span>

                          <span className="text-[10px] font-medium text-textSecondary">
                            {job.isLocal
                              ? 'Sri Lanka'
                              : 'Remote'}
                          </span>

                        </div>

                        <div className="flex items-center gap-2">

                          <a
                            href={
                              job.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-1.5 text-xs rounded-btn border border-border hover:bg-background transition-colors text-textPrimary font-medium"
                          >
                            View opening
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              handleTrackOpportunity(
                                job
                              )
                            }
                            className="py-1.5 px-3 text-xs rounded-btn bg-accent text-white hover:bg-accent/90 transition-colors font-medium"
                          >
                            Track
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

        {/* =================================================
            TRACKED APPLICATIONS
        ================================================= */}

        {viewMode !==
          'explore' && (
          <>

            {/* FILTER BAR */}

            <div className="flex flex-wrap items-center gap-3">

              <input
                type="text"
                placeholder="Filter by company or role..."
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                className="w-64 rounded-input border border-border bg-surface px-3 py-1.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
              />

              <select
                value={
                  filterStage
                }
                onChange={(
                  event
                ) =>
                  setFilterStage(
                    event
                      .target
                      .value
                  )
                }
                className="rounded-input border border-border bg-surface px-3 py-1.5 text-sm text-textSecondary focus:outline-none focus:border-accent"
              >
                <option value="All">
                  All Stages
                </option>

                {STAGES.map(
                  (stage) => (
                    <option
                      key={
                        stage
                      }
                      value={
                        stage
                      }
                    >
                      {stage}
                    </option>
                  )
                )}

              </select>

              <select
                value={
                  sortBy
                }
                onChange={(
                  event
                ) =>
                  setSortBy(
                    event
                      .target
                      .value as
                      | 'default'
                      | 'match-desc'
                      | 'match-asc'
                  )
                }
                className="rounded-input border border-border bg-surface px-3 py-1.5 text-sm text-textSecondary focus:outline-none focus:border-accent"
              >
                <option value="default">
                  Sort: Default
                </option>

                <option value="match-desc">
                  Sort: Highest Match
                </option>

                <option value="match-asc">
                  Sort: Lowest Match
                </option>
              </select>

            </div>

            {/* BOARD */}

            {viewMode ===
            'board' ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">

                {STAGES.map(
                  (stage) => {
                    const stageApps =
                      filteredApps.filter(
                        (
                          app
                        ) =>
                          app.stage ===
                          stage
                      );

                    return (
                      <div
                        key={
                          stage
                        }
                        className="rounded-card border border-border bg-surface/60 p-3"
                      >

                        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">

                          <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                            {stage}
                          </span>

                          <span className="text-xs font-semibold text-textMuted bg-background px-1.5 py-0.5 rounded">
                            {
                              stageApps.length
                            }
                          </span>

                        </div>

                        <div className="space-y-3">

                          {stageApps.map(
                            (item) => (
                              <div
                                key={
                                  item._id
                                }
                                onClick={() => {
                                  setSelectedApp(
                                    item
                                  );

                                  setIsDrawerOpen(
                                    true
                                  );
                                }}
                                className="cursor-pointer rounded-btn border border-border bg-surface p-3 shadow-xs hover:border-textSecondary/40 transition-colors"
                              >

                                <div className="flex items-start justify-between">

                                  <div className="font-medium text-sm text-textPrimary leading-tight">
                                    {
                                      item.company
                                    }
                                  </div>

                                  {item.matchScore !==
                                    undefined && (
                                    <span className="text-[11px] font-semibold text-accent bg-accent-light px-1.5 py-0.5 rounded">
                                      {
                                        item.matchScore
                                      }
                                      %
                                    </span>
                                  )}

                                </div>

                                <div className="text-xs text-textSecondary mt-1 leading-snug">
                                  {
                                    item.role
                                  }
                                </div>

                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/60 text-[11px] text-textMuted">

                                  <span>
                                    {
                                      item.workType
                                    }
                                  </span>

                                  <span>
                                    ·
                                  </span>

                                  <span>
                                    {
                                      item.location
                                    }
                                  </span>

                                </div>

                                <div
                                  onClick={(
                                    event
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]"
                                >

                                  <span className="text-textMuted">
                                    Move:
                                  </span>

                                  <select
                                    value={
                                      item.stage
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleStageChange(
                                        item._id,
                                        event
                                          .target
                                          .value as Stage
                                      )
                                    }
                                    className="bg-background border border-border rounded px-1.5 py-0.5 text-textSecondary text-[11px]"
                                  >

                                    {STAGES.map(
                                      (
                                        stageOption
                                      ) => (
                                        <option
                                          key={
                                            stageOption
                                          }
                                          value={
                                            stageOption
                                          }
                                        >
                                          {
                                            stageOption
                                          }
                                        </option>
                                      )
                                    )}

                                  </select>

                                </div>

                              </div>
                            )
                          )}

                          {stageApps.length ===
                            0 && (
                            <div className="py-6 text-center text-xs text-textMuted border border-dashed border-border rounded-btn">
                              Empty
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            ) : (

              /* =================================================
                 TABLE VIEW
              ================================================= */

              <div className="rounded-card border border-border bg-surface overflow-hidden">

                <div className="overflow-x-auto">

                  <table className="w-full text-left text-sm">

                    <thead className="border-b border-border bg-background text-xs uppercase tracking-wider text-textSecondary font-semibold">

                      <tr>

                        <th className="px-6 py-3">
                          Company
                        </th>

                        <th className="px-6 py-3">
                          Role
                        </th>

                        <th className="px-6 py-3">
                          Location / Type
                        </th>

                        <th className="px-6 py-3">
                          Match
                        </th>

                        <th className="px-6 py-3">
                          Stage
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-border">

                      {filteredApps.map(
                        (item) => (
                          <tr
                            key={
                              item._id
                            }
                            onClick={() => {
                              setSelectedApp(
                                item
                              );

                              setIsDrawerOpen(
                                true
                              );
                            }}
                            className="cursor-pointer hover:bg-background/50 transition-colors"
                          >

                            <td className="px-6 py-4 font-medium text-textPrimary">
                              {
                                item.company
                              }
                            </td>

                            <td className="px-6 py-4 text-textSecondary">
                              {
                                item.role
                              }
                            </td>

                            <td className="px-6 py-4 text-xs text-textMuted">
                              {
                                item.location
                              }{' '}
                              ·{' '}
                              {
                                item.workType
                              }
                            </td>

                            <td className="px-6 py-4">

                              <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-0.5 rounded">
                                {item.matchScore !==
                                undefined
                                  ? `${item.matchScore}%`
                                  : '--'}
                              </span>

                            </td>

                            <td
                              className="px-6 py-4"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <select
                                value={
                                  item.stage
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleStageChange(
                                    item._id,
                                    event
                                      .target
                                      .value as Stage
                                  )
                                }
                                className="bg-background border border-border rounded px-2 py-1 text-xs text-textSecondary font-medium"
                              >

                                {STAGES.map(
                                  (
                                    stage
                                  ) => (
                                    <option
                                      key={
                                        stage
                                      }
                                      value={
                                        stage
                                      }
                                    >
                                      {
                                        stage
                                      }
                                    </option>
                                  )
                                )}

                              </select>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

          </>
        )}

        {/* =================================================
            ADD APPLICATION MODAL
        ================================================= */}

        <AddApplicationModal
          isOpen={
            isModalOpen
          }
          onClose={() =>
            setIsModalOpen(
              false
            )
          }
          onCreated={(
            newApp
          ) =>
            setApps(
              (previous) => [
                newApp,
                ...previous,
              ]
            )
          }
        />

        {/* =================================================
            APPLICATION DRAWER
        ================================================= */}

        <ApplicationDrawer
          application={
            selectedApp
          }
          isOpen={
            isDrawerOpen
          }
          onClose={() => {
            setIsDrawerOpen(
              false
            );

            setSelectedApp(
              null
            );
          }}
          onUpdate={(
            updated
          ) => {
            setApps(
              (previous) =>
                previous.map(
                  (app) =>
                    app._id ===
                    updated._id
                      ? updated
                      : app
                )
            );
          }}
          onDelete={(
            id
          ) => {
            setApps(
              (previous) =>
                previous.filter(
                  (app) =>
                    app._id !==
                    id
                )
            );
          }}
        />

      </div>
    );
  };