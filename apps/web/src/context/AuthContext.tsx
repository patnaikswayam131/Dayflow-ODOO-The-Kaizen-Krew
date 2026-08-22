import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, AttendanceStatus, LeaveStatus } from '@dayflow/shared';

export interface UserProfile {
  id: string;
  loginId: string;
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  role: UserRole;
  department: string;
  jobPosition: string;
  location: string;
  dateOfJoining: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  residingAddress?: string;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;
  panNo?: string;
  uanNo?: string;
  about?: string;
  jobLoveText?: string;
  interests?: string;
  skills: string[];
  certifications: { name: string; issuedBy: string; issuedOn: string }[];
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  monthlyWage: number;
}

export interface AttendanceRecordItem {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workHours: number;
  extraHours: number;
  status: AttendanceStatus;
}

export interface LeaveRequestItem {
  id: string;
  userId: string;
  userName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  remarks: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface LeaveBalanceItem {
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
}

export interface EmployeeCreateInput extends Partial<UserProfile> {
  companyName?: string;
}

export interface CompanyAdminRegistration {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: UserProfile;
  currentRole: UserRole;
  isCheckedIn: boolean;
  employees: UserProfile[];
  attendanceRecords: AttendanceRecordItem[];
  leaveRequests: LeaveRequestItem[];
  leaveBalances: LeaveBalanceItem[];
  toggleCheckIn: () => void;
  addEmployee: (employee: EmployeeCreateInput) => {
    user: UserProfile;
    generatedPassword: string;
  };
  registerCompanyAdmin: (registration: CompanyAdminRegistration) => {
    user: UserProfile;
    generatedPassword: string;
  };
  updateEmployeeProfile: (userId: string, data: Partial<UserProfile>) => void;
  submitLeaveRequest: (req: { leaveTypeName: string; startDate: string; endDate: string; remarks: string }) => void;
  approveLeaveRequest: (requestId: string, comment?: string) => void;
  rejectLeaveRequest: (requestId: string, comment?: string) => void;
  login: (identifier: string, password?: string) => UserProfile | null;
  logout: () => void;
}

const INITIAL_EMPLOYEES: UserProfile[] = [
  {
    id: 'user-admin',
    loginId: 'OIJODO20220001',
    empCode: 'EMP-001',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'admin@dayflow.com',
    personalEmail: 'sarah.j@gmail.com',
    phone: '+1 (555) 234-5678',
    role: UserRole.ADMIN,
    department: 'Executive',
    jobPosition: 'VP of Human Resources',
    location: 'San Francisco, CA',
    dateOfJoining: '2022-01-15',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    dateOfBirth: '1988-06-20',
    residingAddress: '123 Market St, San Francisco, CA',
    nationality: 'American',
    gender: 'Female',
    maritalStatus: 'Married',
    panNo: 'ABCDE1234F',
    uanNo: '100908070605',
    about: 'Passionate HR leader building high-performing, aligned engineering and operations teams.',
    jobLoveText: 'Empowering employees and driving kaizen across all departments.',
    interests: 'Technology, Team Building, Marathon Running',
    skills: ['HR Strategy', 'Leadership', 'Compensation & Benefits', 'Conflict Resolution'],
    certifications: [
      { name: 'SHRM Senior Certified Professional', issuedBy: 'SHRM', issuedOn: '2021-04-10' },
    ],
    bankDetails: {
      accountNumber: '**** **** 4892',
      bankName: 'Silicon Valley Bank',
      ifscCode: 'SVBK0001234',
    },
    monthlyWage: 85000,
  },
  {
    id: 'user-hr',
    loginId: 'OIJODO20220002',
    empCode: 'EMP-002',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'hr@dayflow.com',
    personalEmail: 'alex.rivera@outlook.com',
    phone: '+1 (555) 345-6789',
    role: UserRole.HR_OFFICER,
    department: 'Human Resources',
    jobPosition: 'HR Operations Manager',
    location: 'Austin, TX',
    dateOfJoining: '2022-05-01',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    dateOfBirth: '1992-03-14',
    residingAddress: '456 Congress Ave, Austin, TX',
    nationality: 'American',
    gender: 'Male',
    maritalStatus: 'Single',
    panNo: 'FGHIJ5678K',
    uanNo: '100908070606',
    about: 'Managing daily HR operations, onboarding, and attendance compliance.',
    jobLoveText: 'Creating seamless onboarding experiences for new hires.',
    interests: 'Photography, Cycling, Coffee Brewing',
    skills: ['HR Operations', 'Employee Onboarding', 'Attendance Management', 'Compliance'],
    certifications: [
      { name: 'PHR Professional in Human Resources', issuedBy: 'HRCI', issuedOn: '2022-08-15' },
    ],
    bankDetails: {
      accountNumber: '**** **** 9012',
      bankName: 'Chase Bank',
      ifscCode: 'CHAS0005678',
    },
    monthlyWage: 65000,
  },
  {
    id: 'user-emp',
    loginId: 'OIJODO20220003',
    empCode: 'EMP-003',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@dayflow.com',
    personalEmail: 'john.doe.dev@gmail.com',
    phone: '+1 (555) 456-7890',
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    jobPosition: 'Senior Software Engineer',
    location: 'Seattle, WA',
    dateOfJoining: '2023-02-10',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    dateOfBirth: '1994-11-05',
    residingAddress: '789 Pine St, Seattle, WA',
    nationality: 'American',
    gender: 'Male',
    maritalStatus: 'Single',
    panNo: 'LMNOP9012Q',
    uanNo: '100908070607',
    about: 'Full-stack engineer working on modern React and TypeScript architecture.',
    jobLoveText: 'Solving complex engineering challenges and shipping impactful features.',
    interests: 'Open Source, Gaming, Hiking',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL'],
    certifications: [
      { name: 'AWS Certified Solutions Architect', issuedBy: 'Amazon Web Services', issuedOn: '2023-06-20' },
    ],
    bankDetails: {
      accountNumber: '**** **** 3456',
      bankName: 'Bank of America',
      ifscCode: 'BOFA0009012',
    },
    monthlyWage: 50000,
  },
];

const formatOffsetDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const getCompanyCode = (companyName: string) => {
  const words = companyName.trim().split(/\s+/).filter(Boolean);
  const fromWords =
    words.length >= 2
      ? words.map((word) => word.charAt(0)).join('')
      : companyName.replace(/[^a-z]/gi, '').slice(0, 2);
  return (fromWords || 'DF').slice(0, 2).toUpperCase().padEnd(2, 'X');
};

const getNameCode = (firstName: string, lastName: string) => {
  const first = (firstName || 'NA').replace(/[^a-z]/gi, '').slice(0, 2);
  const last = (lastName || 'US').replace(/[^a-z]/gi, '').slice(0, 2);
  return `${first}${last}`.toUpperCase().padEnd(4, 'X');
};

const buildLoginId = (
  companyName: string,
  firstName: string,
  lastName: string,
  joiningYear: number,
  sequence: number,
) =>
  `${getCompanyCode(companyName)}${getNameCode(firstName, lastName)}${joiningYear}${String(
    sequence,
  ).padStart(4, '0')}`;

const INITIAL_ATTENDANCE: AttendanceRecordItem[] = [
  {
    id: 'att-1',
    userId: 'user-admin',
    userName: 'Sarah Jenkins',
    date: formatOffsetDate(),
    checkInAt: '09:00 AM',
    checkOutAt: null,
    workHours: 4.5,
    extraHours: 0,
    status: AttendanceStatus.PRESENT,
  },
  {
    id: 'att-2',
    userId: 'user-hr',
    userName: 'Alex Rivera',
    date: formatOffsetDate(),
    checkInAt: '08:45 AM',
    checkOutAt: null,
    workHours: 4.75,
    extraHours: 0,
    status: AttendanceStatus.PRESENT,
  },
  {
    id: 'att-3',
    userId: 'user-emp',
    userName: 'John Doe',
    date: formatOffsetDate(),
    checkInAt: null,
    checkOutAt: null,
    workHours: 0,
    extraHours: 0,
    status: AttendanceStatus.ABSENT,
  },
  {
    id: 'att-4',
    userId: 'user-admin',
    userName: 'Sarah Jenkins',
    date: formatOffsetDate(-1),
    checkInAt: '09:05 AM',
    checkOutAt: '06:10 PM',
    workHours: 8.1,
    extraHours: 0.1,
    status: AttendanceStatus.PRESENT,
  },
  {
    id: 'att-5',
    userId: 'user-hr',
    userName: 'Alex Rivera',
    date: formatOffsetDate(-1),
    checkInAt: '10:15 AM',
    checkOutAt: '02:20 PM',
    workHours: 4.0,
    extraHours: 0,
    status: AttendanceStatus.HALF_DAY,
  },
  {
    id: 'att-6',
    userId: 'user-emp',
    userName: 'John Doe',
    date: formatOffsetDate(-1),
    checkInAt: '09:20 AM',
    checkOutAt: '06:05 PM',
    workHours: 7.75,
    extraHours: 0,
    status: AttendanceStatus.PRESENT,
  },
  {
    id: 'att-7',
    userId: 'user-admin',
    userName: 'Sarah Jenkins',
    date: formatOffsetDate(-2),
    checkInAt: '09:00 AM',
    checkOutAt: '05:45 PM',
    workHours: 7.75,
    extraHours: 0,
    status: AttendanceStatus.PRESENT,
  },
  {
    id: 'att-8',
    userId: 'user-hr',
    userName: 'Alex Rivera',
    date: formatOffsetDate(-2),
    checkInAt: null,
    checkOutAt: null,
    workHours: 0,
    extraHours: 0,
    status: AttendanceStatus.LEAVE,
  },
  {
    id: 'att-9',
    userId: 'user-emp',
    userName: 'John Doe',
    date: formatOffsetDate(-2),
    checkInAt: '08:55 AM',
    checkOutAt: '05:55 PM',
    workHours: 8,
    extraHours: 0,
    status: AttendanceStatus.PRESENT,
  },
];

const INITIAL_LEAVE_REQUESTS: LeaveRequestItem[] = [
  {
    id: 'lr-1',
    userId: 'user-emp',
    userName: 'John Doe',
    leaveTypeName: 'Paid Time Off',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    daysRequested: 3,
    remarks: 'Annual family vacation trip.',
    status: LeaveStatus.PENDING,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lr-2',
    userId: 'user-hr',
    userName: 'Alex Rivera',
    leaveTypeName: 'Sick Leave',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    daysRequested: 2,
    remarks: 'Dental surgery procedure.',
    status: LeaveStatus.APPROVED,
    reviewedBy: 'Sarah Jenkins',
    reviewedAt: '2026-08-09',
    reviewComment: 'Approved. Get well soon!',
    createdAt: '2026-08-08',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_ID_KEY = 'dayflow-auth-user-id';
const EMPLOYEES_KEY = 'dayflow-employees';
const REGISTERED_USER_KEY = 'dayflow-registered-user';
const PASSWORDS_KEY = 'dayflow-passwords';

const readSessionJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeSessionJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
};

const getInitialEmployees = () => {
  const storedEmployees = readSessionJson<UserProfile[]>(EMPLOYEES_KEY);
  if (storedEmployees?.length) {
    return storedEmployees;
  }

  const registeredUser = readSessionJson<UserProfile>(REGISTERED_USER_KEY);
  if (!registeredUser || INITIAL_EMPLOYEES.some((employee) => employee.id === registeredUser.id)) {
    return INITIAL_EMPLOYEES;
  }
  return [...INITIAL_EMPLOYEES, registeredUser];
};

const getStoredUserId = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(AUTH_USER_ID_KEY);
};

const getInitialPasswords = () => ({
  ...Object.fromEntries(INITIAL_EMPLOYEES.map((employee) => [employee.id, 'Password123!'])),
  ...(readSessionJson<Record<string, string>>(PASSWORDS_KEY) ?? {}),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<UserProfile[]>(getInitialEmployees);
  const [passwords, setPasswords] = useState<Record<string, string>>(getInitialPasswords);
  const initialUser = employees.find((employee) => employee.id === getStoredUserId()) ?? employees[0]!;
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(getStoredUserId() && employees.some((employee) => employee.id === getStoredUserId())),
  );
  const [currentRole, setCurrentRole] = useState<UserRole>(initialUser.role);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(INITIAL_LEAVE_REQUESTS);

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([
    { leaveTypeName: 'Paid Time Off', allocatedDays: 24, usedDays: 3 },
    { leaveTypeName: 'Sick Leave', allocatedDays: 7, usedDays: 2 },
    { leaveTypeName: 'Unpaid Leave', allocatedDays: 999, usedDays: 0 },
  ]);

  // Sync currentUser when the active role changes, without overriding newly created users.
  useEffect(() => {
    const currentUserStillMatches = currentUser.role === currentRole && employees.some((e) => e.id === currentUser.id);
    if (currentUserStillMatches) return;

    const match = employees.find((e) => e.role === currentRole);
    if (match) {
      setCurrentUser(match);
    }
  }, [currentRole, currentUser.id, currentUser.role, employees]);

  useEffect(() => {
    const todayStr = formatOffsetDate();
    const todayRecord = attendanceRecords.find(
      (record) => record.userId === currentUser.id && record.date === todayStr
    );
    setIsCheckedIn(
      Boolean(
        todayRecord?.checkInAt &&
          !todayRecord.checkOutAt &&
          todayRecord.status === AttendanceStatus.PRESENT
      )
    );
  }, [attendanceRecords, currentUser.id]);

  const toggleCheckIn = () => {
    const nextState = !isCheckedIn;
    setIsCheckedIn(nextState);

    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.userId === currentUser.id && r.date === todayStr);
      if (idx >= 0) {
        const updated = [...prev];
        const existing = updated[idx]!;
        if (nextState) {
          updated[idx] = {
            ...existing,
            checkInAt: nowTimeStr,
            checkOutAt: null,
            workHours: 0,
            status: AttendanceStatus.PRESENT,
          };
        } else {
          updated[idx] = {
            ...existing,
            checkOutAt: nowTimeStr,
            workHours: 8.0,
            status: AttendanceStatus.PRESENT,
          };
        }
        return updated;
      }
 else {
        return [
          {
            id: `att-${Date.now()}`,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            date: todayStr,
            checkInAt: nowTimeStr,
            checkOutAt: null,
            workHours: 4.0,
            extraHours: 0,
            status: AttendanceStatus.PRESENT,
          },
          ...prev,
        ];
      }
    });
  };

  const addEmployee = (newEmp: EmployeeCreateInput) => {
    const seq = String(employees.length + 1).padStart(4, '0');
    const joiningYear = new Date().getFullYear();
    const generatedLoginId = buildLoginId(
      newEmp.companyName || 'Odoo India',
      newEmp.firstName || 'New',
      newEmp.lastName || 'Employee',
      joiningYear,
      employees.length + 1,
    );
    const generatedEmpCode = `EMP-${seq}`;

    const created: UserProfile = {
      id: `user-${Date.now()}`,
      loginId: newEmp.loginId || generatedLoginId,
      empCode: newEmp.empCode || generatedEmpCode,
      firstName: newEmp.firstName || 'New',
      lastName: newEmp.lastName || 'Employee',
      email: newEmp.email || `${newEmp.firstName?.toLowerCase()}@dayflow.com`,
      phone: newEmp.phone || '+1 (555) 000-0000',
      role: newEmp.role || UserRole.EMPLOYEE,
      department: newEmp.department || 'Engineering',
      jobPosition: newEmp.jobPosition || 'Software Engineer',
      location: newEmp.location || 'San Francisco, CA',
      dateOfJoining: new Date().toISOString().slice(0, 10),
      avatarUrl: newEmp.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      skills: ['Teamwork', 'Problem Solving'],
      certifications: [],
      monthlyWage: newEmp.monthlyWage || 50000,
    };

    setEmployees((prev) => {
      const next = [...prev, created];
      writeSessionJson(EMPLOYEES_KEY, next);
      return next;
    });
    const generatedPassword = `Dayflow@${joiningYear}${seq}`;
    setPasswords((prev) => {
      const next = { ...prev, [created.id]: generatedPassword };
      writeSessionJson(PASSWORDS_KEY, next);
      return next;
    });

    return {
      user: created,
      generatedPassword,
    };
  };

  const registerCompanyAdmin = (registration: CompanyAdminRegistration) => {
    const nameParts = registration.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Company';
    const lastName = nameParts.slice(1).join(' ') || 'Admin';
    const sequence = employees.length + 1;
    const joiningYear = new Date().getFullYear();
    const created: UserProfile = {
      id: `user-admin-${Date.now()}`,
      loginId: buildLoginId(registration.companyName, firstName, lastName, joiningYear, sequence),
      empCode: `EMP-${String(sequence).padStart(4, '0')}`,
      firstName,
      lastName,
      email: registration.email,
      phone: registration.phone,
      role: UserRole.ADMIN,
      department: 'Executive',
      jobPosition: 'Company Admin',
      location: 'Remote',
      dateOfJoining: new Date().toISOString().slice(0, 10),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      about: `First administrator for ${registration.companyName}.`,
      jobLoveText: 'Setting up a more organized workday for every employee.',
      interests: 'People Operations, Workflow Automation',
      skills: ['Company Setup', 'Employee Onboarding', 'HR Administration'],
      certifications: [],
      monthlyWage: 0,
    };

    setEmployees((prev) => {
      const next = [...prev, created];
      writeSessionJson(EMPLOYEES_KEY, next);
      return next;
    });
    setPasswords((prev) => {
      const next = { ...prev, [created.id]: registration.password };
      writeSessionJson(PASSWORDS_KEY, next);
      return next;
    });
    setCurrentUser(created);
    setCurrentRole(UserRole.ADMIN);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUTH_USER_ID_KEY, created.id);
    }
    writeSessionJson(REGISTERED_USER_KEY, created);

    return {
      user: created,
      generatedPassword: registration.password,
    };
  };

  const updateEmployeeProfile = (userId: string, data: Partial<UserProfile>) => {
    setEmployees((prev) => {
      const next = prev.map((e) => (e.id === userId ? { ...e, ...data } : e));
      writeSessionJson(EMPLOYEES_KEY, next);
      return next;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...data }));
    }
  };

  const submitLeaveRequest = (req: {
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    remarks: string;
  }) => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newReq: LeaveRequestItem = {
      id: `lr-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      leaveTypeName: req.leaveTypeName,
      startDate: req.startDate,
      endDate: req.endDate,
      daysRequested,
      remarks: req.remarks,
      status: LeaveStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [newReq, ...prev]);
  };

  const approveLeaveRequest = (requestId: string, comment?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          // Decrement leave balance
          setLeaveBalances((balances) =>
            balances.map((b) =>
              b.leaveTypeName === r.leaveTypeName
                ? { ...b, usedDays: b.usedDays + r.daysRequested }
                : b
            )
          );

          // Update attendance for those dates
          setAttendanceRecords((att) => [
            {
              id: `att-leave-${Date.now()}`,
              userId: r.userId,
              userName: r.userName,
              date: r.startDate,
              checkInAt: null,
              checkOutAt: null,
              workHours: 0,
              extraHours: 0,
              status: AttendanceStatus.LEAVE,
            },
            ...att,
          ]);

          return {
            ...r,
            status: LeaveStatus.APPROVED,
            reviewedBy: `${currentUser.firstName} ${currentUser.lastName}`,
            reviewedAt: new Date().toISOString().slice(0, 10),
            reviewComment: comment || 'Approved by HR/Admin.',
          };
        }
        return r;
      })
    );
  };

  const rejectLeaveRequest = (requestId: string, comment?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: LeaveStatus.REJECTED,
              reviewedBy: `${currentUser.firstName} ${currentUser.lastName}`,
              reviewedAt: new Date().toISOString().slice(0, 10),
              reviewComment: comment || 'Rejected.',
            }
          : r
      )
    );
  };

  const login = (identifier: string, password?: string): UserProfile | null => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    if (!normalizedIdentifier || !password || password.trim().length < 8) {
      return null;
    }

    const found = employees.find((e) => {
      return (
        e.email.toLowerCase() === normalizedIdentifier ||
        e.loginId.toLowerCase() === normalizedIdentifier ||
        e.empCode.toLowerCase() === normalizedIdentifier
      );
    });
    if (!found) {
      return null;
    }

    const storedPassword = passwords[found.id] ?? 'Password123!';
    if (password !== storedPassword) {
      return null;
    }

    setCurrentUser(found);
    setCurrentRole(found.role);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUTH_USER_ID_KEY, found.id);
    }
    return found;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_USER_ID_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        currentRole,
        isCheckedIn,
        employees,
        attendanceRecords,
        leaveRequests,
        leaveBalances,
        toggleCheckIn,
        addEmployee,
        registerCompanyAdmin,
        updateEmployeeProfile,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
