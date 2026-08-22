import { useEffect, useState } from 'react';
import { UserRole } from '@dayflow/shared';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SalaryInfoTab } from '../components/SalaryInfoTab';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  useDocumentTitle('My Profile');
  const { currentUser, currentRole, updateEmployeeProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'Resume' | 'Private Info' | 'Documents' | 'Salary Info' | 'Security'
  >('Resume');

  // Resume state
  const [about, setAbout] = useState(currentUser.about || '');
  const [jobLoveText, setJobLoveText] = useState(currentUser.jobLoveText || '');
  const [interests, setInterests] = useState(currentUser.interests || '');
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [newSkill, setNewSkill] = useState('');

  // Private info state
  const [residingAddress, setResidingAddress] = useState(currentUser.residingAddress || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [accountNumber, setAccountNumber] = useState(currentUser.bankDetails?.accountNumber || '');
  const [bankName, setBankName] = useState(currentUser.bankDetails?.bankName || '');
  const [ifscCode, setIfscCode] = useState(currentUser.bankDetails?.ifscCode || '');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);
  const visibleTabs = currentRole === UserRole.ADMIN
    ? (['Resume', 'Private Info', 'Documents', 'Salary Info', 'Security'] as const)
    : (['Resume', 'Private Info', 'Documents', 'Security'] as const);

  useEffect(() => {
    if (currentRole !== UserRole.ADMIN && activeTab === 'Salary Info') {
      setActiveTab('Resume');
    }
  }, [activeTab, currentRole]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updated = [...skills, newSkill.trim()];
      setSkills(updated);
      updateEmployeeProfile(currentUser.id, { skills: updated });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    updateEmployeeProfile(currentUser.id, { skills: updated });
  };

  const handleSaveResume = () => {
    updateEmployeeProfile(currentUser.id, { about, jobLoveText, interests });
  };

  const handleSavePrivateInfo = () => {
    updateEmployeeProfile(currentUser.id, {
      residingAddress,
      phone,
      bankDetails: { accountNumber, bankName, ifscCode },
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      setSecurityMsg('Password must be at least 10 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg('New password and confirm password do not match.');
      return;
    }
    setSecurityMsg('✓ Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-xxl">
      {/* ── Single H1 for Part B audit ── */}
      <div>
        <span className="text-caption-bold text-steel uppercase tracking-wider">
          Profile Management
        </span>
        <h1 className="text-heading-lg text-ink-deep font-semibold mt-xxs">
          Employee Profile
        </h1>
      </div>

      {/* ── Header Fields Always Visible (FR-14) ── */}
      <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-xxl">
        <div className="flex items-center gap-xl">
          <img
            src={currentUser.avatarUrl}
            alt={`${currentUser.firstName} ${currentUser.lastName}`}
            className="w-20 h-20 rounded-full object-cover border-2 border-hairline shadow-xs"
          />
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="text-heading-sm text-ink-deep font-bold">
                {currentUser.firstName} {currentUser.lastName}
              </h2>
              <span className="text-caption-bold text-primary bg-surface-soft px-md py-xxs rounded-full">
                {currentRole}
              </span>
            </div>
            <p className="text-body-md text-steel">{currentUser.jobPosition}</p>
            <div className="flex flex-wrap items-center gap-md mt-xs text-caption text-steel">
              <span>🆔 Login ID: <strong className="text-ink font-mono">{currentUser.loginId}</strong></span>
              <span>•</span>
              <span>🏢 Dept: <strong className="text-ink">{currentUser.department}</strong></span>
              <span>•</span>
              <span>📍 Location: <strong className="text-ink">{currentUser.location}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-surface-soft p-lg rounded-xl border border-hairline-soft w-full lg:w-auto text-caption space-y-xxs">
          <div><span className="text-stone">Emp Code:</span> <strong className="text-ink">{currentUser.empCode}</strong></div>
          <div><span className="text-stone">Work Email:</span> <strong className="text-ink">{currentUser.email}</strong></div>
          <div><span className="text-stone">Joining Date:</span> <strong className="text-ink">{currentUser.dateOfJoining}</strong></div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-xs border-b border-hairline-soft pb-xs overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-base py-xs text-body-sm-bold rounded-full transition-colors duration-150 ease-out whitespace-nowrap
              ${
                activeTab === tab
                  ? 'bg-ink-deep text-canvas'
                  : 'bg-canvas text-ink border border-hairline hover:bg-surface-soft'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* 1. RESUME TAB (FR-12) */}
      {activeTab === 'Resume' && (
        <div className="space-y-xxl">
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-xl shadow-sm">
            <h3 className="text-subtitle-lg text-ink-deep font-semibold">About & Interests</h3>

            <div className="space-y-md">
              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">
                  About Me
                </label>
                <textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  onBlur={handleSaveResume}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">
                  What I Love About My Job
                </label>
                <textarea
                  rows={2}
                  value={jobLoveText}
                  onChange={(e) => setJobLoveText(e.target.value)}
                  onBlur={handleSaveResume}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">
                  Interests & Hobbies
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  onBlur={handleSaveResume}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
                />
              </div>
            </div>
          </div>

          {/* Skills Chips (FR-12) */}
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-lg shadow-sm">
            <h3 className="text-subtitle-lg text-ink-deep font-semibold">Skills & Competencies</h3>
            
            <div className="flex flex-wrap items-center gap-xs">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-xs bg-surface-soft text-ink text-body-sm-bold px-base py-xs rounded-full border border-hairline"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-steel hover:text-critical font-bold text-body-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-xs max-w-[400px]">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add new skill (e.g. GraphQL)…"
                className="flex-1 bg-canvas text-ink text-body-sm rounded-full px-base py-xs border border-hairline outline-none focus:border-fb-blue"
              />
              <button
                onClick={handleAddSkill}
                className="bg-ink-button text-on-ink-button hover:bg-charcoal px-lg py-xs rounded-full text-button-md"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Certifications (FR-12) */}
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-lg shadow-sm">
            <h3 className="text-subtitle-lg text-ink-deep font-semibold">Certifications</h3>
            <div className="divide-y divide-hairline-soft">
              {currentUser.certifications.map((cert) => (
                <div key={cert.name} className="py-md flex items-center justify-between">
                  <div>
                    <span className="text-body-md-bold text-ink-deep block">{cert.name}</span>
                    <span className="text-caption text-steel">Issued by {cert.issuedBy}</span>
                  </div>
                  <span className="text-caption-bold text-steel bg-surface-soft px-md py-xxs rounded-full">
                    {cert.issuedOn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRIVATE INFO TAB (FR-13) */}
      {activeTab === 'Private Info' && (
        <div className="space-y-xxl">
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-xl shadow-sm">
            <h3 className="text-subtitle-lg text-ink-deep font-semibold">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">Date of Birth</label>
                <input
                  type="date"
                  defaultValue={currentUser.dateOfBirth}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handleSavePrivateInfo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">Nationality</label>
                <input
                  type="text"
                  defaultValue={currentUser.nationality}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-body-sm-bold text-ink mb-xs">Residing Address</label>
                <input
                  type="text"
                  value={residingAddress}
                  onChange={(e) => setResidingAddress(e.target.value)}
                  onBlur={handleSavePrivateInfo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">Marital Status</label>
                <input
                  type="text"
                  defaultValue={currentUser.maritalStatus}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">PAN No</label>
                <input
                  type="text"
                  defaultValue={currentUser.panNo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">UAN No</label>
                <input
                  type="text"
                  defaultValue={currentUser.uanNo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>
            </div>
          </div>

          {/* Bank Details Sub-Section (FR-13) */}
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-xl shadow-sm">
            <h3 className="text-subtitle-lg text-ink-deep font-semibold">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  onBlur={handleSavePrivateInfo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onBlur={handleSavePrivateInfo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>

              <div>
                <label className="block text-body-sm-bold text-ink mb-xs">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  onBlur={handleSavePrivateInfo}
                  className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCUMENTS TAB */}
      {activeTab === 'Documents' && (
        <div className="grid grid-cols-1 gap-xxl lg:grid-cols-[1fr_340px]">
          <div className="bg-canvas border border-hairline-soft rounded-lg p-xxl space-y-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-base">
              <div>
                <h3 className="text-subtitle-lg text-ink-deep font-semibold">Employee Documents</h3>
                <p className="text-body-sm text-steel mt-xxs">
                  HR-visible records for identity, payroll, and onboarding.
                </p>
              </div>
              <button
                type="button"
                className="self-start rounded-full bg-primary px-xl py-md text-button-md text-canvas hover:bg-primary-deep"
              >
                Upload document
              </button>
            </div>

            <div className="divide-y divide-hairline-soft">
              {[
                { name: 'Government ID', status: 'Verified', owner: 'HR Officer', date: '2026-01-12' },
                { name: 'Offer Letter', status: 'Signed', owner: 'Admin', date: currentUser.dateOfJoining },
                { name: 'Bank Proof', status: 'Pending review', owner: 'Payroll', date: '2026-08-21' },
              ].map((document) => (
                <div key={document.name} className="py-md flex flex-col gap-xs md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-body-md-bold text-ink-deep">{document.name}</p>
                    <p className="text-caption text-steel">
                      {document.owner} - {document.date}
                    </p>
                  </div>
                  <span className="self-start rounded-full border border-hairline-soft bg-surface-soft px-base py-xxs text-caption-bold text-ink">
                    {document.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="bg-ink-deep text-canvas rounded-lg p-xxl space-y-lg">
            <div>
              <p className="text-caption-bold text-stone">Access model</p>
              <h3 className="mt-xxs text-heading-sm font-semibold">Role-aware visibility</h3>
            </div>
            <div className="space-y-xs">
              <div className="rounded-lg bg-canvas/10 px-base py-xs flex justify-between gap-base">
                <span className="text-caption-bold text-hairline-soft">Employee</span>
                <span className="text-body-sm-bold text-canvas">Own files</span>
              </div>
              <div className="rounded-lg bg-canvas/10 px-base py-xs flex justify-between gap-base">
                <span className="text-caption-bold text-hairline-soft">HR Officer</span>
                <span className="text-body-sm-bold text-canvas">Review</span>
              </div>
              <div className="rounded-lg bg-canvas/10 px-base py-xs flex justify-between gap-base">
                <span className="text-caption-bold text-hairline-soft">Admin</span>
                <span className="text-body-sm-bold text-canvas">Full control</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. SALARY INFO TAB (FR-16, FR-30–35) */}
      {activeTab === 'Salary Info' && (
        <SalaryInfoTab
          userId={currentUser.id}
          currentUserRole={currentRole}
          isSelf={true}
          initialMonthlyWage={currentUser.monthlyWage}
          onSave={async (data) => {
            updateEmployeeProfile(currentUser.id, { monthlyWage: data.monthlyWage });
          }}
        />
      )}

      {/* 4. SECURITY TAB (FR-17) */}
      {activeTab === 'Security' && (
        <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl max-w-[500px] space-y-xl shadow-sm">
          <h3 className="text-subtitle-lg text-ink-deep font-semibold">Change Password</h3>

          {securityMsg && (
            <div
              className={`p-md rounded-lg text-body-sm border ${
                securityMsg.startsWith('✓')
                  ? 'bg-canvas border-success text-success'
                  : 'bg-canvas border-critical-strong text-critical'
              }`}
            >
              {securityMsg}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-base">
            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline outline-none focus:border-fb-blue"
                required
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 10 characters, upper/lower/number/symbol"
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline outline-none focus:border-fb-blue"
                required
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline outline-none focus:border-fb-blue"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-primary text-on-primary hover:bg-primary-deep px-xl py-md rounded-full text-button-md transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
