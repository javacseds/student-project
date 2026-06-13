import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { getQuestions } from '../../shared/question-bank';

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// --- Model Definitions ---

export class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: 'admin' | 'faculty' | 'student';
  public rollNumber?: string;
  public employeeId?: string;
  public branch?: string;
  public year?: number;
  public department?: string;
  public status!: 'pending' | 'active';
}

User.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false }, // admin, faculty, student
  rollNumber: { type: DataTypes.STRING, unique: true, allowNull: true },
  employeeId: { type: DataTypes.STRING, unique: true, allowNull: true },
  branch: { type: DataTypes.STRING, allowNull: true },
  year: { type: DataTypes.INTEGER, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'active' } // for easier testing we default to active
}, { sequelize, modelName: 'user' });

export class Question extends Model {
  public id!: number;
  public title!: string;
  public topic!: string;
  public difficulty!: 'Easy' | 'Medium' | 'Hard';
  public description!: string;
  public constraints!: string;
  public inputFormat!: string;
  public outputFormat!: string;
  public sampleInput!: string;
  public sampleOutput!: string;
  public explanation!: string;
  public visibleTestCases!: string; // JSON String
  public hiddenTestCases!: string;  // JSON String
  public languageSupport!: string;  // JSON String
}

Question.init({
  id: { type: DataTypes.INTEGER, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  topic: { type: DataTypes.STRING, allowNull: false },
  difficulty: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  constraints: { type: DataTypes.TEXT, allowNull: false },
  inputFormat: { type: DataTypes.TEXT, allowNull: false },
  outputFormat: { type: DataTypes.TEXT, allowNull: false },
  sampleInput: { type: DataTypes.TEXT, allowNull: false },
  sampleOutput: { type: DataTypes.TEXT, allowNull: false },
  explanation: { type: DataTypes.TEXT, allowNull: false },
  visibleTestCases: { type: DataTypes.TEXT, allowNull: false },
  hiddenTestCases: { type: DataTypes.TEXT, allowNull: false },
  languageSupport: { type: DataTypes.TEXT, allowNull: false }
}, { sequelize, modelName: 'question' });

export class Assessment extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public durationMinutes!: number;
  public date!: string;
  public createdBy!: number;
}

Assessment.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
  date: { type: DataTypes.STRING, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false }
}, { sequelize, modelName: 'assessment' });

export class AssessmentQuestion extends Model {
  public id!: number;
  public assessmentId!: number;
  public questionId!: number;
  public orderIndex!: number;
}

AssessmentQuestion.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  assessmentId: { type: DataTypes.INTEGER, allowNull: false },
  questionId: { type: DataTypes.INTEGER, allowNull: false },
  orderIndex: { type: DataTypes.INTEGER, allowNull: false }
}, { sequelize, modelName: 'assessment_question' });

export class Token extends Model {
  public id!: number;
  public tokenString!: string;
  public studentId!: number;
  public expiresAt!: Date;
  public isUsed!: boolean;
}

Token.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tokenString: { type: DataTypes.STRING, unique: true, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  isUsed: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'token' });

export class Submission extends Model {
  public id!: number;
  public studentId!: number;
  public assessmentId!: number;
  public questionId!: number;
  public selectedLanguage!: string;
  public submittedCode!: string;
  public status!: 'Passed' | 'Failed';
  public passedTestCasesCount!: number;
  public totalTestCasesCount!: number;
  public aiScore?: number;
  public aiFeedback?: string; // JSON String
}

Submission.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  assessmentId: { type: DataTypes.INTEGER, allowNull: false },
  questionId: { type: DataTypes.INTEGER, allowNull: false },
  selectedLanguage: { type: DataTypes.STRING, allowNull: false },
  submittedCode: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false }, // Passed, Failed
  passedTestCasesCount: { type: DataTypes.INTEGER, allowNull: false },
  totalTestCasesCount: { type: DataTypes.INTEGER, allowNull: false },
  aiScore: { type: DataTypes.INTEGER, allowNull: true },
  aiFeedback: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, modelName: 'submission' });

