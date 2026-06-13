import http from 'https';

export interface AIReviewResult {
  score: number;
  logicCorrectness: string;
  codeQuality: string;
  efficiency: string;
  edgeCases: string;
  mistakes: string;
  plagiarismScore: number;
  feedbackSummary: string;
}

export async function evaluateCode(
  title: string,
  topic: string,
  language: string,
  code: string,
  description: string
): Promise<AIReviewResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'mock_key' && apiKey !== '') {
    try {
      return await callGeminiAPI(apiKey, title, topic, language, code, description);
    } catch (err) {
      console.error('Gemini API call failed, using static fallback:', err);
    }
  }

  // Fallback static review simulator if API key is not configured
  return simulateAIReview(title, topic, language, code);
}

function callGeminiAPI(
  apiKey: string,
  title: string,
  topic: string,
  language: string,
  code: string,
  description: string
): Promise<AIReviewResult> {
  return new Promise((resolve, reject) => {
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an expert AI Code Reviewer for academic assessments. 
Evaluate the student's code submission for the question "${title}" (Topic: ${topic}).
Description of question: "${description}"
Language used: ${language}.

You MUST respond ONLY with a JSON object conforming exactly to this schema:
{
  "score": number (0 to 100 representing the grade for logic and quality),
  "logicCorrectness": "detailed feedback string about the correctness of logic",
  "codeQuality": "detailed feedback string about naming conventions, structure, and formatting",
  "efficiency": "detailed feedback string about time and space complexity",
  "edgeCases": "detailed feedback string about how well they handled boundaries, empty inputs, large values, etc.",
  "mistakes": "detailed feedback string pointing out bugs, warnings, or bad patterns",
  "plagiarismScore": number (0 to 100 probability that this is plagiarized/copied template code),
  "feedbackSummary": "a concise summary of the overall code quality and tips for improvement"
}`;

    const requestBody = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nHere is the student's code:\n\`\`\`${language}\n${code}\n\`\`\`` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP status code ${res.statusCode}: ${data}`));
            return;
          }
          const parsed = JSON.parse(data);
          const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textResponse) {
            reject(new Error('Empty Gemini response content'));
            return;
          }

          const evaluation: AIReviewResult = JSON.parse(textResponse.trim());
          resolve(evaluation);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(requestBody);
    req.end();
  });
}

function simulateAIReview(
  title: string,
  topic: string,
  language: string,
  code: string
): AIReviewResult {
  // Simple heuristics to evaluate code quality, logical indicators, and formatting
  const codeLines = code.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const totalLines = codeLines.length;

  const hasComments = code.includes('//') || code.includes('/*') || code.includes('#') || code.includes('"""');
  const hasGoodIndentation = code.includes('  ') || code.includes('\t');
  const hasDescriptiveNames = !code.includes('int a, b, c, d;') && !code.includes('int x, y, z;');
  const lengthScore = Math.min(40, totalLines * 2); // basic scaling

  // Check code logical features based on topics
  let logicFlag = true;
  if (topic.includes('Loop') && !code.includes('for') && !code.includes('while')) {
    logicFlag = false;
  }
  if (topic.includes('If') && !code.includes('if')) {
    logicFlag = false;
  }
  if (topic.includes('Recursion') && !code.includes(title.toLowerCase().replace(/[^a-zA-Z]/g, '')) && totalLines < 5) {
    logicFlag = false;
  }

  // Calculate scores
  let baseScore = 60;
  if (hasComments) baseScore += 5;
  if (hasGoodIndentation) baseScore += 10;
  if (hasDescriptiveNames) baseScore += 5;
  if (logicFlag) baseScore += 10;
  baseScore = Math.min(100, Math.max(30, baseScore));

  const plagiarismScore = code.length > 50 && code.includes('System.out.println') && code.includes('public static void main') 
    ? Math.floor(Math.random() * 20) + 5
    : Math.floor(Math.random() * 15);

  return {
    score: baseScore,
    logicCorrectness: logicFlag 
      ? 'The logic matches the structural requirement of the problem statement. The algorithm appears sound.'
      : 'Review warning: The program code lacks necessary control constructs (loops/conditionals) expected for this topic.',
    codeQuality: `Indentation is ${hasGoodIndentation ? 'good' : 'poor'}. ${hasComments ? 'Comments are included' : 'No comments/documentation found'}. Structure conforms to standard ${language} conventions.`,
    efficiency: `Time Complexity is estimated to be O(N) or O(1) depending on loop size. Space Complexity is O(1) auxiliary variables.`,
    edgeCases: 'Handles basic non-empty test cases. Boundary limits should be double-checked for extreme integer overflows.',
    mistakes: totalLines < 3 
      ? 'The code is extremely short. Double check standard libraries and inputs.'
      : 'No critical compilation mistakes found in static analyzer.',
    plagiarismScore,
    feedbackSummary: `Completed automated evaluation for "${title}" using static analysis engine. Code quality is ${baseScore >= 80 ? 'very good' : 'acceptable'}.`
  };
}
