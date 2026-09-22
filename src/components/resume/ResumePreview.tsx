// ──────────────────────────────────────────────────────────────────────────────
// Resume Preview — Live A4 Preview Component
// ──────────────────────────────────────────────────────────────────────────────
// Renders a realistic A4 resume from structured ResumeData. Supports two
// ATS-safe templates: Classic and Modern. Only shows sections that contain data.
// ──────────────────────────────────────────────────────────────────────────────

import React, { forwardRef } from 'react';
import { ResumeData, ResumeTemplate, SKILL_CATEGORY_LABELS, ResumeSkills } from './types';

interface Props {
  data: ResumeData;
  template: ResumeTemplate;
}

// Format month string (2024-06) to "Jun 2024"
function formatDate(d: string): string {
  if (!d) return '';
  const [year, month] = d.split('-');
  if (!month) return year;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1] || month} ${year}`;
}

function dateRange(start: string, end: string, current?: boolean): string {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} — Present`;
  if (e) return e;
  return '';
}

// Contact line builder
function buildContactLine(data: ResumeData['personal']): string[] {
  const parts: string[] = [];
  if (data.email) parts.push(data.email);
  if (data.phone) parts.push(data.phone);
  const loc = [data.city, data.state, data.country].filter(Boolean).join(', ');
  if (loc) parts.push(loc);
  if (data.linkedin) parts.push(data.linkedin.replace(/^https?:\/\/(www\.)?/, ''));
  if (data.github) parts.push(data.github.replace(/^https?:\/\/(www\.)?/, ''));
  if (data.portfolio) parts.push(data.portfolio.replace(/^https?:\/\/(www\.)?/, ''));
  return parts;
}

// Check if any skills exist
function hasSkills(skills: ResumeData['skills']): boolean {
  return Object.values(skills).some(arr => arr.length > 0);
}

// ─── Classic ATS Template ───────────────────────────────────────────────────

const ClassicTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
  const contact = buildContactLine(data.personal);
  const sectionHeading = "text-[11px] font-black uppercase tracking-[0.12em] text-slate-800 border-b border-slate-300 pb-[3px] mb-[6px]";
  const bodyText = "text-[9.5px] leading-[1.45] text-slate-700";

  return (
    <div className="font-['Times_New_Roman',_serif] text-slate-800">
      {/* Header */}
      <div className="text-center mb-[10px]">
        <h1 className="text-[18px] font-bold tracking-wide uppercase">{data.personal.fullName || 'Your Name'}</h1>
        {data.personal.targetRole && <p className="text-[10.5px] text-slate-600 mt-[1px]">{data.personal.targetRole}</p>}
        {contact.length > 0 && <p className="text-[8.5px] text-slate-500 mt-[3px]">{contact.join(' | ')}</p>}
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Professional Summary</h2>
          <p className={bodyText}>{data.summary}</p>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Education</h2>
          {data.education.map(edu => (
            <div key={edu.id} className="mb-[5px]">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-bold">{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ')}</p>
                <span className="text-[8.5px] text-slate-500">{dateRange(edu.startDate, edu.endDate)}</span>
              </div>
              <p className="text-[9px] text-slate-600">{edu.institution}{edu.location ? `, ${edu.location}` : ''}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</p>
              {edu.relevantCoursework && <p className="text-[8.5px] text-slate-500 mt-[1px]">Coursework: {edu.relevantCoursework}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {hasSkills(data.skills) && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Technical Skills</h2>
          {(Object.keys(data.skills) as (keyof ResumeSkills)[]).map(cat => {
            if (data.skills[cat].length === 0) return null;
            return (
              <p key={cat} className={`${bodyText} mb-[2px]`}>
                <span className="font-bold">{SKILL_CATEGORY_LABELS[cat]}: </span>
                {data.skills[cat].join(', ')}
              </p>
            );
          })}
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Experience</h2>
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-[6px]">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-bold">{exp.jobTitle}</p>
                <span className="text-[8.5px] text-slate-500">{dateRange(exp.startDate, exp.endDate, exp.currentlyWorking)}</span>
              </div>
              <p className="text-[9px] text-slate-600">{exp.company}{exp.location ? `, ${exp.location}` : ''}{exp.employmentType ? ` · ${exp.employmentType}` : ''}</p>
              {exp.technologies.length > 0 && <p className="text-[8px] text-slate-500 mt-[1px]">Tech: {exp.technologies.join(', ')}</p>}
              {exp.responsibilities.filter(Boolean).length > 0 && (
                <ul className="mt-[2px] ml-[12px] list-disc">
                  {exp.responsibilities.filter(Boolean).map((r, i) => <li key={i} className={bodyText}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Projects</h2>
          {data.projects.map(proj => (
            <div key={proj.id} className="mb-[5px]">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-bold">{proj.name}{proj.role ? ` — ${proj.role}` : ''}</p>
                <span className="text-[8.5px] text-slate-500">{dateRange(proj.startDate, proj.endDate)}</span>
              </div>
              {proj.technologies.length > 0 && <p className="text-[8px] text-slate-500">Tech: {proj.technologies.join(', ')}</p>}
              {proj.description && <p className={`${bodyText} mt-[1px]`}>{proj.description}</p>}
              {proj.highlights.filter(Boolean).length > 0 && (
                <ul className="mt-[2px] ml-[12px] list-disc">
                  {proj.highlights.filter(Boolean).map((h, i) => <li key={i} className={bodyText}>{h}</li>)}
                </ul>
              )}
              {(proj.githubUrl || proj.liveDemoUrl) && (
                <p className="text-[8px] text-blue-600 mt-[1px]">
                  {proj.githubUrl && <span>{proj.githubUrl}</span>}
                  {proj.githubUrl && proj.liveDemoUrl && ' | '}
                  {proj.liveDemoUrl && <span>{proj.liveDemoUrl}</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Certifications</h2>
          {data.certifications.map(cert => (
            <p key={cert.id} className={`${bodyText} mb-[2px]`}>
              <span className="font-bold">{cert.name}</span> — {cert.issuingOrganization}
              {cert.issueDate ? ` (${formatDate(cert.issueDate)})` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Achievements</h2>
          {data.achievements.map(ach => (
            <p key={ach.id} className={`${bodyText} mb-[2px]`}>
              <span className="font-bold">{ach.title}</span>
              {ach.organization ? ` — ${ach.organization}` : ''}
              {ach.description ? `. ${ach.description}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div className="mb-[8px]">
          <h2 className={sectionHeading}>Languages</h2>
          <p className={bodyText}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}</p>
        </div>
      )}
    </div>
  );
};

// ─── Modern ATS Template ────────────────────────────────────────────────────

const ModernTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
  const contact = buildContactLine(data.personal);
  const sectionHeading = "text-[11px] font-extrabold uppercase tracking-[0.1em] text-indigo-700 mb-[5px] pb-[2px] border-b-2 border-indigo-100";
  const bodyText = "text-[9.5px] leading-[1.45] text-slate-700";

  return (
    <div className="font-['Inter',_'Segoe_UI',_sans-serif] text-slate-800">
      {/* Header */}
      <div className="mb-[12px]">
        <h1 className="text-[20px] font-black text-slate-900 tracking-tight">{data.personal.fullName || 'Your Name'}</h1>
        {data.personal.targetRole && <p className="text-[11px] font-semibold text-indigo-600 mt-[1px]">{data.personal.targetRole}</p>}
        {contact.length > 0 && <p className="text-[8.5px] text-slate-500 mt-[3px]">{contact.join('  ·  ')}</p>}
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Professional Summary</h2>
          <p className={bodyText}>{data.summary}</p>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Education</h2>
          {data.education.map(edu => (
            <div key={edu.id} className="mb-[5px]">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-bold text-slate-800">{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ')}</p>
                <span className="text-[8.5px] text-slate-400 font-medium">{dateRange(edu.startDate, edu.endDate)}</span>
              </div>
              <p className="text-[9px] text-slate-500">{edu.institution}{edu.location ? ` · ${edu.location}` : ''}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {hasSkills(data.skills) && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Skills</h2>
          <div className="flex flex-wrap gap-[3px]">
            {Object.values(data.skills).flat().map((skill, i) => (
              <span key={i} className="px-[6px] py-[2px] text-[8px] font-semibold bg-slate-100 text-slate-700 rounded">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Experience</h2>
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-[6px]">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-bold text-slate-800">{exp.jobTitle}<span className="font-normal text-slate-500"> at {exp.company}</span></p>
                <span className="text-[8.5px] text-slate-400 font-medium">{dateRange(exp.startDate, exp.endDate, exp.currentlyWorking)}</span>
              </div>
              {exp.responsibilities.filter(Boolean).length > 0 && (
                <ul className="mt-[2px] ml-[12px] list-disc">
                  {exp.responsibilities.filter(Boolean).map((r, i) => <li key={i} className={bodyText}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Projects</h2>
          {data.projects.map(proj => (
            <div key={proj.id} className="mb-[5px]">
              <p className="text-[10px] font-bold text-slate-800">{proj.name}</p>
              {proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-[2px] mt-[1px]">
                  {proj.technologies.map((t, i) => (
                    <span key={i} className="px-[4px] py-[1px] text-[7.5px] font-semibold bg-indigo-50 text-indigo-600 rounded">{t}</span>
                  ))}
                </div>
              )}
              {proj.description && <p className={`${bodyText} mt-[2px]`}>{proj.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Certifications</h2>
          {data.certifications.map(cert => (
            <p key={cert.id} className={`${bodyText} mb-[2px]`}>{cert.name} — {cert.issuingOrganization}{cert.issueDate ? ` (${formatDate(cert.issueDate)})` : ''}</p>
          ))}
        </div>
      )}

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <div className="mb-[10px]">
          <h2 className={sectionHeading}>Achievements</h2>
          {data.achievements.map(ach => (
            <p key={ach.id} className={`${bodyText} mb-[2px]`}><span className="font-semibold">{ach.title}</span>{ach.description ? ` — ${ach.description}` : ''}</p>
          ))}
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className={sectionHeading}>Languages</h2>
          <p className={bodyText}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join('  ·  ')}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Preview Component ─────────────────────────────────────────────────

export const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data, template }, ref) => {
  return (
    <div
      ref={ref}
      id="resume-preview-content"
      className="bg-white shadow-lg border border-slate-200 rounded-sm mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 18mm',
        maxWidth: '100%',
        transform: 'scale(var(--resume-scale, 1))',
        transformOrigin: 'top center',
      }}
    >
      {template === 'modern' ? <ModernTemplate data={data} /> : <ClassicTemplate data={data} />}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
