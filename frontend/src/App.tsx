import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Shield, AlertTriangle, Play, CheckCircle2, User as UserIcon, LogOut, Clock,
  FileCode, Terminal, ZoomIn, ZoomOut, Maximize, RefreshCw, Send, Plus, 
  Upload, FileText, Database, ShieldAlert, Award, FileSpreadsheet, Key, Check, AlertOctagon
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  rollNumber?: string;
  branch?: string;
  year?: number;
  department?: string;
}

interface Question {
  id: number;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  explanation: string;
  languageSupport: string[];
  hiddenTestCasesCount: number;
  status: 'Unsolved' | 'Passed' | 'Failed';
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  date: string;
  questions?: any[];
}

export default function App() {
  // Navigation & Authentication
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'student-dashboard' | 'exam' | 'admin-dashboard' | 'faculty-panel' | 'reports'>('login');
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  // Common Login/Register fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('1');
  const [department, setDepartment] = useState('Computer Science');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [secureToken, setSecureToken] = useState('');

  // Student Dashboard state
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Exam Workspace state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'C' | 'Java' | 'Python'>('Python');
  const [code, setCode] = useState('');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Anti-Cheat Workspace status
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [showInactivityPopup, setShowInactivityPopup] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(0); // counts seconds of idle
  const [isExamLocked, setIsExamLocked] = useState(false);

  // Admin / Faculty dashboards state
  const [monitorStats, setMonitorStats] = useState<any>(null);
  const [selectedMonitorStudent, setSelectedMonitorStudent] = useState<any>(null);
  const [tokenStudentId, setTokenStudentId] = useState('');
  const [tokenExpiryMinutes, setTokenExpiryMinutes] = useState('60');
  const [allStudentsList, setAllStudentsList] = useState<User[]>([]);
  const [generatedTokens, setGeneratedTokens] = useState<any[]>([]);
  const [bulkQuestionsText, setBulkQuestionsText] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    title: '', topic: 'Introduction to Programming', difficulty: 'Easy',
    description: '', constraints: '', inputFormat: '', outputFormat: '',
    sampleInput: '', sampleOutput: '', explanation: '',
    visibleTestCases: '[{"input": "", "output": ""}]',
    hiddenTestCases: '[{"input": "", "output": ""}]'
  });

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const inactivityRef = useRef<number>(0);

  // Save auth info to local storage
  const handleAuthSuccess = (tokenData: string, userData: User) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
    setAuthError('');
    setAuthSuccess('');

    if (userData.role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else if (userData.role === 'faculty') {
      setCurrentPage('faculty-panel');
    } else {
      setCurrentPage('student-dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setCurrentPage('login');
  };

  // Fetch assessments (runs on dashboard mount)
  useEffect(() => {
    if (token && (currentPage === 'student-dashboard' || currentPage === 'faculty-panel' || currentPage === 'admin-dashboard')) {
      fetch(`${API_BASE}/assessments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setAssessments(data))
      .catch(console.error);

      if (user?.role !== 'student') {
        // Fetch student dropdown and list of issued tokens for token management card
        fetch(`${API_BASE}/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setAllStudentsList(data))
        .catch(console.error);

        fetch(`${API_BASE}/tokens`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setGeneratedTokens(data))
        .catch(console.error);

        refreshMonitoringStats();
      }
    }
  }, [token, currentPage]);

  // WebSocket Live Updates Connection
  useEffect(() => {
    if (token && user && (user.role === 'admin' || user.role === 'faculty')) {
      const socket = io('http://localhost:5000');
      socket.on('connect', () => console.log('WebSocket connection for monitor active'));
      socket.on('monitor:refresh', () => {
        refreshMonitoringStats();
      });
      return () => {
        socket.disconnect();
      };
    }
  }, [token, user]);

  const refreshMonitoringStats = () => {
    fetch(`${API_BASE}/monitor/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setMonitorStats(data))
    .catch(console.error);
  };

  // Exam Timer Countdown
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinishExam(true); // Auto-submit on timer zero
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Anti-Cheat: Focus monitoring, Copy/Paste restrictions, Inactivity checks
  useEffect(() => {
    if (currentPage !== 'exam' || isExamLocked) return;

    // Disallow context menu (Right click)
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('CopyPaste', 'Attempted to open Context Menu (Right Click).');
    };
    document.addEventListener('contextmenu', blockContextMenu);

    // Disallow Copy, Cut, Paste keyboard inputs
    const blockCopyPaste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logViolation('CopyPaste', `Attempted keyboard shortcut: Ctrl+${e.key.toUpperCase()}`);
      }
    };
    document.addEventListener('keydown', blockCopyPaste);

    // Tab Switch / Window Blur monitoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TabSwitch', 'Browser tab switched to background.');
      }
    };
    const handleWindowBlur = () => {
      logViolation('Blur', 'Window focus lost. Shifted to another application or browser window.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Inactivity timers tracking: 60s popup, 180s auto submit
    const resetInactivity = () => {
      inactivityRef.current = 0;
      setInactivityTimer(0);
      setShowInactivityPopup(false);
    };

    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('keydown', resetInactivity);
    window.addEventListener('click', resetInactivity);

    const checkInterval = setInterval(() => {
      inactivityRef.current += 1;
      setInactivityTimer(inactivityRef.current);

      // 60s inactivity warning popup
      if (inactivityRef.current === 60) {
        setShowInactivityPopup(true);
      }

      // 180s inactivity violation warning
      if (inactivityRef.current === 180) {
        logViolation('Inactivity', 'Inactivity duration exceeded 180 seconds.');
      }

      // 240s auto-submit exam
      if (inactivityRef.current >= 240) {
        clearInterval(checkInterval);
        handleFinishExam(true);
        alert('Assessment submitted automatically due to prolonged inactivity.');
      }

      // Periodic backend ping
      if (inactivityRef.current % 30 === 0) {
        fetch(`${API_BASE}/cheat/ping-activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ assessmentId: selectedAssessment?.id })
        }).catch(console.error);
      }
    }, 1000);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('mousemove', resetInactivity);
      window.removeEventListener('keydown', resetInactivity);
      window.removeEventListener('click', resetInactivity);
      clearInterval(checkInterval);
    };
  }, [currentPage, isExamLocked, selectedAssessment]);

  // Log violations to backend
  const logViolation = (type: 'TabSwitch' | 'CopyPaste' | 'Blur' | 'Inactivity', details: string) => {
    if (!selectedAssessment || isExamLocked) return;

    fetch(`${API_BASE}/cheat/violation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        assessmentId: selectedAssessment.id,
        type,
        details
      })
    })
    .then(res => res.json())
    .then((data: any) => {
      if (type === 'TabSwitch') {
        const warnings = data.warningLevel;
        setTabSwitchWarnings(warnings);
        if (warnings === 1) {
          alert('Warning 1: Tab switching detected. Please focus on the exam window.');
        } else if (warnings === 2) {
          alert('Warning 2: Further violations may terminate the exam.');
        } else if (warnings >= 3) {
          setIsExamLocked(true);
          setIsTimerRunning(false);
          alert('Exam Terminated: Assessment automatically submitted due to repeated tab switching.');
          setCurrentPage('student-dashboard');
        }
      }
    })
    .catch(console.error);
  };

  // API Call: Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, role,
          rollNumber: role === 'student' ? rollNumber : undefined,
          employeeId: role === 'faculty' ? employeeId : undefined,
          branch: role === 'student' ? branch : undefined,
          year: role === 'student' ? year : undefined,
          department: role === 'faculty' ? department : undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setAuthSuccess('Account created successfully! You can now log in.');
      // clear inputs
      setName(''); setEmail(''); setPassword(''); setRollNumber(''); setEmployeeId('');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // API Call: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token: secureToken || undefined })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      handleAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // API Call: Start Assessment Session
  const handleStartExam = async (assessment: Assessment) => {
    try {
      const res = await fetch(`${API_BASE}/assessments/${assessment.id}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: secureToken || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start exam');

      // Fetch questions inside assessment and state
      const stateRes = await fetch(`${API_BASE}/assessments/${assessment.id}/session/state`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const stateData = await stateRes.json();
      if (!stateRes.ok) throw new Error(stateData.error || 'Failed to load exam state');

      setSelectedAssessment(assessment);
      setQuestions(stateData.questions);
      setCurrentQuestionIdx(stateData.session.currentQuestionIndex || 0);
      setTimeLeft(assessment.durationMinutes * 60); // set timer minutes to seconds
      setIsTimerRunning(true);
      setIsExamLocked(false);
      setTabSwitchWarnings(0);
      setCode('');
      setRunResult(null);
      setCurrentPage('exam');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // API Call: Run Code compilation
  const handleRunCode = async () => {
    if (isRunning || !selectedAssessment) return;
    setIsRunning(true);
    setRunResult(null);

    const activeQ = questions[currentQuestionIdx];

    try {
      const res = await fetch(`${API_BASE}/assessments/${selectedAssessment.id}/session/run-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: activeQ.id,
          language: selectedLanguage,
          code
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      setRunResult(data);
      if (data.success) {
        // Mark current question as solved locally
        setQuestions(prev => prev.map((q, idx) => {
          if (idx === currentQuestionIdx) {
            return { ...q, status: 'Passed' };
          }
          return q;
        }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Update current question navigation index
  const handleNavQuestion = async (idx: number) => {
    if (!selectedAssessment) return;
    try {
      await fetch(`${API_BASE}/assessments/${selectedAssessment.id}/session/navigation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questionIndex: idx })
      });
      setCurrentQuestionIdx(idx);
      setCode('');
      setRunResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit and Complete assessment
  const handleFinishExam = async (autoSubmit: boolean = false) => {
    if (!selectedAssessment) return;
    try {
      const res = await fetch(`${API_BASE}/assessments/${selectedAssessment.id}/session/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Could not finish exam');

      setIsTimerRunning(false);
      setSelectedAssessment(null);
      setCurrentPage('student-dashboard');
      if (!autoSubmit) {
        alert('Congratulations! Assessment submitted successfully.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // API Call: Admin Generate Secure Token
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenStudentId) return alert('Please select a student');

    try {
      const res = await fetch(`${API_BASE}/tokens/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: Number(tokenStudentId),
          durationMinutes: Number(tokenExpiryMinutes)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh issued tokens lists
      const refreshRes = await fetch(`${API_BASE}/tokens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const refreshData = await refreshRes.json();
      setGeneratedTokens(refreshData);
      setTokenStudentId('');
      alert(`Token generated successfully: ${data.token.tokenString}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // API Call: Faculty Upload Questions in Bulk
  const handleBulkUploadQuestions = async () => {
    if (!bulkQuestionsText) return alert('Provide JSON array data');
    try {
      const parsed = JSON.parse(bulkQuestionsText);
      const res = await fetch(`${API_BASE}/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questionsList: parsed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setBulkQuestionsText('');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
  };

  // API Call: Reset student exam lock / grant extra attempts
  const handleResetStudentAttempt = async (studentId: number, assessmentId: number) => {
    if (!confirm('Are you sure you want to reset this session and unlock it for the student?')) return;
    try {
      const res = await fetch(`${API_BASE}/monitor/reset-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, assessmentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      refreshMonitoringStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // API Call: Trigger email delivery of reports
  const handleSendEmailReport = async (studentId: number, assessmentId: number, studentEmail: string) => {
    const customEmail = prompt('Confirm or edit destination Email ID:', studentEmail);
    if (!customEmail) return;

    try {
      const res = await fetch(`${API_BASE}/reports/student/${studentId}/assessment/${assessmentId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ destinationEmail: customEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Dynamic Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      editorContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Render Functions
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header bar */}
      <header className="bg-navy-950 text-white shadow-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">SECURE ASSESS</h1>
            <p className="text-xs text-blue-300">AI-Powered Coding Assessment Engine</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-6">
            {/* Student info card visible header details */}
            {user.role === 'student' && currentPage === 'exam' && (
              <div className="hidden md:flex items-center space-x-4 bg-navy-900 px-4 py-1.5 rounded-lg border border-navy-800 text-xs">
                <div>
                  <span className="font-semibold text-blue-400">Name:</span> {user.name}
                </div>
                <div className="border-l border-navy-800 h-4"></div>
                <div>
                  <span className="font-semibold text-blue-400">Roll:</span> {user.rollNumber}
                </div>
                <div className="border-l border-navy-800 h-4"></div>
                <div>
                  <span className="font-semibold text-blue-400">Branch:</span> {user.branch} ({user.year} Yr)
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-blue-300 capitalize">{user.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-navy-900 hover:bg-navy-800 border border-navy-800 p-2 rounded-lg text-slate-300 hover:text-white transition duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentPage === 'login' && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
              <div className="text-center mb-8">
                <Shield className="w-12 h-12 text-navy-900 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-navy-950">System Gatekeeper</h2>
                <p className="text-sm text-slate-500">Sign in to your assessment profile</p>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 mb-6 flex items-center space-x-2">
                  <AlertOctagon className="w-5 h-5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100 mb-6 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Email Address</label>
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
                    placeholder="student@institution.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Password</label>
                  <input 
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60">
                  <label className="block text-xs font-bold uppercase text-navy-950 mb-1.5 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-navy-700" />
                    <span>Secure Access Token (Optional / Limit bypass)</span>
                  </label>
                  <input 
                    type="text" value={secureToken} onChange={e => setSecureToken(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-navy-600"
                    placeholder="A9B8C7D6"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Leave empty unless attempt limit is exceeded or token authentication is forced.</p>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-navy-950 hover:bg-navy-900 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition duration-200"
                >
                  Authenticate Profile
                </button>
              </form>

              <div className="text-center mt-6 text-sm text-slate-500">
                Don't have an account?{' '}
                <button onClick={() => { setAuthError(''); setCurrentPage('register'); }} className="text-navy-700 font-bold hover:underline">
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'register' && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-900">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 my-8">
              <div className="text-center mb-6">
                <Shield className="w-10 h-10 text-navy-900 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-navy-950">Registration Desk</h2>
                <p className="text-sm text-slate-500">Create your institutional identity credentials</p>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 mb-5 flex items-center space-x-2">
                  <AlertOctagon className="w-5 h-5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100 mb-5 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">User Role</label>
                    <select 
                      value={role} onChange={e => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-navy-600"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Member</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Full Name</label>
                    <input 
                      type="text" required value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      placeholder="Enter Full Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Email ID</label>
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      placeholder="name@institution.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Password</label>
                    <input 
                      type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      placeholder="Strong password required"
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wide">Student Profile Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Roll Number</label>
                        <input 
                          type="text" required value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                          placeholder="Unique Roll No"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Branch</label>
                        <select 
                          value={branch} onChange={e => setBranch(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                        >
                          <option value="CSE">CSE</option>
                          <option value="ECE">ECE</option>
                          <option value="EEE">EEE</option>
                          <option value="MECH">MECH</option>
                          <option value="CIVIL">CIVIL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Year of Study</label>
                        <select 
                          value={year} onChange={e => setYear(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                        >
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {role === 'faculty' && (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wide">Faculty Profile Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Employee ID</label>
                        <input 
                          type="text" required value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                          placeholder="EMP-1234"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Department</label>
                        <input 
                          type="text" required value={department} onChange={e => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                          placeholder="e.g. Information Technology"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {role === 'admin' && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] text-slate-500">Administrator role gives access to general security, monitor desks, reports module, and reset approvals.</p>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-navy-950 hover:bg-navy-900 text-white py-2.5 rounded-xl font-semibold transition"
                >
                  Create Secure Credentials
                </button>
              </form>

              <div className="text-center mt-4 text-sm text-slate-500">
                Already registered?{' '}
                <button onClick={() => { setAuthError(''); setCurrentPage('login'); }} className="text-navy-700 font-bold hover:underline">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'student-dashboard' && user && (
          <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
            {/* Student Info Card (Remains visible) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-900">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy-950">{user.name}</h3>
                  <p className="text-xs text-slate-500">Student Examination Dashboard</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-medium">Roll Number</p>
                  <p className="font-bold text-slate-800">{user.rollNumber}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-medium">Branch / Stream</p>
                  <p className="font-bold text-slate-800">{user.branch}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-medium">Academic Year</p>
                  <p className="font-bold text-slate-800">{user.year} Year</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-medium">Registered Email</p>
                  <p className="font-bold text-slate-800">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Assessment list */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-navy-950 flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-blue-500" />
                <span>Available Coding Assessments</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {assessments.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center text-slate-500">
                    No assessments are scheduled at this moment. Contact Faculty/Admin.
                  </div>
                ) : (
                  assessments.map(asm => (
                    <div key={asm.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-navy-50 text-navy-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-navy-100 uppercase">Coding Exam</span>
                          <span className="text-slate-400 text-xs flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{asm.durationMinutes} mins</span>
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{asm.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2">{asm.description}</p>
                      </div>

                      <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between">
                        <div className="text-xs text-slate-400">Date: {asm.date}</div>
                        <button 
                          onClick={() => handleStartExam(asm)}
                          className="bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Begin Assessment</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coding Exam interface */}
        {currentPage === 'exam' && selectedAssessment && (
          <div className="flex-1 flex flex-col md:flex-row bg-slate-900 text-slate-100 overflow-hidden relative" style={{ height: 'calc(100vh - 68px)' }}>
            {/* Strict student card overlay (fixed top left during exam) */}
            <div className="md:w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full overflow-y-auto">
              {/* Profile Card Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-blue-200">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{user?.name}</h4>
                    <p className="text-[10px] text-slate-400">Student Roll: {user?.rollNumber}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <p className="text-slate-500 font-medium">Branch</p>
                    <p className="font-bold text-slate-300">{user?.branch}</p>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <p className="text-slate-500 font-medium">Year</p>
                    <p className="font-bold text-slate-300">{user?.year} Yr</p>
                  </div>
                </div>
              </div>

              {/* Assessment Timer & Navigation */}
              <div className="p-4 border-b border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Exam Duration Time</span>
                  <span className={`flex items-center space-x-1.5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                    <Clock className="w-4 h-4" />
                    <span>
                      {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:
                      {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
                      {Math.floor(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Questions Navigation</p>
                  <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, idx) => {
                      // Logic: must solve current question (status === Passed) before next question becomes active
                      const isClickable = idx === 0 || questions[idx - 1]?.status === 'Passed';
                      const isActive = idx === currentQuestionIdx;
                      
                      return (
                        <button
                          key={q.id}
                          disabled={!isClickable}
                          onClick={() => handleNavQuestion(idx)}
                          className={`py-2 rounded font-bold text-xs transition ${
                            isActive 
                              ? 'bg-blue-600 text-white' 
                              : q.status === 'Passed' 
                                ? 'bg-green-800/80 text-green-100 hover:bg-green-700' 
                                : isClickable 
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                  : 'bg-slate-950 text-slate-700 cursor-not-allowed border border-slate-800'
                          }`}
                        >
                          Q{idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit entire exam */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to finish the exam? Submitting will lock your responses.')) {
                      handleFinishExam();
                    }
                  }}
                  className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded text-xs transition"
                >
                  Submit Final Assessment
                </button>
              </div>

              {/* Warnings details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-end">
                <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-[10px] space-y-1">
                  <p className="font-bold text-red-400 flex items-center space-x-1.5 uppercase">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Secure Anti-Cheat Stats</span>
                  </p>
                  <p className="text-slate-300">Tab Switch Count: <span className="font-bold text-red-400">{tabSwitchWarnings} / 3</span></p>
                  <p className="text-slate-400">Warning: 3rd tab switch triggers auto-submit and lockout.</p>
                </div>
              </div>
            </div>

            {/* Left panel: Problem statement */}
            {questions[currentQuestionIdx] && (
              <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                <div className="md:w-1/2 p-6 overflow-y-auto border-r border-slate-800 bg-slate-900">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{questions[currentQuestionIdx].topic}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        questions[currentQuestionIdx].difficulty === 'Easy' 
                          ? 'bg-green-950/60 text-green-400 border border-green-900/60' 
                          : 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/60'
                      }`}>
                        {questions[currentQuestionIdx].difficulty}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white">Q{currentQuestionIdx + 1}. {questions[currentQuestionIdx].title}</h2>
                    
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {questions[currentQuestionIdx].description}
                    </div>

                    <div className="space-y-1.5 border-t border-slate-800 pt-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Constraints</h4>
                      <code className="text-xs text-slate-200 block bg-slate-950 p-2.5 rounded border border-slate-800">
                        {questions[currentQuestionIdx].constraints}
                      </code>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Input Format</h4>
                        <p className="text-xs text-slate-300">{questions[currentQuestionIdx].inputFormat || 'Read inputs standard line by line'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Output Format</h4>
                        <p className="text-xs text-slate-300">{questions[currentQuestionIdx].outputFormat || 'Print outputs standard line by line'}</p>
                      </div>
                    </div>

                    {questions[currentQuestionIdx].sampleInput && (
                      <div className="space-y-1.5 border-t border-slate-800 pt-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sample Input</h4>
                        <pre className="text-xs text-slate-300 block bg-slate-950 p-2.5 rounded border border-slate-800 font-mono">
                          {questions[currentQuestionIdx].sampleInput}
                        </pre>
                      </div>
                    )}

                    {questions[currentQuestionIdx].sampleOutput && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sample Output</h4>
                        <pre className="text-xs text-slate-300 block bg-slate-950 p-2.5 rounded border border-slate-800 font-mono">
                          {questions[currentQuestionIdx].sampleOutput}
                        </pre>
                      </div>
                    )}

                    {questions[currentQuestionIdx].explanation && (
                      <div className="space-y-1.5 text-xs text-slate-400">
                        <span className="font-bold block text-slate-300">Explanation:</span>
                        <p>{questions[currentQuestionIdx].explanation}</p>
                      </div>
                    )}

                    <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                      Hidden Evaluation Test Cases Count: <span className="font-semibold">{questions[currentQuestionIdx].hiddenTestCasesCount}</span>
                    </div>
                  </div>
                </div>

                {/* Right panel: Monaco Code Editor Workspace */}
                <div ref={editorContainerRef} className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                  {/* Workspace header */}
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedLanguage}
                        onChange={e => setSelectedLanguage(e.target.value as any)}
                        className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-800 font-semibold focus:outline-none"
                      >
                        <option value="Python">Python 3</option>
                        <option value="Java">Java (class Solution)</option>
                        <option value="C">C Language</option>
                      </select>
                      
                      <div className="flex items-center space-x-1.5 bg-slate-950 rounded border border-slate-800 px-2 py-0.5">
                        <button onClick={() => setEditorFontSize(Math.min(24, editorFontSize + 1))} className="p-1 hover:text-white" title="Font size up"><ZoomIn className="w-3.5 h-3.5" /></button>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{editorFontSize}px</span>
                        <button onClick={() => setEditorFontSize(Math.max(10, editorFontSize - 1))} className="p-1 hover:text-white" title="Font size down"><ZoomOut className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <button onClick={toggleFullscreen} className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800" title="Toggle full screen">
                      <Maximize className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>

                  {/* Monaco Editor Component */}
                  <div className="flex-1 min-h-[300px]">
                    <Editor
                      height="100%"
                      language={selectedLanguage.toLowerCase()}
                      theme="vs-dark"
                      value={code}
                      onChange={val => setCode(val || '')}
                      options={{
                        fontSize: editorFontSize,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        lineNumbers: 'on',
                        contextmenu: false, // Disables standard Monaco right-click context menu
                      }}
                    />
                  </div>

                  {/* Sandbox Run result & footer console details */}
                  <div className="h-56 bg-slate-900 border-t border-slate-800 flex flex-col">
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center space-x-1.5 uppercase font-bold tracking-wider">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span>Execution Terminal Output</span>
                      </span>
                      {runResult && (
                        <span className={`font-bold flex items-center space-x-1 ${runResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {runResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{runResult.status} ({runResult.passedTestCasesCount}/{runResult.totalTestCasesCount} Cases Passed)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-slate-950 text-slate-300">
                      {isRunning ? (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Compiling code and executing test cases inside local Docker simulation...</span>
                        </div>
                      ) : runResult ? (
                        <div className="space-y-3">
                          {runResult.compilationError && (
                            <div className="text-red-400 bg-red-950/20 p-2.5 rounded border border-red-900/40">
                              <p className="font-bold text-red-500">Compilation Error Output:</p>
                              <pre className="whitespace-pre-wrap">{runResult.compilationError}</pre>
                            </div>
                          )}
                          
                          {runResult.runtimeError && (
                            <div className="text-red-400 bg-red-950/20 p-2.5 rounded border border-red-900/40">
                              <p className="font-bold text-red-500">Runtime/Timeout Exception:</p>
                              <pre className="whitespace-pre-wrap">{runResult.runtimeError}</pre>
                            </div>
                          )}

                          {runResult.visibleResults && runResult.visibleResults.map((tc: any, tcIdx: number) => (
                            <div key={tcIdx} className={`p-2.5 rounded border ${tc.passed ? 'border-green-900/40 bg-green-950/10' : 'border-red-900/40 bg-red-950/10'}`}>
                              <p className={`font-bold ${tc.passed ? 'text-green-400' : 'text-red-400'}`}>
                                Visible Case #{tcIdx + 1}: {tc.passed ? 'Passed' : 'Failed'}
                              </p>
                              <p className="text-slate-500 mt-1">Input: <code className="text-slate-300">{tc.input}</code></p>
                              <p className="text-slate-500">Expected: <code className="text-slate-300">{tc.expectedOutput.trim()}</code></p>
                              <p className="text-slate-500">Received: <code className={`${tc.passed ? 'text-green-400' : 'text-red-400'}`}>{tc.actualOutput.trim() || 'N/A'}</code></p>
                            </div>
                          ))}
                          
                          {runResult.success && (
                            <div className="text-green-400 bg-green-950/20 p-3 rounded border border-green-900/40 flex items-center space-x-2">
                              <Check className="w-5 h-5" />
                              <div>
                                <p className="font-bold">All 13 test cases passed successfully!</p>
                                <p className="text-[10px] text-slate-400">AI Background review activated. Next Question button unlocked.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500">Compile and execution results will be printed here.</p>
                      )}
                    </div>

                    {/* Console buttons */}
                    <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                      <button 
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="bg-navy-600 hover:bg-navy-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center space-x-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Code</span>
                      </button>

                      {/* Next Question Navigation */}
                      <button
                        disabled={questions[currentQuestionIdx]?.status !== 'Passed' || currentQuestionIdx === questions.length - 1}
                        onClick={() => handleNavQuestion(currentQuestionIdx + 1)}
                        className={`text-xs font-semibold px-5 py-2.5 rounded-lg transition ${
                          questions[currentQuestionIdx]?.status === 'Passed' && currentQuestionIdx !== questions.length - 1
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        Next Question
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inactivity warning popup */}
            {showInactivityPopup && (
              <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-slate-200 shadow-2xl text-slate-900 text-center space-y-4">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-900">Are you there?</h3>
                  <p className="text-sm text-slate-500">Inactivity has been detected for 60 seconds. Please interact with the window to resume your assessment.</p>
                  <p className="text-xs text-red-500 font-semibold">Idle time: {inactivityTimer} seconds</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Faculty & Admin dashboards */}
        {user && user.role !== 'student' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            {/* Tab selection */}
            <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'faculty-panel')}
                className={`py-3 px-6 text-sm font-bold border-b-2 flex items-center space-x-2 transition ${
                  currentPage === 'admin-dashboard' || currentPage === 'faculty-panel'
                    ? 'border-navy-900 text-navy-950' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Live Monitoring Dashboard</span>
              </button>
              
              <button 
                onClick={() => setCurrentPage('reports')}
                className={`py-3 px-6 text-sm font-bold border-b-2 flex items-center space-x-2 transition ${
                  currentPage === 'reports' 
                    ? 'border-navy-900 text-navy-950' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Analytical Reports Hub</span>
              </button>
            </div>

            {/* Live Monitoring Dashboard View */}
            {(currentPage === 'admin-dashboard' || currentPage === 'faculty-panel') && monitorStats && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{monitorStats.cards.totalStudents}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Active Exams</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
                      <span>{monitorStats.cards.activeStudents}</span>
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{monitorStats.cards.completedStudents}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Violations Logged</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{monitorStats.cards.violationsCount}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Terminated</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{monitorStats.cards.terminatedStudents}</p>
                  </div>
                </div>

                {/* Sub sections: Token desk, Question desk, Student track Table */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column: Admin token issuing desk */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h3 className="font-bold text-sm text-navy-950 uppercase tracking-wide flex items-center space-x-1.5">
                      <Key className="w-4 h-4 text-blue-500" />
                      <span>Security Tokens Desk</span>
                    </h3>

                    <form onSubmit={handleGenerateToken} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Select Candidate</label>
                        <select 
                          value={tokenStudentId} onChange={e => setTokenStudentId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none"
                        >
                          <option value="">-- Choose Student --</option>
                          {allStudentsList.map(st => (
                            <option key={st.id} value={st.id}>{st.name} ({st.rollNumber})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Expiry Time (Minutes)</label>
                        <input 
                          type="number" value={tokenExpiryMinutes} onChange={e => setTokenExpiryMinutes(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none"
                          min="1" max="1440"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold py-2 rounded-lg transition"
                      >
                        Generate Unique Token
                      </button>
                    </form>

                    {/* Issued tokens list */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-4 max-h-[140px] overflow-y-auto">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Active Secure Tokens</p>
                      {generatedTokens.slice(0, 5).map(tok => (
                        <div key={tok.id} className="text-[10px] flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                          <span>{tok.user.name} ({tok.user.rollNumber})</span>
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{tok.tokenString}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Question Bank manager & upload */}
                  <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h3 className="font-bold text-sm text-navy-950 uppercase tracking-wide flex items-center space-x-1.5">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span>Upload Coding Questions</span>
                    </h3>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Bulk Upload (JSON Array Format)</label>
                      <textarea
                        value={bulkQuestionsText} onChange={e => setBulkQuestionsText(e.target.value)}
                        placeholder='[{"title": "Sum of Two", "topic": "Input Output", "difficulty": "Easy", "description": "Write a program...", "constraints": "None", "visible_test_cases": [{"input":"1 2", "output":"3\\n"}], "hidden_test_cases": [{"input":"5 5", "output":"10\\n"}]}]'
                        className="w-full h-[150px] p-3 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400">Formats supported: Individual JSON definitions and JSON Arrays.</p>
                      <button 
                        onClick={handleBulkUploadQuestions}
                        className="bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Submit Question Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Candidate tracking dashboard */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-navy-950 uppercase tracking-wide flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span>Live Candidate Tracking Terminal</span>
                    </h3>
                    
                    <button 
                      onClick={refreshMonitoringStats}
                      className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reload List</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 text-[10px] uppercase">
                          <th className="p-3">Roll Number</th>
                          <th className="p-3">Candidate Name</th>
                          <th className="p-3">Assessment</th>
                          <th className="p-3 text-center">Solved Qs</th>
                          <th className="p-3">Language</th>
                          <th className="p-3 text-center">Violations</th>
                          <th className="p-3 text-center">Compilations</th>
                          <th className="p-3">Exam Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitorStats.students.map((st: any) => (
                          <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">{st.rollNumber || 'N/A'}</td>
                            <td className="p-3">
                              <p className="font-bold">{st.studentName}</p>
                              <p className="text-[10px] text-slate-400">{st.email}</p>
                            </td>
                            <td className="p-3">{st.assessmentTitle}</td>
                            <td className="p-3 text-center font-bold text-green-600">{st.testCasePassCount}</td>
                            <td className="p-3 capitalize font-semibold">{st.languageSelected}</td>
                            <td className="p-3 text-center font-bold text-red-500 bg-red-50/20">{st.violationsCount}</td>
                            <td className="p-3 text-center">{st.compilationCount}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                st.status === 'Active' 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                  : st.status === 'Completed' 
                                    ? 'bg-green-50 text-green-600 border border-green-100' 
                                    : 'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                {st.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {st.status !== 'Completed' && (
                                <button
                                  onClick={() => handleResetStudentAttempt(st.studentId, st.assessmentId)}
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded border border-orange-200 transition"
                                  title="Unlocks block / resets violations"
                                >
                                  Grant Re-attempt
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports & Analytics Tab */}
            {currentPage === 'reports' && monitorStats && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                  <h3 className="font-bold text-sm text-navy-950 uppercase tracking-wide flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Analytical Performance Registry</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 text-[10px] uppercase">
                          <th className="p-3">Roll Number</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Assessment</th>
                          <th className="p-3 text-center">Score Ratio</th>
                          <th className="p-3 text-center">Violations</th>
                          <th className="p-3">Document Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitorStats.students.map((st: any) => (
                          <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">{st.rollNumber}</td>
                            <td className="p-3 font-bold">{st.studentName}</td>
                            <td className="p-3">{st.branch} ({st.year} Yr)</td>
                            <td className="p-3 font-semibold">{st.assessmentTitle}</td>
                            <td className="p-3 text-center font-bold text-slate-900">{st.testCasePassCount} Qs Solved</td>
                            <td className="p-3 text-center font-bold text-red-500">{st.violationsCount} Warnings</td>
                            <td className="p-3 space-x-2">
                              {/* PDF Export Link */}
                              <a
                                href={`${API_BASE}/reports/student/${st.studentId}/assessment/${st.assessmentId}/pdf?authorization=Bearer ${token}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-600 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Export PDF</span>
                              </a>

                              <span className="text-slate-300">|</span>

                              {/* Excel Export Link */}
                              <a
                                href={`${API_BASE}/reports/assessment/${st.assessmentId}/excel?authorization=Bearer ${token}`}
                                className="inline-flex items-center space-x-1 text-green-600 hover:underline"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Batch Excel</span>
                              </a>

                              <span className="text-slate-300">|</span>

                              {/* Send Email Reports Button */}
                              <button
                                onClick={() => handleSendEmailReport(st.studentId, st.assessmentId, st.email)}
                                className="inline-flex items-center space-x-1 text-navy-800 hover:underline font-semibold"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Email PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer information */}
      <footer className="bg-slate-900 text-slate-400 py-4 px-6 text-center text-[10px] border-t border-slate-800">
        &copy; 2026 Institutional Assessment Platform. All coding assessments sandbox compiled and logged securely under SSL/Audit protocols.
      </footer>
    </div>
  );
}
