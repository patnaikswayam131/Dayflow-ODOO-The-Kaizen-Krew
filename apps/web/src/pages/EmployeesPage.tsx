import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface EmployeeCard {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  department: string | null;
  job_position: string | null;
  avatar_url: string | null;
}

export function EmployeesPage() {
  useDocumentTitle('Employees');
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  const [employees, setEmployees] = useState<EmployeeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadEmployees() {
      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await api.get(`/employees${query}`);
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to load employees', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadEmployees, 300); // debounce search
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-xl-sp">
        <h1 className="text-heading-lg text-ink-deep">Employee Directory</h1>
        {isAdminOrHR && (
          <button className="btn-primary" onClick={() => alert('New Employee modal coming soon')}>
            + New Employee
          </button>
        )}
      </div>

      <div className="mb-xl-sp">
        <input
          type="text"
          placeholder="Search employees by name, ID, or department..."
          className="input-field w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center text-steel p-section">Loading directory...</div>
      ) : employees.length === 0 ? (
        <div className="card p-section text-center">
          <p className="text-body-md text-steel mb-xs">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-base">
          {employees.map((emp) => (
            <a
              key={emp.id}
              href={`/app/profile/${emp.id}`}
              className="card p-base flex flex-col items-center text-center hover:shadow-sticky-panel transition-all"
            >
              <div className="relative mb-sm">
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} alt={emp.first_name} className="w-16 h-16 rounded-full object-cover border-2 border-surface-soft" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-heading-md border-2 border-surface-soft">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                )}
                {/* Status indicator - green dot for present, placeholder logic for now */}
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-success border-2 border-white"></div>
              </div>
              <h3 className="text-heading-sm text-ink-deep">{emp.first_name} {emp.last_name}</h3>
              <p className="text-caption text-steel mb-xxs">{emp.job_position || 'Employee'}</p>
              <p className="text-caption text-stone bg-surface-soft px-xxs py-[2px] rounded-sm">
                {emp.department || 'General'}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
