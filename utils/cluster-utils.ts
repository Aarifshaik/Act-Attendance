import { Employee, AttendanceRecord, EmployeeWithAttendance, ClusterStats, OtherPerson } from '@/types/attendance';

export type ClusterType = 'Vijayawada' | 'Nellore' | 'Visakhapatnam';

export const CLUSTERS: ClusterType[] = ['Vijayawada', 'Nellore', 'Visakhapatnam'];

/**
 * Filter employees by cluster
 */
export function filterEmployeesByCluster(employees: Employee[], cluster: ClusterType): Employee[] {
  return employees.filter(employee => employee.cluster === cluster);
}

/**
 * Filter employees with attendance by cluster
 */
export function filterEmployeesWithAttendanceByCluster(
  employees: EmployeeWithAttendance[], 
  cluster: ClusterType
): EmployeeWithAttendance[] {
  return employees.filter(employee => employee.cluster === cluster);
}

/**
 * Group employees by cluster
 */
export function groupEmployeesByCluster(employees: Employee[]): Record<ClusterType, Employee[]> {
  const grouped: Record<ClusterType, Employee[]> = {
    'Vijayawada': [],
    'Nellore': [],
    'Visakhapatnam': []
  };

  employees.forEach(employee => {
    if (CLUSTERS.includes(employee.cluster)) {
      grouped[employee.cluster].push(employee);
    }
  });

  return grouped;
}

/**
 * Check if employee is eligible
 */
export function isEmployeeEligible(employee: Employee): boolean {
  return employee.eligibility?.toLowerCase() === 'eligible';
}

/**
 * Calculate detailed attendance breakdown for stats
 */
export interface DetailedAttendanceStats {
  totalExpectedCount: number;      // Sum of expectedCount for eligible employees
  totalPresentHeadCount: number;   // Total present people (all)
  totalIneligibleHeadCount: number; // Total ineligible people present
  eligibleBreakdown: {
    employee: number;
    spouse: number;
    kids: number;
    others: number;  // Always 0
  };
  ineligibleBreakdown: {
    employee: number;
    spouse: number;
    kids: number;
    others: number;
  };
}

/**
 * Calculate detailed stats for employees
 */
export function calculateDetailedStats(employees: EmployeeWithAttendance[]): DetailedAttendanceStats {
  const stats: DetailedAttendanceStats = {
    totalExpectedCount: 0,
    totalPresentHeadCount: 0,
    totalIneligibleHeadCount: 0,
    eligibleBreakdown: { employee: 0, spouse: 0, kids: 0, others: 0 },
    ineligibleBreakdown: { employee: 0, spouse: 0, kids: 0, others: 0 }
  };

  employees.forEach(emp => {
    const isEligible = isEmployeeEligible(emp);
    const expectedCount = emp.expectedCount || 0;
    
    // Add to total expected count only for eligible employees
    if (isEligible) {
      stats.totalExpectedCount += expectedCount;
    }

    if (emp.attendanceRecord) {
      const record = emp.attendanceRecord;
      let eligibleCountUsed = 0;
      
      // Employee attendance
      if (record.employee) {
        stats.totalPresentHeadCount++;
        if (isEligible && eligibleCountUsed < expectedCount) {
          stats.eligibleBreakdown.employee++;
          eligibleCountUsed++;
        } else {
          stats.ineligibleBreakdown.employee++;
          stats.totalIneligibleHeadCount++;
        }
      }

      // Spouse attendance
      if (record.spouse) {
        stats.totalPresentHeadCount++;
        if (isEligible && eligibleCountUsed < expectedCount) {
          stats.eligibleBreakdown.spouse++;
          eligibleCountUsed++;
        } else {
          stats.ineligibleBreakdown.spouse++;
          stats.totalIneligibleHeadCount++;
        }
      }

      // Kids attendance
      const kidFields: ('kid1' | 'kid2' | 'kid3')[] = ['kid1', 'kid2', 'kid3'];
      kidFields.forEach(kidField => {
        if (record[kidField]) {
          stats.totalPresentHeadCount++;
          if (isEligible && eligibleCountUsed < expectedCount) {
            stats.eligibleBreakdown.kids++;
            eligibleCountUsed++;
          } else {
            stats.ineligibleBreakdown.kids++;
            stats.totalIneligibleHeadCount++;
          }
        }
      });

      // Others attendance (always ineligible)
      const othersCount = record.others?.length || 0;
      stats.totalPresentHeadCount += othersCount;
      stats.ineligibleBreakdown.others += othersCount;
      stats.totalIneligibleHeadCount += othersCount;
    }
  });

  return stats;
}

