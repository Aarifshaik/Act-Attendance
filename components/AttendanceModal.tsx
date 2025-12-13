'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Baby, Clock, CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// Using MongoDB service instead of Firestore
// import { firestoreService } from '@/services/firestore-service';
import { firestoreService } from '@/services/mongodb-wrapper';
import { EmployeeWithAttendance, AttendanceRecord, OtherPerson } from '@/types/attendance';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler, isRetryableError } from '@/hooks/use-error-handler';
import { ModalSkeleton } from '@/components/ui/skeleton-loader';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AttendanceModalProps {
  employee: EmployeeWithAttendance | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: EmployeeWithAttendance) => void;
}

interface AttendanceState {
  employee: boolean;
  spouse: boolean;
  kid1: boolean;
  kid2: boolean;
  kid3: boolean;
}

interface KidNamesState {
  kid1: string;
  kid2: string;
  kid3: string;
}

function AttendanceModalContent({ employee, isOpen, onClose, onSave }: AttendanceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError, clearError, isError, errorMessage } = useErrorHandler();
  
  const [attendance, setAttendance] = useState<AttendanceState>({
    employee: false,
    spouse: false,
    kid1: false,
    kid2: false,
    kid3: false,
  });
  
  const [kidNames, setKidNames] = useState<KidNamesState>({
    kid1: '',
    kid2: '',
    kid3: '',
  });

  // Others state - for additional family members (always ineligible)
  const [others, setOthers] = useState<OtherPerson[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [previewTime, setPreviewTime] = useState<Date>(new Date());
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Token popup state
  const [showTokenPopup, setShowTokenPopup] = useState(false);
  const [tokenDelta, setTokenDelta] = useState<{ type: 'issue' | 'collect' | 'nochange'; count: number }>({ type: 'issue', count: 0 });

  // Helper: count present members from attendance state and others
  const getPresentCount = (att: AttendanceState, kidNames: KidNamesState, others: OtherPerson[]): number => {
    let count = 0;
    if (att.employee) count++;
    if (att.spouse) count++;
    if (att.kid1 && kidNames.kid1?.trim()) count++;
    if (att.kid2 && kidNames.kid2?.trim()) count++;
    if (att.kid3 && kidNames.kid3?.trim()) count++;
    others.forEach(o => {
      if (o.name?.trim()) count++;
    });
    return count;
  };

  const [savedEmployee, setSavedEmployee] = useState<EmployeeWithAttendance | null>(null);

  // Update preview time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize modal state when employee changes
  useEffect(() => {
    if (employee) {
      // Set attendance state from existing record or defaults
      if (employee.attendanceRecord) {
        setAttendance({
          employee: employee.attendanceRecord.employee,
          spouse: employee.attendanceRecord.spouse,
          kid1: employee.attendanceRecord.kid1,
          kid2: employee.attendanceRecord.kid2,
          kid3: employee.attendanceRecord.kid3,
        });
        
        // Set kid names from attendance record or employee data
        setKidNames({
          kid1: employee.attendanceRecord.kidNames?.kid1 || employee.kids?.[0]?.name || '',
          kid2: employee.attendanceRecord.kidNames?.kid2 || employee.kids?.[1]?.name || '',
          kid3: employee.attendanceRecord.kidNames?.kid3 || employee.kids?.[2]?.name || '',
        });

        // Set others from attendance record
        setOthers(employee.attendanceRecord.others || []);
      } else {
        // Reset to defaults for new attendance
        setAttendance({
          employee: false,
          spouse: false,
          kid1: false,
          kid2: false,
          kid3: false,
        });
        
        // Initialize kid names from employee data
        setKidNames({
          kid1: employee.kids?.[0]?.name || '',
          kid2: employee.kids?.[1]?.name || '',
          kid3: employee.kids?.[2]?.name || '',
        });

        // Reset others
        setOthers([]);
      }
    }
  }, [employee]);

  const handleAttendanceChange = (member: keyof AttendanceState, checked: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [member]: checked
    }));
  };

  const handleKidNameChange = (kidKey: keyof KidNamesState, name: string) => {
    setKidNames(prev => ({
      ...prev,
      [kidKey]: name
    }));
    
    // If name is cleared, also uncheck the attendance toggle
    if (!name.trim()) {
      setAttendance(prev => ({
        ...prev,
        [kidKey]: false
      }));
    }
  };

  // Others handlers
  const handleAddOther = () => {
    setOthers(prev => [...prev, { name: '', relation: '' }]);
  };

  const handleRemoveOther = (index: number) => {
    setOthers(prev => prev.filter((_, i) => i !== index));
  };

  const handleOtherChange = (index: number, field: 'name' | 'relation', value: string) => {
    setOthers(prev => prev.map((other, i) => 
      i === index ? { ...other, [field]: value } : other
    ));
  };

  const handleSave = async () => {
    if (!employee || !user) return;

    setIsSaving(true);
    setSaveError(null);
    clearError();
    
    try {
      // Validate required fields
      if (!employee.empId) {
        throw new Error('Employee ID is required');
      }

      // Validate at least one person is marked present (including others)
      const presentCount = Object.values(attendance).filter(Boolean).length + others.filter(o => o.name.trim()).length;
      if (presentCount === 0) {
        throw new Error('Please mark at least one family member as present');
      }

      // Validate kid names are required when marked present
      if (attendance.kid1 && !kidNames.kid1?.trim()) {
        throw new Error('Please enter name for Kid 1');
      }
      if (attendance.kid2 && !kidNames.kid2?.trim()) {
        throw new Error('Please enter name for Kid 2');
      }
      if (attendance.kid3 && !kidNames.kid3?.trim()) {
        throw new Error('Please enter name for Kid 3');
      }

      // Validate others - name is required for each entry
      const invalidOthers = others.filter(o => o.name.trim() === '' && o.relation.trim() !== '');
      if (invalidOthers.length > 0) {
        throw new Error('Please enter name for all Others entries');
      }

      // Filter out completely empty others
      const validOthers = others.filter(o => o.name.trim());

      // Prepare attendance record
      const attendanceRecord: Omit<AttendanceRecord, 'markedAt'> = {
        employee: attendance.employee,
        spouse: attendance.spouse,
        kid1: attendance.kid1,
        kid2: attendance.kid2,
        kid3: attendance.kid3,
        markedBy: user.username,
        kidNames: {
          kid1: kidNames.kid1 || undefined,
          kid2: kidNames.kid2 || undefined,
          kid3: kidNames.kid3 || undefined,
        },
        others: validOthers
      };

      // Save attendance record to Firestore
      await firestoreService.saveAttendanceRecord(employee.empId, attendanceRecord, employee.cluster);

      // Update employee children names if any were entered dynamically
      const updatedKids = [...(employee.kids || [])];
      let shouldUpdateEmployee = false;

      // Check if we need to add/update kid names in employee record
      if (kidNames.kid1 && (!updatedKids[0] || updatedKids[0].name !== kidNames.kid1)) {
        updatedKids[0] = { name: kidNames.kid1, ageBracket: updatedKids[0]?.ageBracket || 'Unknown' };
        shouldUpdateEmployee = true;
      }
      if (kidNames.kid2 && (!updatedKids[1] || updatedKids[1].name !== kidNames.kid2)) {
        updatedKids[1] = { name: kidNames.kid2, ageBracket: updatedKids[1]?.ageBracket || 'Unknown' };
        shouldUpdateEmployee = true;
      }
      if (kidNames.kid3 && (!updatedKids[2] || updatedKids[2].name !== kidNames.kid3)) {
        updatedKids[2] = { name: kidNames.kid3, ageBracket: updatedKids[2]?.ageBracket || 'Unknown' };
        shouldUpdateEmployee = true;
      }

      if (shouldUpdateEmployee) {
        await firestoreService.updateEmployeeChildren(employee.empId, updatedKids);
      }

      // Create updated employee object for callback with current timestamp
      const currentTime = new Date();
      const updatedEmployee: EmployeeWithAttendance = {
        ...employee,
        kids: updatedKids,
        attendanceRecord: {
          ...attendanceRecord,
          markedAt: currentTime
        }
      };

      // Show success toast with enhanced messaging
      const familyMembers = [];
      if (attendance.employee) familyMembers.push('Employee');
      if (attendance.spouse) familyMembers.push('Spouse');
      if (attendance.kid1) familyMembers.push(kidNames.kid1 || 'Child 1');
      if (attendance.kid2) familyMembers.push(kidNames.kid2 || 'Child 2');
      if (attendance.kid3) familyMembers.push(kidNames.kid3 || 'Child 3');
      validOthers.forEach(o => familyMembers.push(o.name || 'Other'));

      toast({
        title: "Attendance Saved Successfully",
        description: `Attendance marked for ${employee.empId}${presentCount > 0 ? ` - ${familyMembers.join(', ')} (${presentCount} member${presentCount !== 1 ? 's' : ''})` : ' - No family members marked present'}`,
        duration: 4000,
      });

      // Calculate token delta
      let deltaType: 'issue' | 'collect' | 'nochange' = 'issue';
      let deltaCount = presentCount;

      if (isEditing && employee.attendanceRecord) {
        // Get previous present count
        const prevAttendance: AttendanceState = {
          employee: employee.attendanceRecord.employee,
          spouse: employee.attendanceRecord.spouse,
          kid1: employee.attendanceRecord.kid1,
          kid2: employee.attendanceRecord.kid2,
          kid3: employee.attendanceRecord.kid3,
        };
        const prevKidNames: KidNamesState = employee.attendanceRecord.kidNames
          ? {
              kid1: employee.attendanceRecord.kidNames.kid1 ?? '',
              kid2: employee.attendanceRecord.kidNames.kid2 ?? '',
              kid3: employee.attendanceRecord.kidNames.kid3 ?? '',
            }
          : { kid1: '', kid2: '', kid3: '' };
        const prevOthers = employee.attendanceRecord.others || [];
        
        const prevCount = getPresentCount(prevAttendance, prevKidNames, prevOthers);
        const currCount = presentCount;
        
        const difference = currCount - prevCount;
        
        if (difference > 0) {
          // More people now - issue extra tokens
          deltaType = 'issue';
          deltaCount = difference;
        } else if (difference < 0) {
          // Fewer people now - collect tokens
          deltaType = 'collect';
          deltaCount = Math.abs(difference);
        } else {
          // Same count - no change
          deltaType = 'nochange';
          deltaCount = 0;
        }
      } else {
        // New attendance - issue tokens for all present
        deltaType = 'issue';
        deltaCount = presentCount;
      }

      setTokenDelta({ type: deltaType, count: deltaCount });
      setSavedEmployee(updatedEmployee);
      setShowTokenPopup(true);

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('Error saving attendance:', errorObj);
      
      setSaveError(errorObj.message);
      handleError(errorObj, {
        toastTitle: "Error Saving Attendance",
        showToast: true,
        retryable: isRetryableError(errorObj),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle token popup OK click
  const handleTokenPopupClose = () => {
    setShowTokenPopup(false);
    if (savedEmployee) {
      onSave(savedEmployee);
    }
    onClose();
  };

  const isEditing = employee?.attendanceRecord !== undefined;
  const buttonText = isEditing ? 'Save Changes' : 'Mark Attendance';
  const basePresentCount = Object.values(attendance).filter(Boolean).length;
  const othersCount = others.filter(o => o.name.trim()).length;
  const presentCount = basePresentCount + othersCount;

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Mark Attendance - {employee.empId}</span>
            {isEditing && (
              <Badge variant="outline" className="text-xs">
                Editing
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Mark attendance for employee {employee.empId}
          </DialogDescription>
        </DialogHeader>

        {/* Compact Layout - All in one view */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Employee Info & Preview */}
          <div className="space-y-3">
            {/* Employee Information - Compact */}
            <Card className="bg-gray-50">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Name</span>
                    <p className="text-gray-900 font-medium truncate">{employee.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Cluster</span>
                    <p className="text-gray-900 font-medium">{employee.cluster}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Eligibility</span>
                    <p className={`font-medium ${employee.eligibility === 'Eligible' ? 'text-green-600' : 'text-red-600'}`}>
                      {employee.eligibility || 'Not Eligible'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Expected Count</span>
                    <p className="text-gray-900 font-medium">{employee.expectedCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Preview - Compact */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 text-sm">Preview</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-blue-600">Marked By:</span>
                    <p className="text-blue-900 font-medium">{user?.displayName || user?.username}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Time:</span>
                    <p className="text-blue-900 font-medium">{previewTime.toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Present:</span>
                    <p className="text-blue-900 font-medium">{presentCount} member(s)</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Status:</span>
                    <div className="flex items-center space-x-1">
                      {presentCount > 0 ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-700 font-medium">Present</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Not marked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Previous record info - only when editing */}
                {isEditing && employee.attendanceRecord && (
                  <div className="mt-2 pt-2 border-t border-blue-200 text-xs">
                    <span className="text-blue-600">Previously by {employee.attendanceRecord.markedBy} at {new Date(employee.attendanceRecord.markedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warning when attendance already taken */}
            {isEditing && employee.attendanceRecord && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-yellow-700 font-medium">
                    Attendance already recorded for {[
                      employee.attendanceRecord.employee && 'Employee',
                      employee.attendanceRecord.spouse && 'Spouse',
                      employee.attendanceRecord.kid1 && (employee.attendanceRecord.kidNames?.kid1 || 'Child 1'),
                      employee.attendanceRecord.kid2 && (employee.attendanceRecord.kidNames?.kid2 || 'Child 2'),
                      employee.attendanceRecord.kid3 && (employee.attendanceRecord.kidNames?.kid3 || 'Child 3'),
                    ].filter(Boolean).join(', ') || 'no members'}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700 truncate">{saveError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Family Member Toggles */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Family Members</span>
            </h3>

            {/* Employee Toggle */}
            <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Employee</p>
                  <p className="text-xs text-gray-500 truncate max-w-[140px]">{employee.name || employee.empId}</p>
                </div>
              </div>
              <Switch
                checked={attendance.employee}
                onCheckedChange={(checked) => handleAttendanceChange('employee', checked)}
              />
            </div>

            {/* Spouse Toggle */}
            <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Spouse</p>
                </div>
              </div>
              <Switch
                checked={attendance.spouse}
                onCheckedChange={(checked) => handleAttendanceChange('spouse', checked)}
              />
            </div>

            {/* Children Toggles - Name required before toggle */}
            {(['kid1', 'kid2', 'kid3'] as const).map((kidKey, index) => {
              const hasName = kidNames[kidKey]?.trim().length > 0;
              return (
                <div
                  key={kidKey}
                  className={`p-2 border rounded-lg space-y-1 ${hasName ? 'bg-gray-50' : 'bg-gray-100'}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Baby className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-gray-900 text-sm">Child {index + 1}</p>
                    {!hasName && (
                      <span className="text-xs text-orange-500">(Enter name to mark)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder={`Child ${index + 1} name...`}
                      value={kidNames[kidKey]}
                      onChange={(e) => handleKidNameChange(kidKey, e.target.value)}
                      className="text-xs h-7 flex-1"
                    />
                    <Switch
                      checked={attendance[kidKey]}
                      onCheckedChange={(checked) => handleAttendanceChange(kidKey, checked)}
                      disabled={!hasName}
                      className={!hasName ? 'opacity-50' : ''}
                    />
                  </div>
                </div>
              );
            })}

            {/* Others Section - Additional family members (always ineligible) */}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span>Others (Ineligible)</span>
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOther}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {others.length === 0 && (
                <p className="text-xs text-gray-500 italic">No others added</p>
              )}
              
              {others.map((other, index) => {
                const hasName = other.name?.trim().length > 0;
                return (
                  <div key={index} className={`flex items-center space-x-2 mb-2 p-2 rounded-lg ${hasName ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${hasName ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {hasName && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <Input
                      placeholder="Name (required)..."
                      value={other.name}
                      onChange={(e) => handleOtherChange(index, 'name', e.target.value)}
                      className={`text-xs h-7 flex-1 ${!hasName ? 'border-orange-300' : ''}`}
                    />
                    <Input
                      placeholder="Relation..."
                      value={other.relation}
                      onChange={(e) => handleOtherChange(index, 'relation', e.target.value)}
                      className="text-xs h-7 w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOther(index)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
              {others.length > 0 && others.some(o => !o.name?.trim()) && (
                <p className="text-xs text-orange-500 mt-1">⚠️ Enter name for all others to count them</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || presentCount === 0}
            className="min-w-[100px]"
            size="sm"
            title={presentCount === 0 ? 'Please select at least one family member' : ''}
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              buttonText
            )}
          </Button>
        </DialogFooter>

        {/* Validation hint when no one selected */}
        {presentCount === 0 && (
          <p className="text-xs text-orange-600 text-center -mt-1">
            Please select at least one family member to mark attendance
          </p>
        )}
      </DialogContent>

      {/* Token Count Popup */}
      <AlertDialog open={showTokenPopup} onOpenChange={setShowTokenPopup}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl">
              🎟️ Token Count
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xl font-bold py-4">
              {tokenDelta.type === 'nochange' ? (
                <span className="text-gray-600">No change in tokens</span>
              ) : tokenDelta.type === 'issue' ? (
                <>
                  Issue <span className="text-3xl text-green-600">{tokenDelta.count}</span> token set{tokenDelta.count !== 1 ? 's' : ''}
                </>
              ) : (
                <>
                  Collect <span className="text-3xl text-red-600">{tokenDelta.count}</span> token set{tokenDelta.count !== 1 ? 's' : ''}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center sm:justify-center">
            <AlertDialogAction 
              onClick={handleTokenPopupClose}
              className="bg-green-600 hover:bg-green-700 px-8 py-2 text-lg"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// Export with error boundary
export default function AttendanceModal(props: AttendanceModalProps) {
  return (
    <ErrorBoundary
      fallback={
        <Dialog open={props.isOpen} onOpenChange={props.onClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Modal Error</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                An error occurred in the attendance modal
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center space-y-4">
              <p className="text-gray-600">
                The attendance modal encountered an error. Please close and try again.
              </p>
              <Button onClick={props.onClose}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Close and Retry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <AttendanceModalContent {...props} />
    </ErrorBoundary>
  );
}