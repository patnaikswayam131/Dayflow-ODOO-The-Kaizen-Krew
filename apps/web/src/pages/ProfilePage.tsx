import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

export function ProfilePage() {
  useDocumentTitle('My Profile');
  const { user } = useAuth();
  const { '*': idParam } = useParams<{ '*': string }>();
  
  // If idParam exists and is not empty, we are viewing another employee.
  const isViewingOther = idParam && idParam.length > 0;
  
  const [displayUser, setDisplayUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetId = isViewingOther ? idParam : user?.id;
    if (!targetId) return;

    api.get(`/employees/${targetId}`)
      .then((res: any) => {
        if (res.success) {
          setDisplayUser(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [idParam, user?.id, isViewingOther]);

  const [activeTab, setActiveTab] = useState('Resume');
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  // Tabs logic: Salary Info only visible to Admin
  const availableTabs = ['Resume', 'Private Info'];
  if (isAdminOrHR) {
    availableTabs.push('Salary Info');
  }
  availableTabs.push('Security');

  // Safety fallback if activeTab is hidden
  if (!availableTabs.includes(activeTab)) {
    setActiveTab(availableTabs[0] as string);
  }

  if (loading) return <div className="p-xl-sp text-center text-steel">Loading profile...</div>;
  if (!displayUser) return <div className="p-xl-sp text-center text-danger">Profile not found.</div>;

  return (
    <div>
      <div className="flex items-center gap-xl-sp mb-xxl">
        <div className="w-24 h-24 rounded-full bg-brand/10 text-brand flex items-center justify-center text-heading-xl border-4 border-surface-soft shrink-0">
          {displayUser?.first_name?.[0]}{displayUser?.last_name?.[0]}
        </div>
        <div>
          <h1 className="text-heading-lg text-ink-deep mb-xxs">
            {displayUser?.first_name} {displayUser?.last_name}
          </h1>
          <p className="text-body-md text-steel">{displayUser?.job_position || 'Software Engineer'} • {displayUser?.department || 'Engineering'}</p>
          <div className="flex gap-sm mt-xs">
            <span className="text-caption text-stone bg-surface-soft px-xxs py-[2px] rounded-sm">{displayUser?.email}</span>
            <span className="text-caption text-stone bg-surface-soft px-xxs py-[2px] rounded-sm">ID: {displayUser?.emp_code || 'EMP-0001'}</span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-xs mb-xl-sp border-b border-hairline-soft pb-xs">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-base py-xs text-body-sm-bold rounded-full transition-colors ${
              activeTab === tab 
                ? 'bg-ink-deep text-canvas' 
                : 'bg-transparent text-steel hover:bg-surface-soft'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card p-section max-w-4xl">
        {activeTab === 'Resume' && (
          <div className="space-y-base">
            <div>
              <h3 className="text-body-md-bold text-ink-deep mb-xxs">About</h3>
              <p className="text-body-sm text-steel">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>
            </div>
            <div>
              <h3 className="text-body-md-bold text-ink-deep mb-xxs">What I love about my job</h3>
              <p className="text-body-sm text-steel">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>
            </div>
            <div>
              <h3 className="text-body-md-bold text-ink-deep mb-xxs">My interests and hobbies</h3>
              <p className="text-body-sm text-steel">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            </div>
            <div className="mt-xl-sp grid grid-cols-2 gap-base">
              <div className="border border-hairline rounded-lg p-base">
                <h3 className="text-body-md-bold text-ink-deep mb-sm">Skills</h3>
                <button className="text-brand text-body-sm-bold">+ Add Skills</button>
              </div>
              <div className="border border-hairline rounded-lg p-base">
                <h3 className="text-body-md-bold text-ink-deep mb-sm">Certification</h3>
                <button className="text-brand text-body-sm-bold">+ Add Skills</button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'Private Info' && (
          <div className="grid grid-cols-2 gap-xl-sp">
            <div>
              <label className="block text-caption text-stone mb-xxs">Date of Birth</label>
              <p className="text-body-sm text-ink-deep">January 15, 1990</p>
            </div>
            <div>
              <label className="block text-caption text-stone mb-xxs">Nationality</label>
              <p className="text-body-sm text-ink-deep">American</p>
            </div>
            <div>
              <label className="block text-caption text-stone mb-xxs">Gender</label>
              <p className="text-body-sm text-ink-deep">Male</p>
            </div>
            <div>
              <label className="block text-caption text-stone mb-xxs">Marital Status</label>
              <p className="text-body-sm text-ink-deep">Single</p>
            </div>
            <div className="col-span-2">
              <label className="block text-caption text-stone mb-xxs">Residing Address</label>
              <p className="text-body-sm text-ink-deep">123 Tech Lane, Silicon Valley, CA 94000</p>
            </div>
          </div>
        )}

        {activeTab === 'Salary Info' && isAdminOrHR && (
          <div>
            {/* Header Metrics */}
            <div className="grid grid-cols-2 gap-xl-sp mb-xl-sp border-b border-hairline-soft pb-xl-sp">
              <div>
                <div className="flex justify-between items-end mb-sm">
                  <span className="text-body-sm text-ink">Month Wage</span>
                  <span className="text-heading-md text-ink-deep">50000 <span className="text-body-sm text-stone font-normal">/ Month</span></span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-body-sm text-ink">Yearly wage</span>
                  <span className="text-heading-md text-ink-deep">600000 <span className="text-body-sm text-stone font-normal">/ Yearly</span></span>
                </div>
              </div>
              <div className="pl-xl-sp border-l border-hairline-soft flex flex-col justify-center">
                <div className="flex justify-between items-end mb-sm">
                  <span className="text-body-sm text-ink">No of working days<br/>in a week:</span>
                  <span className="text-heading-sm text-ink-deep border-b border-hairline w-16 text-center">5</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-body-sm text-ink">Break Time:</span>
                  <span className="text-heading-sm text-ink-deep border-b border-hairline w-16 text-center inline-flex justify-center items-end gap-1">1 <span className="text-body-sm text-stone font-normal">/hrs</span></span>
                </div>
              </div>
            </div>

            {/* Detailed Columns */}
            <div className="grid grid-cols-2 gap-xl-sp">
              {/* Left Column: Components */}
              <div className="space-y-base">
                <h3 className="text-body-md-bold text-ink-deep mb-sm border-b border-hairline-soft pb-xxs">Salary Components</h3>
                
                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Basic Salary</span>
                    <span className="text-right">25000.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 50.00 %</span>
                  </div>
                  <p className="text-caption text-stone">Define Basic salary from company cost compute is based on monthly Wages</p>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>House Rent Allowance</span>
                    <span className="text-right">12500.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 50.00 %</span>
                  </div>
                  <p className="text-caption text-stone">HRA provided to employees 50% of the basic salary</p>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Standard Allowance</span>
                    <span className="text-right">4167.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 16.67 %</span>
                  </div>
                  <p className="text-caption text-stone">A standard allowance is a predetermined, fixed amount provided to employee as part of their salary</p>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Performance Bonus</span>
                    <span className="text-right">2082.50 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 8.33 %</span>
                  </div>
                  <p className="text-caption text-stone">Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary</p>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Leave Travel Allowance</span>
                    <span className="text-right">2082.50 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 8.33 %</span>
                  </div>
                  <p className="text-caption text-stone">LTA is paid by the company to employees to cover their travel expenses and calculated as a % of the basic salary</p>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Fixed Allowance</span>
                    <span className="text-right">2918.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 11.67 %</span>
                  </div>
                  <p className="text-caption text-stone">Fixed allowance portion of wages is determined after calculating all salary components.</p>
                </div>
              </div>

              {/* Right Column: PF & Deductions */}
              <div className="space-y-base">
                <h3 className="text-body-md-bold text-ink-deep mb-sm border-b border-hairline-soft pb-xxs">Provident Fund (PF) Contribution</h3>
                
                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Employee</span>
                    <span className="text-right">3000.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 12.00 %</span>
                  </div>
                  <p className="text-caption text-stone">PF is calculated based on the basic salary</p>
                </div>

                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Employer</span>
                    <span className="text-right">3000.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span> 12.00 %</span>
                  </div>
                  <p className="text-caption text-stone">PF is calculated based on the basic salary</p>
                </div>

                <h3 className="text-body-md-bold text-ink-deep mb-sm border-b border-hairline-soft pb-xxs mt-xl-sp">Tax Deductions</h3>
                <div className="space-y-sm">
                  <div className="flex justify-between text-body-sm-bold text-ink-deep">
                    <span>Professional Tax</span>
                    <span className="text-right">200.00 <span className="text-caption text-stone font-normal mr-sm">₹ / month</span></span>
                  </div>
                  <p className="text-caption text-stone">Professional Tax deducted from the Gross salary</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Security' && (
          <div className="space-y-base">
            <div>
              <h3 className="text-body-md-bold text-ink-deep mb-xs">Change Password</h3>
              <div className="space-y-sm max-w-sm">
                <input type="password" placeholder="Current Password" className="input-field w-full" />
                <input type="password" placeholder="New Password" className="input-field w-full" />
                <input type="password" placeholder="Confirm New Password" className="input-field w-full" />
                <button className="btn-primary mt-sm">Update Password</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
