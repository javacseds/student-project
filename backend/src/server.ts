import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { 
  initDb, User, Question, Assessment, AssessmentQuestion, Token, 
  Submission, ViolationLog, ExamSession, sequelize 
} from './db';
import { runCode, compareOutputs } from './services/compiler';
import { evaluateCode } from './services/ai';
import { generateStudentPDF, generateBatchExcel, sendEmailWithReports } from './services/reports';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_jwt_key_12345';

// --- Authentication Middleware ---

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: 'admin' | 'faculty' | 'student';
    email: string;
  };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireRole(roles: ('admin' | 'faculty' | 'student')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: insufficient privileges' });
    }
    next();
  };
}

// --- Live Dashboard Socket Manager ---

io.on('connection', (socket) => {
  console.log('Client connected to monitor:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper to broadcast changes to all monitors
function broadcastMonitoringUpdate() {
  io.emit('monitor:refresh');
}

// --- API Routes ---

// 1. AUTHENTICATION & REGISTRATION

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, rollNumber, employeeId, branch, year, department } = req.body;

  try {
    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long, contain one uppercase, one lowercase, one number, and one special character.' 
      });
    }

    // Check unique constraints
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email ID already registered.' });

    if (role === 'student') {
      if (!rollNumber) return res.status(400).json({ error: 'Roll number is required for students.' });
      const existingRoll = await User.findOne({ where: { rollNumber } });
      if (existingRoll) return res.status(400).json({ error: 'Roll Number already exists.' });
    } else if (role === 'faculty') {
      if (!employeeId) return res.status(400).json({ error: 'Employee ID is required for faculty.' });
      const existingEmp = await User.findOne({ where: { employeeId } });
      if (existingEmp) return res.status(400).json({ error: 'Employee ID already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      rollNumber: role === 'student' ? rollNumber : undefined,
      employeeId: role === 'faculty' ? employeeId : undefined,
      branch: role === 'student' ? branch : undefined,
      year: role === 'student' ? Number(year) : undefined,
      department: role === 'faculty' ? department : undefined,
      status: 'active' // Email verification bypass for development simplicity
    });

    res.status(201).json({ message: 'Account registered successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, token } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPass = await bcrypt.compare(password, user.passwordHash);
    if (!validPass) return res.status(400).json({ error: 'Invalid email or password.' });

    // Access control for students
    if (user.role === 'student') {
      // Check maximum 2 exam attempts per day limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const attemptCount = await ExamSession.count({
        where: {
          studentId: user.id,
          createdAt: {
            [sequelize.Sequelize.Op.gte]: todayStart
          }
        }
      });

      // If limits exceeded, block unless they provide an admin token
      if (attemptCount >= 2 && !token) {
        return res.status(403).json({ 
          error: 'Daily access limit (Maximum 2 attempts) exceeded. Secure Admin Token approval required.' 
        });
      }

      if (token) {
        // Validate Secure Token
        const dbToken = await Token.findOne({ where: { tokenString: token, isUsed: false } });
        if (!dbToken || dbToken.studentId !== user.id || new Date() > dbToken.expiresAt) {
          return res.status(400).json({ error: 'Invalid, expired, or already used secure token.' });
        }
      }
    }

    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        branch: user.branch,
        year: user.year,
        department: user.department
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByPk(req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ADMIN/FACULTY ACTIONS: TOKENS & ASSESSMENTS

app.post('/api/tokens/generate', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const { studentId, durationMinutes = 60 } = req.body;
  try {
    const student = await User.findOne({ where: { id: studentId, role: 'student' } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Generate clean unique 8-character token
    const tokenString = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + Number(durationMinutes));

    const newToken = await Token.create({
      tokenString,
      studentId,
      expiresAt,
      isUsed: false
    });

    res.status(201).json({ token: newToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List students for admin token allocation dropdown
app.get('/api/students', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  try {
    const students = await User.findAll({ where: { role: 'student' } });
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve dynamic tokens
app.get('/api/tokens', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  try {
    const tokens = await Token.findAll({
      include: [{ model: User, attributes: ['name', 'rollNumber', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(tokens);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments', authenticateToken, requireRole(['admin', 'faculty']), async (req: AuthRequest, res) => {
  const { title, description, durationMinutes, date, questionIds } = req.body;
  try {
    const assessment = await Assessment.create({
      title,
      description,
      durationMinutes,
      date,
      createdBy: req.user!.id
    });

    if (questionIds && Array.isArray(questionIds)) {
      for (let i = 0; i < questionIds.length; i++) {
        await AssessmentQuestion.create({
          assessmentId: assessment.id,
          questionId: questionIds[i],
          orderIndex: i
        });
      }
    }

    res.status(201).json(assessment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/assessments', authenticateToken, async (req, res) => {
  try {
    const assessments = await Assessment.findAll({
      include: [{ model: Question, attributes: ['id', 'title', 'topic', 'difficulty'] }]
    });
    res.json(assessments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/assessments/:id/questions', authenticateToken, async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id, {
      include: [{ model: Question }]
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    
    // Sort questions by their order index in AssessmentQuestion
    const orderMappings = await AssessmentQuestion.findAll({ where: { assessmentId: assessment.id } });
    const orderMap = new Map(orderMappings.map(o => [o.questionId, o.orderIndex]));

    const sortedQuestions = assessment.questions.sort((a, b) => {
      return (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0);
    });

    res.json(sortedQuestions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload questions (json support)
app.post('/api/questions/bulk', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const { questionsList } = req.body;
  try {
    if (!Array.isArray(questionsList)) return res.status(400).json({ error: 'Invalid question list format.' });

    let addedCount = 0;
    const latestQ = await Question.findOne({ order: [['id', 'DESC']] });
    let startId = (latestQ ? latestQ.id : 0) + 1;

    for (const q of questionsList) {
      // Basic formatting of bulk file questions
      await Question.create({
        id: startId++,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty || 'Easy',
        description: q.description || q.statement,
        constraints: q.constraints || 'None',
        inputFormat: q.inputFormat || q.input_format || '',
        outputFormat: q.outputFormat || q.output_format || '',
        sampleInput: q.sampleInput || q.sample_input || '',
        sampleOutput: q.sampleOutput || q.sample_output || '',
        explanation: q.explanation || '',
        visibleTestCases: JSON.stringify(q.visibleTestCases || q.visible_test_cases || []),
        hiddenTestCases: JSON.stringify(q.hiddenTestCases || q.hidden_test_cases || []),
        languageSupport: JSON.stringify(q.languageSupport || ['C', 'Java', 'Python'])
      });
      addedCount++;
    }

    res.json({ message: `Successfully bulk uploaded ${addedCount} questions.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single question upload
app.post('/api/questions', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const q = req.body;
  try {
    const latestQ = await Question.findOne({ order: [['id', 'DESC']] });
    const nextId = (latestQ ? latestQ.id : 0) + 1;

    const newQ = await Question.create({
      id: nextId,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty || 'Easy',
      description: q.description,
      constraints: q.constraints || 'None',
      inputFormat: q.inputFormat,
      outputFormat: q.outputFormat,
      sampleInput: q.sampleInput,
      sampleOutput: q.sampleOutput,
      explanation: q.explanation,
      visibleTestCases: JSON.stringify(q.visibleTestCases || []),
      hiddenTestCases: JSON.stringify(q.hiddenTestCases || []),
      languageSupport: JSON.stringify(q.languageSupport || ['C', 'Java', 'Python'])
    });

    res.status(201).json(newQ);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List all questions for assessment builder
app.get('/api/questions', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  try {
    const questions = await Question.findAll({
      attributes: ['id', 'title', 'topic', 'difficulty']
    });
    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. STUDENT LIFE-CYCLE EXAM WORKSPACE API

// Start Exam Session
app.post('/api/assessments/:id/session/start', authenticateToken, async (req: AuthRequest, res) => {
  const assessmentId = Number(req.params.id);
  const studentId = req.user!.id;
  const { token } = req.body;

  try {
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    // Check if token was used and invalidate it
    if (token) {
      const dbToken = await Token.findOne({ where: { tokenString: token, studentId, isUsed: false } });
      if (dbToken) {
        dbToken.isUsed = true;
        await dbToken.save();
      }
    }

    // Check existing active session
    let session = await ExamSession.findOne({ 
      where: { studentId, assessmentId, status: 'Active' } 
    });

    if (!session) {
      // Get attempts today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const attemptsCount = await ExamSession.count({
        where: {
          studentId,
          createdAt: {
            [sequelize.Sequelize.Op.gte]: todayStart
          }
        }
      });

      session = await ExamSession.create({
        studentId,
        assessmentId,
        tokenUsed: token || null,
        loginTime: new Date(),
        status: 'Active',
        currentQuestionIndex: 0,
        inactivityWarningsCount: 0,
        compilationCount: 0,
        attemptsToday: attemptsCount + 1
      });
    }

    broadcastMonitoringUpdate();
    res.json({ session });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Active Exam State
app.get('/api/assessments/:id/session/state', authenticateToken, async (req: AuthRequest, res) => {
  const assessmentId = Number(req.params.id);
  const studentId = req.user!.id;

  try {
    const session = await ExamSession.findOne({
      where: { studentId, assessmentId, status: 'Active' }
    });
    if (!session) return res.status(404).json({ error: 'No active session found.' });

    // Fetch questions inside assessment
    const orderMappings = await AssessmentQuestion.findAll({ where: { assessmentId } });
    const orderMap = new Map(orderMappings.map(o => [o.questionId, o.orderIndex]));
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{ model: Question }]
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    const questions = assessment.questions.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));

    // Get submission status for each question
    const submissions = await Submission.findAll({
      where: { studentId, assessmentId }
    });

    const statusMap = new Map(submissions.map(s => [s.questionId, s.status]));

    res.json({
      session,
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty,
        description: q.description,
        constraints: q.constraints,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        sampleInput: q.sampleInput,
        sampleOutput: q.sampleOutput,
        explanation: q.explanation,
        languageSupport: JSON.parse(q.languageSupport),
        hiddenTestCasesCount: JSON.parse(q.hiddenTestCases).length,
        status: statusMap.get(q.id) || 'Unsolved'
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Execute code, compile and run against test cases
app.post('/api/assessments/:id/session/run-code', authenticateToken, async (req: AuthRequest, res) => {
  const assessmentId = Number(req.params.id);
  const studentId = req.user!.id;
  const { questionId, language, code } = req.body;

  try {
    const session = await ExamSession.findOne({ where: { studentId, assessmentId, status: 'Active' } });
    if (!session) return res.status(400).json({ error: 'No active assessment session.' });

    const q = await Question.findByPk(questionId);
    if (!q) return res.status(404).json({ error: 'Question not found' });

    // Increment compilation count
    session.compilationCount += 1;
    await session.save();

    const visibleCases = JSON.parse(q.visibleTestCases) as TestCase[];
    const hiddenCases = JSON.parse(q.hiddenTestCases) as TestCase[];
    const allCases = [...visibleCases, ...hiddenCases];

    const results = [];
    let passedCount = 0;
    let compilationError = '';
    let runtimeError = '';
    let infiniteLoop = false;

    // Execute the code on all test cases in the sandbox
    for (let i = 0; i < allCases.length; i++) {
      const execResult = await runCode(language, code, allCases[i]);

      if (!execResult.compileSuccess) {
        compilationError = execResult.error || 'Compilation Error';
        break;
      }

      if (execResult.timeLimitExceeded) {
        infiniteLoop = true;
        runtimeError = execResult.error || 'Time Limit Exceeded';
        break;
      }

      if (execResult.error) {
        runtimeError = execResult.error;
      }

      const match = compareOutputs(execResult.output, allCases[i].output);
      if (match) {
        passedCount++;
      }

      // We only return detail of first 3 cases (visible) to the student interface, others are kept hidden
      if (i < 3) {
        results.push({
          testCaseIndex: i,
          input: allCases[i].input,
          expectedOutput: allCases[i].output,
          actualOutput: execResult.output,
          passed: match,
          error: execResult.error
        });
      }
    }

    const success = (passedCount === allCases.length) && !compilationError && !runtimeError;
    const finalStatus = success ? 'Passed' : 'Failed';

    // Save submission data
    const [sub] = await Submission.upsert({
      studentId,
      assessmentId,
      questionId,
      selectedLanguage: language,
      submittedCode: code,
      status: finalStatus,
      passedTestCasesCount: passedCount,
      totalTestCasesCount: allCases.length
    });

    // Fire AI Review evaluation asynchronously in background to prevent blocking client request
    if (success || passedCount > 0) {
      evaluateCode(q.title, q.topic, language, code, q.description)
        .then(async (aiReview) => {
          const s = await Submission.findOne({ where: { studentId, assessmentId, questionId } });
          if (s) {
            s.aiScore = aiReview.score;
            s.aiFeedback = JSON.stringify(aiReview);
            await s.save();
          }
        })
        .catch(console.error);
    }

    broadcastMonitoringUpdate();

    res.json({
      success,
      status: finalStatus,
      passedTestCasesCount: passedCount,
      totalTestCasesCount: allCases.length,
      visibleResults: results,
      compilationError,
      runtimeError,
      infiniteLoop
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update current question navigation index
app.post('/api/assessments/:id/session/navigation', authenticateToken, async (req: AuthRequest, res) => {
  const assessmentId = Number(req.params.id);
  const studentId = req.user!.id;
  const { questionIndex } = req.body;

  try {
    const session = await ExamSession.findOne({ where: { studentId, assessmentId, status: 'Active' } });
    if (!session) return res.status(400).json({ error: 'No active session.' });

    session.currentQuestionIndex = Number(questionIndex);
    await session.save();

    broadcastMonitoringUpdate();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete and finish exam
app.post('/api/assessments/:id/session/finish', authenticateToken, async (req: AuthRequest, res) => {
  const assessmentId = Number(req.params.id);
  const studentId = req.user!.id;

  try {
    const session = await ExamSession.findOne({ where: { studentId, assessmentId, status: 'Active' } });
    if (!session) return res.status(400).json({ error: 'No active exam session.' });

    session.status = 'Completed';
    session.logoutTime = new Date();
    await session.save();

    broadcastMonitoringUpdate();
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ANTI-CHEATING CONTROLLERS

app.post('/api/cheat/violation', authenticateToken, async (req: AuthRequest, res) => {
  const { assessmentId, type, details } = req.body;
  const studentId = req.user!.id;

  try {
    const session = await ExamSession.findOne({ where: { studentId, assessmentId, status: 'Active' } });
    if (!session) return res.status(400).json({ error: 'No active session for anti-cheat logging.' });

    // Calculate warning levels based on type
    const previousCount = await ViolationLog.count({ where: { studentId, assessmentId, type } });
    const warningLevel = previousCount + 1;

    // Log violation in DB
    const violation = await ViolationLog.create({
      studentId,
      assessmentId,
      type,
      warningLevel,
      details: details || `Violation of type ${type}`
    });

    let autoSubmitted = false;

    // Rule: Third tab switch automatically submits and logs out student
    if (type === 'TabSwitch' && warningLevel >= 3) {
      session.status = 'Terminated';
      session.logoutTime = new Date();
      await session.save();
      autoSubmitted = true;
    }

    broadcastMonitoringUpdate();
    res.json({ violation, warningLevel, autoSubmitted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inactivity check ping
app.post('/api/cheat/ping-activity', authenticateToken, async (req: AuthRequest, res) => {
  const { assessmentId } = req.body;
  const studentId = req.user!.id;

  try {
    // Simply check that session exists and is active.
    // Client calls this periodically to denote presence. If inactivity exceeds thresholds,
    // the client or server auto-submits.
    const session = await ExamSession.findOne({ where: { studentId, assessmentId, status: 'Active' } });
    if (!session) return res.status(400).json({ error: 'Session inactive' });

    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. LIVE MONITORING & TRACKING

app.get('/api/monitor/stats', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  try {
    const sessions = await ExamSession.findAll({
      include: [
        { model: User, attributes: ['name', 'rollNumber', 'branch', 'year', 'email'] },
        { model: Assessment, attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format monitoring metrics
    const list = [];
    let total = 0, active = 0, completed = 0, pending = 0, terminated = 0;

    for (const s of sessions) {
      total++;
      if (s.status === 'Active') active++;
      else if (s.status === 'Completed') completed++;
      else if (s.status === 'Terminated') terminated++;

      // Count violations
      const violationsCount = await ViolationLog.count({
        where: { studentId: s.studentId, assessmentId: s.assessmentId }
      });

      // Get compilation details
      const submissions = await Submission.findAll({
        where: { studentId: s.studentId, assessmentId: s.assessmentId }
      });
      const passedCount = submissions.filter(sub => sub.status === 'Passed').length;

      // Find current selected language from latest submission
      const latestSub = submissions[submissions.length - 1];
      const lang = latestSub ? latestSub.selectedLanguage : 'None';

      list.push({
        id: s.id,
        studentId: s.studentId,
        assessmentId: s.assessmentId,
        studentName: s.user.name,
        rollNumber: s.user.rollNumber,
        branch: s.user.branch,
        year: s.user.year,
        email: s.user.email,
        assessmentTitle: s.assessment.title,
        loginTime: s.loginTime,
        logoutTime: s.logoutTime,
        status: s.status,
        currentQuestionIndex: s.currentQuestionIndex + 1,
        languageSelected: lang,
        compilationCount: s.compilationCount,
        testCasePassCount: passedCount,
        violationsCount
      });
    }

    res.json({
      cards: {
        totalStudents: total,
        activeStudents: active,
        completedStudents: completed,
        pendingStudents: pending,
        violationsCount: await ViolationLog.count(),
        terminatedStudents: terminated
      },
      students: list
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin toggle extra attempts for locked out students
app.post('/api/monitor/reset-attempts', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const { studentId, assessmentId } = req.body;
  try {
    const session = await ExamSession.findOne({ where: { studentId, assessmentId } });
    if (session) {
      session.status = 'Active';
      session.logoutTime = undefined;
      session.currentQuestionIndex = 0;
      await session.save();
      
      // Clear past violations to give fresh start
      await ViolationLog.destroy({ where: { studentId, assessmentId } });

      broadcastMonitoringUpdate();
      return res.json({ message: 'Exam session successfully reset and extra attempt granted.' });
    }
    res.status(404).json({ error: 'Exam session not found.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. REPORTS & EXPORTS APIS

app.get('/api/reports/student/:studentId/assessment/:assessmentId/pdf', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const studentId = Number(req.params.studentId);
  const assessmentId = Number(req.params.assessmentId);

  try {
    const student = await User.findByPk(studentId);
    const session = await ExamSession.findOne({ where: { studentId, assessmentId } });
    const assessment = await Assessment.findByPk(assessmentId);

    if (!student || !session || !assessment) {
      return res.status(404).json({ error: 'Student, session, or assessment record not found.' });
    }

    const submissions = await Submission.findAll({
      where: { studentId, assessmentId },
      include: [{ model: Question }]
    }) as any[];

    const violations = await ViolationLog.findAll({
      where: { studentId, assessmentId }
    });

    const pdfBuffer = await generateStudentPDF({
      session,
      student,
      assessmentTitle: assessment.title,
      submissions,
      violations
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Report_${student.name.replace(/\s+/g, '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/assessment/:assessmentId/excel', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const assessmentId = Number(req.params.assessmentId);

  try {
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const sessions = await ExamSession.findAll({
      where: { assessmentId },
      include: [{ model: User }]
    });

    const data = [];
    for (const s of sessions) {
      const submissions = await Submission.findAll({ where: { studentId: s.studentId, assessmentId } });
      const passedCount = submissions.filter(sub => sub.status === 'Passed').length;
      const totalCount = submissions.length;

      const avgAiScore = submissions.length > 0
        ? Math.round(submissions.reduce((acc, sub) => acc + (sub.aiScore || 0), 0) / submissions.length)
        : 0;

      const violationsCount = await ViolationLog.count({ where: { studentId: s.studentId, assessmentId } });

      data.push({
        studentName: s.user.name,
        rollNumber: s.user.rollNumber,
        branch: s.user.branch,
        year: s.user.year,
        email: s.user.email,
        assessmentTitle: assessment.title,
        status: s.status,
        passedQuestions: passedCount,
        totalQuestions: totalCount,
        violationsCount,
        avgAiScore
      });
    }

    const excelBuffer = await generateBatchExcel(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Assessment_Results_${assessmentId}.xlsx`);
    res.send(excelBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports/student/:studentId/assessment/:assessmentId/send-email', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const studentId = Number(req.params.studentId);
  const assessmentId = Number(req.params.assessmentId);
  const { destinationEmail } = req.body;

  try {
    const student = await User.findByPk(studentId);
    const session = await ExamSession.findOne({ where: { studentId, assessmentId } });
    const assessment = await Assessment.findByPk(assessmentId);

    if (!student || !session || !assessment) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const submissions = await Submission.findAll({
      where: { studentId, assessmentId },
      include: [{ model: Question }]
    }) as any[];

    const violations = await ViolationLog.findAll({
      where: { studentId, assessmentId }
    });

    const pdfBuffer = await generateStudentPDF({
      session,
      student,
      assessmentTitle: assessment.title,
      submissions,
      violations
    });

    // Also build a mini-excel with single record summary for simplicity
    const excelSummaryData = [{
      studentName: student.name,
      rollNumber: student.rollNumber,
      branch: student.branch,
      year: student.year,
      email: student.email,
      assessmentTitle: assessment.title,
      status: session.status,
      passedQuestions: submissions.filter(s => s.status === 'Passed').length,
      totalQuestions: submissions.length,
      violationsCount: violations.length,
      avgAiScore: submissions.length > 0
        ? Math.round(submissions.reduce((acc, sub) => acc + (sub.aiScore || 0), 0) / submissions.length)
        : 0
    }];
    const excelBuffer = await generateBatchExcel(excelSummaryData);

    const emailSent = await sendEmailWithReports(
      destinationEmail || student.email,
      student.name,
      assessment.title,
      pdfBuffer,
      excelBuffer
    );

    if (emailSent) {
      res.json({ message: 'Evaluation reports emailed successfully!' });
    } else {
      res.status(500).json({ error: 'Could not send email. Check SMTP server configs.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- Server Boot ---

async function start() {
  try {
    await initDb();
    server.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

start();