/**
 * Calculate attendance statistics for a cluster
 */
export function calculateClusterAttendanceStats(employees: EmployeeWithAttendance[]): {
  totalEmployees: number;
  presentEmployees: number;
  pendingEmployees: number;
  attendanceRate: number;
} {
  const totalEmployees = employees.length;
  const presentEmployees = employees.filter(employee => 
    employee.attendanceRecord && hasAnyAttendance(employee.attendanceRecord)
  ).length;
  const pendingEmployees = totalEmployees - presentEmployees;
  const attendanceRate = totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;

  return {
    totalEmployees,
    presentEmployees,
    pendingEmployees,
    attendanceRate: Math.round(attendanceRate * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Check if an attendance record has any family member marked as present
 */
export function hasAnyAttendance(record: AttendanceRecord): boolean {
  return !!(record.employee || record.spouse || record.kid1 || record.kid2 || record.kid3 || 
         (record.others && record.others.length > 0));
}

/**
 * Count total family members marked as present in an attendance record
 */
export function countPresentMembers(record: AttendanceRecord): number {
  let count = 0;
  if (record.employee) count++;
  if (record.spouse) count++;
  if (record.kid1) count++;
  if (record.kid2) count++;
  if (record.kid3) count++;
  count += record.others?.length || 0;
  return count;
}

/**
 * Get attendance status summary for an employee
 */
export function getAttendanceStatusSummary(employee: EmployeeWithAttendance): {
  status: 'present' | 'pending';
  presentCount: number;
  totalPossibleMembers: number;
} {
  if (!employee.attendanceRecord) {
    return {
      status: 'pending',
      presentCount: 0,
      totalPossibleMembers: getTotalPossibleMembers(employee)
    };
  }

  const presentCount = countPresentMembers(employee.attendanceRecord);
  const status = presentCount > 0 ? 'present' : 'pending';
  
  return {
    status,
    presentCount,
    totalPossibleMembers: getTotalPossibleMembers(employee)
  };
}

/**
 * Calculate total possible family members for an employee
 */
export function getTotalPossibleMembers(employee: Employee): number {
  // Employee + spouse + up to 3 children (based on expectedCount)
  return employee.expectedCount || 2;
}

/**
 * Validate cluster name
 */
export function isValidCluster(cluster: string): cluster is ClusterType {
  return CLUSTERS.includes(cluster as ClusterType);
}

/**
 * Get cluster display name with formatting
 */
export function getClusterDisplayName(cluster: ClusterType): string {
  return cluster;
}

/**
 * Sort employees by name within cluster
 */
export function sortEmployeesByName(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort employees by empId within cluster
 */
export function sortEmployeesByEmpId(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => a.empId.localeCompare(b.empId));
}

/**
 * Filter employees by search term (name or empId)
 */
export function filterEmployeesBySearch(employees: Employee[], searchTerm: string): Employee[] {
  if (!searchTerm.trim()) {
    return employees;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  return employees.filter(employee => 
    employee.name.toLowerCase().includes(lowerSearchTerm) ||
    employee.empId.toLowerCase().includes(lowerSearchTerm)
  );
}

/**
 * Create cluster statistics summary with new detailed stats
 */
export function createClusterStatsSummary(employees: EmployeeWithAttendance[]): ClusterStats[] {
  // Group employees by cluster (using EmployeeWithAttendance type)
  const grouped: Record<ClusterType, EmployeeWithAttendance[]> = {
    'Vijayawada': [],
    'Nellore': [],
    'Visakhapatnam': []
  };
  
  employees.forEach(employee => {
    if (CLUSTERS.includes(employee.cluster as ClusterType)) {
      grouped[employee.cluster as ClusterType].push(employee);
    }
  });
  
  return CLUSTERS.map(cluster => {
    const clusterEmployees = grouped[cluster];
    const detailedStats = calculateDetailedStats(clusterEmployees);
    
    return {
      cluster,
      totalEmployees: clusterEmployees.length,
      totalExpectedCount: detailedStats.totalExpectedCount,
      presentHeadCount: detailedStats.totalPresentHeadCount,
      ineligibleHeadCount: detailedStats.totalIneligibleHeadCount,
      eligibleBreakdown: detailedStats.eligibleBreakdown,
      ineligibleBreakdown: detailedStats.ineligibleBreakdown
    };
  });
}