export interface Student {
  regNo: string;
  name?: string;
  status?: 'present' | 'absent' | null;
}

export interface AttendanceSession {
  students: Student[];
  currentIndex: number;
  isActive: boolean;
  isPaused: boolean;
  startTime: Date | null;
  endTime: Date | null;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  pending: number;
}

// Employee Family Attendance System Types

export interface OtherPerson {
  name: string;
  relation: string;
}

export interface Employee {
  empId: string;
  name: string;
  cluster: 'Vijayawada' | 'Nellore' | 'Visakhapatnam';
  eligibility: string;
  // Expected count: total expected people including employee and spouse
  expectedCount: number;
  kids: Array<{
    name: string;
    ageBracket: string;
  }>;
  // Others field from CSV - other family members (always ineligible)
  others?: string;
  attendance?: {
    employee: boolean;
    spouse: boolean;
    kid1: boolean;
    kid2: boolean;
    kid3: boolean;
  };
}

export interface AttendanceRecord {
  employee: boolean;
  spouse: boolean;
  kid1: boolean;
  kid2: boolean;
  kid3: boolean;
  markedBy: string;
  markedAt: Date;
  kidNames?: {
    kid1?: string;
    kid2?: string;
    kid3?: string;
  };
  // Others: Array of other family members who attended (always ineligible)
  others?: OtherPerson[];
}

export interface ClusterStats {
  cluster: string;
  totalEmployees: number;
  totalExpectedCount: number;  // Sum of expectedCount for eligible employees
  presentHeadCount: number;    // Total present people (including ineligible)
  ineligibleHeadCount: number; // Total ineligible people present
  // Breakdown by category
  eligibleBreakdown: {
    employee: number;
    spouse: number;
    kids: number;
    others: number;  // Always 0 for eligible
  };
  ineligibleBreakdown: {
    employee: number;
    spouse: number;
    kids: number;
    others: number;
  };
}

export interface EmployeeWithAttendance extends Employee {
  attendanceRecord?: AttendanceRecord;
}