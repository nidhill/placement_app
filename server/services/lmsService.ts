import { StudentProfile } from '../../src/types.ts';
import { dbStore } from '../db/store.ts';

export interface ExternalLmsStudentPayload {
  externalId: string;
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  programName: string;
  cohortBatch: string;
  mentorEmail: string;
  courseTitle: string;
  gpa: number;
  attendanceRate: number;
  completedAssignments: number;
  totalAssignments: number;
  skillsAcquired: string[];
  projectsSubmitted: {
    title: string;
    description: string;
    repoUrl?: string;
  }[];
}

/**
 * LMS / SSHO Integration Service Adapter
 * Provides normalized synchronization between HACA LMS and Placement Platform.
 */
export class LmsSyncService {
  /**
   * Sample external LMS records available for manual/automated sync
   */
  private static mockExternalLmsRecords: ExternalLmsStudentPayload[] = [
    {
      externalId: 'LMS-9941',
      fullName: 'Ayesha Siddiqua',
      email: 'ayesha.siddiqua@student.haca.edu',
      phone: '+92 322 9988112',
      schoolName: 'School of Tech',
      programName: 'Full Stack Web Development',
      cohortBatch: '2026-Q1',
      mentorEmail: 'mentor.salman@haca.edu',
      courseTitle: 'Full Stack Web Engineering',
      gpa: 89.0,
      attendanceRate: 91.5,
      completedAssignments: 23,
      totalAssignments: 24,
      skillsAcquired: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Git'],
      projectsSubmitted: [
        {
          title: 'Doctor Appointment Booking Engine',
          description: 'RESTful API with schedule slots and automated SMS notification queue.',
          repoUrl: 'https://github.com/ayesha/telehealth-app'
        }
      ]
    },
    {
      externalId: 'LMS-9942',
      fullName: 'Danish Qureshi',
      email: 'danish.q@student.haca.edu',
      phone: '+92 344 1122334',
      schoolName: 'School of Design',
      programName: 'UI/UX Product Design',
      cohortBatch: '2025-Q4',
      mentorEmail: 'mentor.sarah@haca.edu',
      courseTitle: 'Product Design Systems',
      gpa: 83.0,
      attendanceRate: 88.0,
      completedAssignments: 19,
      totalAssignments: 20,
      skillsAcquired: ['Figma', 'Wireframing', 'User Research', 'Prototyping'],
      projectsSubmitted: [
        {
          title: 'Ride-Hailing Driver App UX Case Study',
          description: 'Simplifying route acceptance with high contrast night mode.'
        }
      ]
    }
  ];

  /**
   * Syncs external LMS payload into HACA Placement Platform database
   * Handles duplicate detection and safe update of academic indicators.
   */
  public static syncFromLms(actor: { id: string; name: string; role: any }): {
    syncedCount: number;
    updatedCount: number;
    newStudents: string[];
  } {
    let syncedCount = 0;
    let updatedCount = 0;
    const newStudents: string[] = [];

    const currentStudents = dbStore.getAllStudents();

    this.mockExternalLmsRecords.forEach(lmsRecord => {
      const existing = currentStudents.find(
        s => s.email.toLowerCase() === lmsRecord.email.toLowerCase()
      );

      if (existing) {
        // Safe update of academic scores without resetting mentor approval if already approved
        dbStore.updateStudentProfile(
          existing.id,
          {
            academic: {
              ...existing.academic,
              course: lmsRecord.courseTitle,
              attendancePercentage: lmsRecord.attendanceRate,
              scores: {
                ...existing.academic.scores,
                gpaOrPercentage: lmsRecord.gpa,
                assignmentsCompleted: lmsRecord.completedAssignments,
                totalAssignments: lmsRecord.totalAssignments
              },
              skills: Array.from(new Set([...existing.academic.skills, ...lmsRecord.skillsAcquired]))
            }
          },
          actor
        );
        updatedCount += 1;
      } else {
        // Ingest new student in NOT_EVALUATED state (Gated: requires mentor approval)
        const newStudentId = `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        
        // Find mentor
        const mentors = dbStore.getAllUsers().filter(u => u.role === 'MENTOR');
        const assignedMentor = mentors.find(m => m.email.toLowerCase() === lmsRecord.mentorEmail.toLowerCase()) || mentors[0];

        const newProfile: StudentProfile = {
          id: newStudentId,
          registrationNo: `HACA-${lmsRecord.cohortBatch}-${lmsRecord.externalId}`,
          fullName: lmsRecord.fullName,
          email: lmsRecord.email,
          phone: lmsRecord.phone,
          school: lmsRecord.schoolName,
          program: lmsRecord.programName,
          batch: lmsRecord.cohortBatch,
          mentorId: assignedMentor ? assignedMentor.id : 'user-mentor-1',
          mentorName: assignedMentor ? assignedMentor.fullName : 'Lead Mentor',
          eligibilityStatus: 'NOT_EVALUATED', // Starts gated!
          evaluationNotes: 'Imported from LMS. Pending mentor evaluation.',
          academic: {
            course: lmsRecord.courseTitle,
            scores: {
              gpaOrPercentage: lmsRecord.gpa,
              assignmentsCompleted: lmsRecord.completedAssignments,
              totalAssignments: lmsRecord.totalAssignments
            },
            attendancePercentage: lmsRecord.attendanceRate,
            skills: lmsRecord.skillsAcquired,
            projects: lmsRecord.projectsSubmitted.map((p, idx) => ({
              id: `lms-proj-${idx + 1}`,
              title: p.title,
              description: p.description,
              status: 'COMPLETED',
              githubUrl: p.repoUrl
            })),
            readinessGaps: {
              missingSkills: [],
              missingProjects: [],
              attendanceWarning: lmsRecord.attendanceRate < 85
            }
          },
          inactivityFlags: {
            hasNotApplied: true,
            consecutiveRejections: 0,
            noInterviewFollowUp: false
          },
          createdAt: new Date().toISOString()
        };

        // Create user account for student
        dbStore.provisionUser({
          email: newProfile.email,
          fullName: newProfile.fullName,
          role: 'STUDENT',
          department: newProfile.school,
          isActive: true
        }, actor);

        // Save student
        (dbStore as any).students.set(newStudentId, newProfile);
        newStudents.push(newProfile.fullName);
        syncedCount += 1;
      }
    });

    dbStore.updateLmsConfig({
      lastSyncTimestamp: new Date().toISOString(),
      totalRecordsSynced: dbStore.getLmsConfig().totalRecordsSynced + syncedCount + updatedCount,
      status: 'CONNECTED'
    }, actor);

    dbStore.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'LMS_DATA_SYNC',
      entityType: 'LMS_SYNC',
      entityId: 'BATCH',
      details: `LMS sync completed: ${syncedCount} new student records ingested, ${updatedCount} academic profiles updated.`
    });

    return { syncedCount, updatedCount, newStudents };
  }
}