export class ViolationLog extends Model {
  public id!: number;
  public studentId!: number;
  public assessmentId!: number;
  public type!: 'TabSwitch' | 'CopyPaste' | 'Blur' | 'Inactivity';
  public warningLevel!: number;
  public details!: string;
}

ViolationLog.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  assessmentId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false }, // TabSwitch, CopyPaste, Blur, Inactivity
  warningLevel: { type: DataTypes.INTEGER, allowNull: false },
  details: { type: DataTypes.TEXT, allowNull: false }
}, { sequelize, modelName: 'violation_log' });

export class ExamSession extends Model {
  public id!: number;
  public studentId!: number;
  public assessmentId!: number;
  public tokenUsed?: string;
  public loginTime?: Date;
  public logoutTime?: Date;
  public status!: 'Active' | 'Completed' | 'Terminated';
  public currentQuestionIndex!: number;
  public inactivityWarningsCount!: number;
  public compilationCount!: number;
  public attemptsToday!: number;
}

ExamSession.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  assessmentId: { type: DataTypes.INTEGER, allowNull: false },
  tokenUsed: { type: DataTypes.STRING, allowNull: true },
  loginTime: { type: DataTypes.DATE, allowNull: true },
  logoutTime: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'Active' }, // Active, Completed, Terminated
  currentQuestionIndex: { type: DataTypes.INTEGER, defaultValue: 0 },
  inactivityWarningsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  compilationCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  attemptsToday: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { sequelize, modelName: 'exam_session' });

// --- Associations ---

User.hasMany(Token, { foreignKey: 'studentId' });
Token.belongsTo(User, { foreignKey: 'studentId' });

User.hasMany(Submission, { foreignKey: 'studentId' });
Submission.belongsTo(User, { foreignKey: 'studentId' });

Assessment.hasMany(Submission, { foreignKey: 'assessmentId' });
Submission.belongsTo(Assessment, { foreignKey: 'assessmentId' });

Question.hasMany(Submission, { foreignKey: 'questionId' });
Submission.belongsTo(Question, { foreignKey: 'questionId' });

User.hasMany(ViolationLog, { foreignKey: 'studentId' });
ViolationLog.belongsTo(User, { foreignKey: 'studentId' });

Assessment.hasMany(ViolationLog, { foreignKey: 'assessmentId' });
ViolationLog.belongsTo(Assessment, { foreignKey: 'assessmentId' });

User.hasMany(ExamSession, { foreignKey: 'studentId' });
ExamSession.belongsTo(User, { foreignKey: 'studentId' });

Assessment.hasMany(ExamSession, { foreignKey: 'assessmentId' });
ExamSession.belongsTo(Assessment, { foreignKey: 'assessmentId' });

Assessment.belongsToMany(Question, { through: AssessmentQuestion, foreignKey: 'assessmentId' });
Question.belongsToMany(Assessment, { through: AssessmentQuestion, foreignKey: 'questionId' });

// --- Initialization and Seeding ---

export async function initDb() {
  await sequelize.sync({ alter: true });
  console.log('Database synced successfully.');

  // Seed Questions
  const count = await Question.count();
  if (count === 0) {
    console.log('Seeding 50 programming questions...');
    const qList = getQuestions();
    for (const q of qList) {
      await Question.create({
        id: q.id,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty as any,
        description: q.description,
        constraints: q.constraints,
        inputFormat: q.input_format,
        outputFormat: q.output_format,
        sampleInput: q.sample_input,
        sampleOutput: q.sample_output,
        explanation: q.explanation,
        visibleTestCases: JSON.stringify(q.visible_test_cases),
        hiddenTestCases: JSON.stringify(q.hidden_test_cases),
        languageSupport: JSON.stringify(q.language_support)
      });
    }
    console.log(`Seeded ${qList.length} questions.`);
  }
}

export { sequelize };
