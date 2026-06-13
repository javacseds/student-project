import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import { User, Submission, ViolationLog, ExamSession, Question } from '../db';

export interface ReportPayload {
  session: ExamSession;
  student: User;
  assessmentTitle: string;
  submissions: (Submission & { question?: Question })[];
  violations: ViolationLog[];
}

export function generateStudentPDF(payload: ReportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors
      const primaryColor = '#1e3a8a'; // Deep Navy Blue
      const secondaryColor = '#3b82f6'; // Bright Blue
      const textColor = '#1f2937'; // Charcoal
      const greyColor = '#6b7280';
      const lightGreyColor = '#f3f4f6';

      // Header Banner
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
      doc.fillColor('#ffffff')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('AI CODING ASSESSMENT PLATFORM', 40, 30, { align: 'left' });
      doc.fontSize(12)
         .font('Helvetica')
         .text('Student Examination & Performance Report', 40, 60, { align: 'left' });

      // Student Information Card
      doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('STUDENT INFORMATION', 40, 120);
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, 138).lineTo(doc.page.width - 40, 138).stroke();

      let y = 150;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Name:', 40, y).font('Helvetica').text(payload.student.name, 110, y);
      doc.font('Helvetica-Bold').text('Roll Number:', 280, y).font('Helvetica').text(payload.student.rollNumber || 'N/A', 360, y);

      y += 18;
      doc.font('Helvetica-Bold').text('Branch / Year:', 40, y).font('Helvetica').text(`${payload.student.branch || 'N/A'} / ${payload.student.year || 'N/A'} Year`, 110, y);
      doc.font('Helvetica-Bold').text('Email ID:', 280, y).font('Helvetica').text(payload.student.email, 360, y);

      // Assessment Summary
      y += 35;
      doc.fontSize(14).font('Helvetica-Bold').text('ASSESSMENT PERFORMANCE SUMMARY', 40, y);
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).stroke();

      y += 28;
      // Boxes
      const boxWidth = 160;
      const boxHeight = 60;

      // Box 1: Assessment Title & Status
      doc.rect(40, y, boxWidth, boxHeight).fill(lightGreyColor);
      doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold').text('ASSESSMENT', 50, y + 10);
      doc.fontSize(10).fillColor(primaryColor).text(payload.assessmentTitle.substring(0, 22), 50, y + 25);
      doc.fontSize(8).fillColor(greyColor).text(`Status: ${payload.session.status}`, 50, y + 42);

      // Box 2: Score & Accuracy
      const passedCount = payload.submissions.filter(s => s.status === 'Passed').length;
      const totalQuestions = payload.submissions.length || 1;
      const scorePercentage = Math.round((passedCount / totalQuestions) * 100);

      doc.rect(215, y, boxWidth, boxHeight).fill(lightGreyColor);
      doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold').text('TEST CASES ACCURACY', 225, y + 10);
      doc.fontSize(14).fillColor('#10b981').font('Helvetica-Bold').text(`${scorePercentage}%`, 225, y + 23);
      doc.fontSize(8).fillColor(greyColor).font('Helvetica').text(`${passedCount} of ${totalQuestions} Questions Passed`, 225, y + 42);

      // Box 3: Violations Logged
      const violationCount = payload.violations.length;
      doc.rect(390, y, boxWidth, boxHeight).fill(lightGreyColor);
      doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold').text('VIOLATIONS LOGGED', 400, y + 10);
      doc.fontSize(14).fillColor(violationCount > 0 ? '#ef4444' : '#10b981').font('Helvetica-Bold').text(`${violationCount}`, 400, y + 23);
      const tabSwitches = payload.violations.filter(v => v.type === 'TabSwitch').length;
      doc.fontSize(8).fillColor(greyColor).font('Helvetica').text(`${tabSwitches} Tab Switches Detected`, 400, y + 42);

      // Question wise analysis
      y += 85;
      doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text('QUESTION-WISE ANALYSIS & AI RATINGS', 40, y);
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).stroke();

      y += 28;
      for (const sub of payload.submissions) {
        if (y > doc.page.height - 180) {
          doc.addPage();
          y = 40;
        }

        const qTitle = sub.question?.title || `Question #${sub.questionId}`;
        const aiScore = sub.aiScore !== undefined ? `${sub.aiScore}/100` : 'N/A';
        const aiDetails = sub.aiFeedback ? JSON.parse(sub.aiFeedback) : null;

        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(`${qTitle} (${sub.selectedLanguage})`, 40, y);
        doc.fillColor(sub.status === 'Passed' ? '#10b981' : '#ef4444')
           .font('Helvetica-Bold')
           .text(`Execution: ${sub.status} (${sub.passedTestCasesCount}/${sub.totalTestCasesCount} Test Cases)`, 280, y, { align: 'right', width: 275 });

        y += 15;
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(9).text('AI Evaluation Rating: ', 40, y);
        doc.fillColor(secondaryColor).font('Helvetica-Bold').text(aiScore, 140, y);

        if (aiDetails) {
          y += 12;
          doc.fillColor(textColor).font('Helvetica-Bold').text('Correctness: ', 40, y)
             .font('Helvetica').fillColor(textColor).text(aiDetails.logicCorrectness || 'N/A', 115, y, { width: 440 });
          
          y += doc.heightOfString(aiDetails.logicCorrectness || 'N/A', { width: 440 }) + 2;
          doc.font('Helvetica-Bold').text('Efficiency: ', 40, y)
             .font('Helvetica').text(aiDetails.efficiency || 'N/A', 115, y, { width: 440 });

          y += doc.heightOfString(aiDetails.efficiency || 'N/A', { width: 440 }) + 2;
          doc.font('Helvetica-Bold').text('Suggestions: ', 40, y)
             .font('Helvetica').text(aiDetails.feedbackSummary || 'N/A', 115, y, { width: 440 });
          y += doc.heightOfString(aiDetails.feedbackSummary || 'N/A', { width: 440 }) + 4;
        } else {
          y += 15;
        }
        
        doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
        y += 15;
      }

      // Violations Detail
      if (payload.violations.length > 0) {
        if (y > doc.page.height - 180) {
          doc.addPage();
          y = 40;
        }
        doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text('VIOLATION LOG DETAILS', 40, y);
        doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).stroke();
        y += 28;

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textColor);
        doc.text('VIOLATION TYPE', 40, y);
        doc.text('WARNING LEVEL', 180, y);
        doc.text('DETAILS / TIMESTAMP', 280, y);
        y += 12;

        for (const v of payload.violations) {
          if (y > doc.page.height - 80) {
            doc.addPage();
            y = 40;
          }
          doc.font('Helvetica').fontSize(8).fillColor(textColor);
          doc.text(v.type, 40, y);
          doc.text(`Warning #${v.warningLevel}`, 180, y);
          doc.text(v.details.substring(0, 60), 280, y);
          y += 15;
        }
        y += 15;
      }

      // Signatures
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 40;
      }

      y += 25;
      doc.strokeColor(textColor).lineWidth(1).moveTo(40, y).lineTo(180, y).stroke();
      doc.strokeColor(textColor).lineWidth(1).moveTo(doc.page.width - 180, y).lineTo(doc.page.width - 40, y).stroke();

      y += 8;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
      doc.text('FACULTY SIGNATURE', 40, y, { width: 140, align: 'center' });
      doc.text('CONTROLLER OF EXAMINATIONS', doc.page.width - 200, y, { width: 160, align: 'center' });

      // Footer
      doc.fontSize(7).fillColor(greyColor).text('Generated automatically by the AI Coding Assessment Platform. Document ID: SECURE-PDF-' + Math.random().toString(36).substring(2, 10).toUpperCase(), 40, doc.page.height - 30, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateBatchExcel(sessionsData: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assessment Results');

  // Define Columns
  worksheet.columns = [
    { header: 'Student Name', key: 'name', width: 22 },
    { header: 'Roll Number', key: 'roll', width: 15 },
    { header: 'Branch', key: 'branch', width: 12 },
    { header: 'Year', key: 'year', width: 8 },
    { header: 'Email ID', key: 'email', width: 25 },
    { header: 'Assessment Title', key: 'title', width: 22 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Passed Qs', key: 'passed', width: 12 },
    { header: 'Total Qs', key: 'total', width: 12 },
    { header: 'Accuracy %', key: 'accuracy', width: 12 },
    { header: 'Violations Count', key: 'violations', width: 15 },
    { header: 'Avg AI Rating', key: 'aiScore', width: 15 }
  ];

  // Header Styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', family: 4, size: 10, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Deep Navy Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (const session of sessionsData) {
    const accuracy = session.totalQuestions > 0 ? Math.round((session.passedQuestions / session.totalQuestions) * 100) : 0;
    worksheet.addRow({
      name: session.studentName,
      roll: session.rollNumber,
      branch: session.branch,
      year: session.year,
      email: session.email,
      title: session.assessmentTitle,
      status: session.status,
      passed: session.passedQuestions,
      total: session.totalQuestions,
      accuracy: `${accuracy}%`,
      violations: session.violationsCount,
      aiScore: session.avgAiScore || 'N/A'
    });
  }

  // Row Styling
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.font = { name: 'Arial', family: 4, size: 9 };
      // Alternating background colors
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9FAFB' }
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}

export async function sendEmailWithReports(
  toEmail: string,
  studentName: string,
  assessmentTitle: string,
  pdfBuffer: Buffer,
  excelBuffer?: Buffer
): Promise<boolean> {
  // Config nodemailer transporter
  // We use nodemailer test transport or environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || 'mock_user',
      pass: process.env.SMTP_PASS || 'mock_pass'
    }
  });

  const mailOptions = {
    from: '"Assessment Admin" <admin@codingplatform.edu>',
    to: toEmail,
    subject: `Assessment Reports: ${studentName} - ${assessmentTitle}`,
    text: `Respected Faculty/Admin,\n\nPlease find attached the official evaluation reports for student ${studentName} for the assessment "${assessmentTitle}".\n\nAttachments:\n1. PDF Performance Report (Detailed with AI Review and Violations Log)\n2. Excel Summary Data Sheet (If requested)\n\nThank you,\nAI Coding Assessment Platform Support`,
    attachments: [
      {
        filename: `${studentName.replace(/\s+/g, '_')}_Report.pdf`,
        content: pdfBuffer
      },
      ...(excelBuffer ? [{
        filename: `Assessment_Summary_${assessmentTitle.replace(/\s+/g, '_')}.xlsx`,
        content: excelBuffer
      }] : [])
    ]
  };

  try {
    // If SMTP credentials are mock/default, we log to stdout to guarantee no fail and simple review
    if (process.env.SMTP_HOST === 'smtp.mailtrap.io' && process.env.SMTP_USER === 'mock_user') {
      console.log('--- EMAIL SIMULATION ---');
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Attachments: [PDF Report, Excel Sheet]`);
      console.log('------------------------');
      return true;
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    // Even if sending SMTP fails, we log it and return true to keep the application flow robust
    return false;
  }
}
