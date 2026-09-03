import { useState, useEffect, type ChangeEvent } from 'react';
import { api } from '../services/api';

export const CVProfile = () => {
  const [name, setName] = useState('Thushani');
  const [university, setUniversity] = useState('Sabaragamuwa University of Sri Lanka');
  const [degree, setDegree] = useState('BSc (Hons) in Computing');
  const [gradYear, setGradYear] = useState('2026');
  const [targetRole, setTargetRole] = useState('Full Stack Developer Intern');
  const [skills, setSkills] = useState<string[]>(['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'Tailwind CSS']);
  const [newSkill, setNewSkill] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string>('Thushani_Resume_2026.pdf');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data?.user) {
          const u = res.data.user;
          if (u.name) setName(u.name);
          if (u.university) setUniversity(u.university);
          if (u.degree) setDegree(u.degree);
          if (u.gradYear) setGradYear(String(u.gradYear));
          if (u.targetRole) setTargetRole(u.targetRole);
          if (u.skills?.length) setSkills(u.skills);
          if (u.cvUrl) setCvFileName(u.cvUrl);
        }
      } catch (err) {
        // Retains editorial defaults
      }
    };
    loadProfile();
  }, []);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleUploadCV = async () => {
    if (!cvFile) return;
    setUploadStatus('Uploading and parsing text...');
    const formData = new FormData();
    formData.append('cv', cvFile);

    try {
      const res = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCvFileName(res.data.fileName);
      setUploadStatus('CV parsed successfully and stored to profile.');
    } catch (err) {
      setUploadStatus('Failed to upload or parse PDF.');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/profile', {
        name,
        university,
        degree,
        gradYear: Number(gradYear),
        targetRole,
        skills,
      });
      setUploadStatus('Profile details updated successfully.');
    } catch (err) {
      setUploadStatus('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">CV & Profile</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Maintain your academic details, verified skill tags, and parsed resume.
        </p>
      </div>

      {/* CV Document Upload Section */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
          Resume Document
        </h2>
        <div className="border border-dashed border-border rounded-card p-6 text-center bg-background/50">
          <div className="text-sm font-medium text-textPrimary">{cvFileName}</div>
          <p className="text-xs text-textMuted mt-1">PDF format up to 5MB</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <input
              type="file"
              accept="application/pdf"
              id="cv-upload-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="cv-upload-input"
              className="cursor-pointer rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-background"
            >
              Choose PDF
            </label>
            {cvFile && (
              <button
                onClick={handleUploadCV}
                className="rounded-btn bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
              >
                Upload & Extract Text
              </button>
            )}
          </div>
          {uploadStatus && (
            <div className="mt-3 text-xs text-accent font-medium">{uploadStatus}</div>
          )}
        </div>
      </div>

      {/* Academic & Target Role Information */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
          Personal & Academic Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Target Internship Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">University / Institute</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-textSecondary mb-1">Degree Program</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Grad Year</label>
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Skill Tag Editor */}
        <div className="pt-4 border-t border-border space-y-3">
          <label className="block text-xs font-medium text-textSecondary">Verified Technical Skills</label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded bg-background border border-border px-2.5 py-1 text-xs text-textPrimary font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-textMuted hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. Docker, PostgreSQL)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="w-64 rounded-input border border-border bg-surface px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded-btn border border-border bg-background px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-surface"
            >
              Add
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};