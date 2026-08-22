import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@dayflow/shared';
import { useAuth, type UserProfile } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type ViewMode = 'grid' | 'table';
type RoleFilter = UserRole | 'All';
type CreatedCredential = {
  name: string;
  loginId: string;
  password: string;
  role: UserRole;
};

const formatRole = (role: string) =>
  role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const initialsFor = (employee: UserProfile) =>
  `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();

export function EmployeesPage() {
  useDocumentTitle('Employees');
  const navigate = useNavigate();
  const { employees, currentRole, addEmployee } = useAuth();

  const canCreate = currentRole === UserRole.ADMIN || currentRole === UserRole.HR_OFFICER;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [createdCredential, setCreatedCredential] = useState<CreatedCredential | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id ?? '');

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [newPosition, setNewPosition] = useState('Software Engineer');
  const [newWage, setNewWage] = useState(50000);

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(employees.map((employee) => employee.department)))],
    [employees],
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !query ||
          `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query) ||
          employee.jobPosition.toLowerCase().includes(query) ||
          employee.department.toLowerCase().includes(query) ||
          employee.loginId.toLowerCase().includes(query);
        const matchesDepartment = selectedDept === 'All' || employee.department === selectedDept;
        const matchesRole = selectedRole === 'All' || employee.role === selectedRole;
        return matchesSearch && matchesDepartment && matchesRole;
      }),
    [employees, searchTerm, selectedDept, selectedRole],
  );

  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) ??
    filteredEmployees[0] ??
    employees[0];

  const departmentStats = useMemo(
    () =>
      employees.reduce<Record<string, number>>((stats, employee) => {
        stats[employee.department] = (stats[employee.department] ?? 0) + 1;
        return stats;
      }, {}),
    [employees],
  );

  const avgMonthlyWage = employees.length
    ? Math.round(employees.reduce((sum, employee) => sum + employee.monthlyWage, 0) / employees.length)
    : 0;

  const handleAddSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) return;

    const email =
      newEmail.trim() ||
      `${newFirstName.trim().toLowerCase()}.${newLastName.trim().toLowerCase()}@dayflow.com`;

    const result = addEmployee({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email,
      department: newDept,
      role: newRole,
      jobPosition: newPosition,
      monthlyWage: newWage,
    });

    setCreatedCredential({
      name: `${result.user.firstName} ${result.user.lastName}`,
      loginId: result.user.loginId,
      password: result.generatedPassword,
      role: result.user.role,
    });
    setSelectedEmployeeId(result.user.id);
    setShowAddModal(false);
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewDept('Engineering');
    setNewRole(UserRole.EMPLOYEE);
    setNewPosition('Software Engineer');
    setNewWage(50000);
  };

  return (
    <div className="space-y-lg-sp">
      <section className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp md:p-xxl">
        <div className="flex flex-col gap-lg-sp xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-caption-bold text-stone">Directory</p>
            <h1 className="mt-xxs text-heading-lg font-semibold text-ink-deep">
              Workforce command directory
            </h1>
            <p className="mt-xs max-w-[760px] text-body-md text-steel">
              Search people, preview profiles, and create demo employees with generated login IDs.
            </p>
          </div>

          <div className="flex flex-wrap gap-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={[
                'rounded-full border px-base py-xs text-body-sm-bold',
                viewMode === 'grid'
                  ? 'border-ink-deep bg-ink-deep text-canvas'
                  : 'border-hairline bg-canvas text-steel',
              ].join(' ')}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={[
                'rounded-full border px-base py-xs text-body-sm-bold',
                viewMode === 'table'
                  ? 'border-ink-deep bg-ink-deep text-canvas'
                  : 'border-hairline bg-canvas text-steel',
              ].join(' ')}
            >
              Table
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-full bg-primary px-xl py-xs text-body-sm-bold text-canvas transition-colors hover:bg-primary-deep"
              >
                New employee
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-base md:grid-cols-3">
        <DirectoryStat label="People" value={employees.length} detail="active profiles" />
        <DirectoryStat label="Departments" value={Object.keys(departmentStats).length} detail="business units" />
        <DirectoryStat
          label="Average wage"
          value={`INR ${Math.round(avgMonthlyWage / 1000)}K`}
          detail="monthly compensation"
        />
      </section>

      {createdCredential && (
        <section className="rounded-lg border border-primary/20 bg-primary/10 p-base md:p-lg-sp">
          <div className="flex flex-col gap-base xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-body-md-bold text-ink-deep">Employee account created</p>
              <p className="mt-xxs text-body-sm text-steel">
                {createdCredential.name} can now sign in only to the {formatRole(createdCredential.role)} workspace.
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-xs sm:grid-cols-2 xl:w-[520px]">
              <div className="rounded-lg border border-primary/20 bg-canvas px-base py-xs">
                <p className="text-caption-bold text-stone">Login ID</p>
                <p className="mt-xxs break-all font-mono text-body-sm-bold text-ink-deep">
                  {createdCredential.loginId}
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-canvas px-base py-xs">
                <p className="text-caption-bold text-stone">First-time password</p>
                <p className="mt-xxs break-all font-mono text-body-sm-bold text-ink-deep">
                  {createdCredential.password}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredential(null)}
              className="self-start rounded-full border border-primary/30 bg-canvas px-base py-xs text-body-sm-bold text-primary hover:border-primary"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-hairline-soft bg-canvas p-base">
        <div className="flex flex-col gap-base xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-h-11 flex-1 items-center rounded-full border border-hairline-soft bg-surface-soft px-base">
            <span className="text-caption-bold text-stone">Search</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="name, title, department, login ID"
              className="ml-xs flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-stone"
            />
          </div>

          <div className="flex flex-wrap gap-xs">
            {departments.map((department) => (
              <button
                key={department}
                type="button"
                onClick={() => setSelectedDept(department)}
                className={[
                  'rounded-full border px-base py-xs text-body-sm-bold',
                  selectedDept === department
                    ? 'border-ink-deep bg-ink-deep text-canvas'
                    : 'border-hairline-soft bg-canvas text-steel hover:border-hairline',
                ].join(' ')}
              >
                {department}
              </button>
            ))}
          </div>

          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as RoleFilter)}
            className="min-h-11 rounded-full border border-hairline-soft bg-canvas px-base text-body-sm-bold text-ink outline-none"
          >
            <option value="All">All roles</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.HR_OFFICER}>HR Officer</option>
            <option value={UserRole.EMPLOYEE}>Employee</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-lg-sp xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-lg border border-hairline-soft bg-canvas p-base">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-base md:grid-cols-2 2xl:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setSelectedEmployeeId(employee.id)}
                  className={[
                    'rounded-lg border p-base text-left transition-all hover:-translate-y-0.5 hover:shadow-sticky-panel',
                    selectedEmployee?.id === employee.id
                      ? 'border-ink-deep bg-surface-soft'
                      : 'border-hairline-soft bg-canvas hover:border-hairline',
                  ].join(' ')}
                >
                  <EmployeeIdentity employee={employee} />
                  <div className="mt-base grid grid-cols-2 gap-xs border-t border-hairline-soft pt-base text-caption">
                    <div>
                      <p className="text-stone">Department</p>
                      <p className="mt-xxs font-semibold text-ink-deep">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-stone">Role</p>
                      <p className="mt-xxs font-semibold text-ink-deep">{formatRole(employee.role)}</p>
                    </div>
                    <div>
                      <p className="text-stone">Location</p>
                      <p className="mt-xxs font-semibold text-ink-deep">{employee.location}</p>
                    </div>
                    <div>
                      <p className="text-stone">Wage</p>
                      <p className="mt-xxs font-semibold text-ink-deep">
                        INR {employee.monthlyWage.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-body-sm">
                <thead>
                  <tr className="border-b border-hairline-soft text-steel">
                    <th className="pb-sm font-semibold">Employee</th>
                    <th className="pb-sm font-semibold">Department</th>
                    <th className="pb-sm font-semibold">Role</th>
                    <th className="pb-sm font-semibold">Location</th>
                    <th className="pb-sm font-semibold text-right">Monthly wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      className="cursor-pointer hover:bg-surface-soft"
                    >
                      <td className="py-sm">
                        <EmployeeIdentity employee={employee} compact />
                      </td>
                      <td className="py-sm text-steel">{employee.department}</td>
                      <td className="py-sm text-steel">{formatRole(employee.role)}</td>
                      <td className="py-sm text-steel">{employee.location}</td>
                      <td className="py-sm text-right font-semibold text-ink-deep">
                        INR {employee.monthlyWage.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredEmployees.length === 0 && (
            <div className="rounded-lg bg-surface-soft p-xl text-center">
              <p className="text-body-md-bold text-ink-deep">No employees found</p>
              <p className="mt-xxs text-body-sm text-steel">Adjust filters or create a new employee.</p>
            </div>
          )}
        </div>

        {selectedEmployee && (
          <aside className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp xl:sticky xl:top-[96px] xl:self-start">
            <div className="flex items-center gap-base">
              <img
                src={selectedEmployee.avatarUrl}
                alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-heading-sm font-semibold text-ink-deep">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
                <p className="truncate text-body-sm text-steel">{selectedEmployee.jobPosition}</p>
              </div>
            </div>

            <div className="mt-lg-sp grid grid-cols-2 gap-xs">
              <DetailCell label="Login ID" value={selectedEmployee.loginId} />
              <DetailCell label="Employee code" value={selectedEmployee.empCode} />
              <DetailCell label="Department" value={selectedEmployee.department} />
              <DetailCell label="Role" value={formatRole(selectedEmployee.role)} />
              <DetailCell label="Location" value={selectedEmployee.location} />
              <DetailCell label="Joined" value={selectedEmployee.dateOfJoining} />
            </div>

            <div className="mt-lg-sp rounded-lg bg-surface-soft p-base">
              <p className="text-caption-bold text-stone">Skills</p>
              <div className="mt-xs flex flex-wrap gap-xxs">
                {selectedEmployee.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-hairline-soft bg-canvas px-sm-sp py-xxs text-caption-bold text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/profile')}
              className="mt-lg-sp w-full rounded-full bg-ink-deep px-xl py-md text-button-md text-canvas transition-colors hover:bg-charcoal"
            >
              Open profile
            </button>
          </aside>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/60 p-base backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-lg border border-hairline-soft bg-canvas p-lg-sp shadow-sticky-panel md:p-xxl">
            <div className="flex items-start justify-between gap-base border-b border-hairline-soft pb-base">
              <div>
                <p className="text-caption-bold text-stone">Onboarding</p>
                <h2 className="text-heading-sm font-semibold text-ink-deep">Create employee account</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full border border-hairline px-sm-sp py-xxs text-caption-bold text-steel"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-lg-sp space-y-base">
              <div className="grid grid-cols-1 gap-base md:grid-cols-2">
                <Field label="First name">
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(event) => setNewFirstName(event.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Last name">
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(event) => setNewLastName(event.target.value)}
                    className="input"
                    required
                  />
                </Field>
              </div>

              <Field label="Work email">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="auto-generates if left blank"
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-1 gap-base md:grid-cols-2">
                <Field label="Department">
                  <select
                    value={newDept}
                    onChange={(event) => setNewDept(event.target.value)}
                    className="input"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Executive">Executive</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>
                </Field>
                <Field label="Role">
                  <select
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value as UserRole)}
                    className="input"
                  >
                    <option value={UserRole.EMPLOYEE}>Employee</option>
                    <option value={UserRole.HR_OFFICER}>HR Officer</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-base md:grid-cols-2">
                <Field label="Job position">
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(event) => setNewPosition(event.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Monthly wage">
                  <input
                    type="number"
                    min="1"
                    value={newWage}
                    onChange={(event) => setNewWage(Number(event.target.value))}
                    className="input"
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/10 p-base text-body-sm text-ink">
                Login ID and first-time password will be generated automatically. The role selected here controls which
                workspace this person can access after sign-in.
              </div>

              <div className="flex justify-end gap-xs border-t border-hairline-soft pt-base">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full border border-hairline px-xl py-md text-button-md text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-xl py-md text-button-md text-canvas hover:bg-primary-deep"
                >
                  Create account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectoryStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp">
      <p className="text-caption-bold text-stone">{label}</p>
      <p className="mt-xs text-heading-sm font-semibold text-ink-deep">{value}</p>
      <p className="mt-xxs text-body-sm text-steel">{detail}</p>
    </div>
  );
}

function EmployeeIdentity({ employee, compact = false }: { employee: UserProfile; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-base">
      {employee.avatarUrl ? (
        <img
          src={employee.avatarUrl}
          alt={`${employee.firstName} ${employee.lastName}`}
          className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} flex items-center justify-center rounded-full bg-surface-soft text-body-sm-bold text-ink`}
        >
          {initialsFor(employee)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-body-md-bold text-ink-deep">
          {employee.firstName} {employee.lastName}
        </p>
        <p className="truncate text-body-sm text-steel">{employee.jobPosition}</p>
        <p className="mt-xxs truncate text-caption text-stone">{employee.loginId}</p>
      </div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline-soft bg-surface-soft p-sm-sp">
      <p className="text-caption text-stone">{label}</p>
      <p className="mt-xxs truncate text-caption-bold text-ink-deep">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-xs block text-body-sm-bold text-ink">{label}</span>
      {children}
    </label>
  );
}
