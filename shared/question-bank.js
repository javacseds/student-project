const questions = [
  // Topic 1: Introduction to Programming
  {
    id: 1,
    title: "Hello World",
    topic: "Introduction to Programming",
    difficulty: "Easy",
    description: "Write a program that prints 'Hello, World!' to the console.",
    constraints: "No input will be provided.",
    input_format: "No input.",
    output_format: "Print 'Hello, World!' followed by a newline.",
    sample_input: "",
    sample_output: "Hello, World!\n",
    explanation: "The program simply needs to output the exact string 'Hello, World!'",
    generator: () => {
      const cases = [];
      for (let i = 0; i < 13; i++) {
        cases.push({ input: "", output: "Hello, World!\n" });
      }
      return cases;
    }
  },
  {
    id: 2,
    title: "Welcome Message",
    topic: "Introduction to Programming",
    difficulty: "Easy",
    description: "Read a student's name from standard input and print a welcoming message: 'Welcome, [Name]!'",
    constraints: "Name length <= 50, single word.",
    input_format: "A single string containing the name.",
    output_format: "Print 'Welcome, [Name]!' followed by a newline.",
    sample_input: "Raju",
    sample_output: "Welcome, Raju!\n",
    explanation: "Read the input and print the formatted string.",
    generator: () => {
      const names = ["Raju", "Amit", "Sophia", "Ken", "John", "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi"];
      return names.map(name => ({
        input: name,
        output: `Welcome, ${name}!\n`
      }));
    }
  },
  {
    id: 3,
    title: "Formatting Output",
    topic: "Introduction to Programming",
    difficulty: "Easy",
    description: "Read a floating-point number and print it formatted to exactly two decimal places.",
    constraints: "0.0 <= N <= 1000.0",
    input_format: "A single float value.",
    output_format: "Float value formatted to 2 decimal places.",
    sample_input: "5.6789",
    sample_output: "5.68\n",
    explanation: "5.6789 rounded to two decimal places is 5.68.",
    generator: () => {
      const inputs = [5.6789, 12.3412, 0.0, 100.5, 999.999, 1.234, 45.678, 89.123, 7.001, 123.456, 9.876, 50.555, 4.444];
      return inputs.map(val => ({
        input: val.toString(),
        output: `${val.toFixed(2)}\n`
      }));
    }
  },
  // Topic 2: Input Output
  {
    id: 4,
    title: "Sum of Two Integers",
    topic: "Input Output",
    difficulty: "Easy",
    description: "Read two integers separated by space and print their sum.",
    constraints: "-10^6 <= A, B <= 10^6",
    input_format: "Two space-separated integers A and B.",
    output_format: "Print the sum A + B.",
    sample_input: "5 7",
    sample_output: "12\n",
    explanation: "5 + 7 = 12.",
    generator: () => {
      const pairs = [
        [5, 7], [10, -3], [0, 0], [100, 200], [-50, -50],
        [12345, 67890], [-9999, 9999], [12, 34], [45, 56], [78, 89],
        [100000, 500000], [-200000, 100000], [55, 45]
      ];
      return pairs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${a + b}\n`
      }));
    }
  },
  {
    id: 5,
    title: "Product of Float and Integer",
    topic: "Input Output",
    difficulty: "Easy",
    description: "Read an integer A and a float B. Output their product rounded to 3 decimal places.",
    constraints: "1 <= A <= 1000, 0.0 <= B <= 1000.0",
    input_format: "An integer A and a float B separated by a space.",
    output_format: "The product A * B rounded to 3 decimal places.",
    sample_input: "5 2.5",
    sample_output: "12.500\n",
    explanation: "5 * 2.5 = 12.5, formatted to 3 decimal places is 12.500.",
    generator: () => {
      const pairs = [
        [5, 2.5], [10, 3.14159], [2, 0.5], [100, 0.001], [7, 9.81],
        [15, 1.234], [25, 4.567], [8, 0.125], [12, 0.3333], [3, 10.5],
        [50, 2.222], [9, 1.111], [1, 999.999]
      ];
      return pairs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${(a * b).toFixed(3)}\n`
      }));
    }
  },
  {
    id: 6,
    title: "Swap Two Numbers",
    topic: "Input Output",
    difficulty: "Easy",
    description: "Read two integers A and B, swap their values, and print them separated by space.",
    constraints: "-10^4 <= A, B <= 10^4",
    input_format: "Two space-separated integers A and B.",
    output_format: "The swapped integers B and A separated by space.",
    sample_input: "10 20",
    sample_output: "20 10\n",
    explanation: "A becomes 20, B becomes 10.",
    generator: () => {
      const pairs = [
        [10, 20], [5, 5], [-1, 9], [100, 0], [45, 89],
        [12, 34], [99, -99], [3, 4], [7, 8], [23, 32],
        [500, 600], [-1000, -2000], [15, 16]
      ];
      return pairs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${b} ${a}\n`
      }));
    }
  },
  // Topic 3: Operators
  {
    id: 7,
    title: "Fahrenheit to Celsius",
    topic: "Operators",
    difficulty: "Easy",
    description: "Convert temperature from Fahrenheit to Celsius using formula: C = (F - 32) * 5 / 9. Format Celsius output to 2 decimal places.",
    constraints: "-100.0 <= F <= 300.0",
    input_format: "A float value representing temperature in Fahrenheit.",
    output_format: "Temperature in Celsius rounded to 2 decimal places.",
    sample_input: "98.6",
    sample_output: "37.00\n",
    explanation: "(98.6 - 32) * 5/9 = 37.00 Celsius.",
    generator: () => {
      const inputs = [98.6, 32.0, 212.0, 0.0, -40.0, 100.0, 50.0, 75.5, 85.0, 120.4, -10.5, 150.0, 200.0];
      return inputs.map(f => {
        const c = (f - 32) * 5 / 9;
        return {
          input: f.toString(),
          output: `${c.toFixed(2)}\n`
        };
      });
    }
  },
  {
    id: 8,
    title: "Rectangle Geometry",
    topic: "Operators",
    difficulty: "Easy",
    description: "Read the length and width of a rectangle. Print its area and perimeter separated by space. Both values as integers.",
    constraints: "1 <= length, width <= 1000",
    input_format: "Two integers representing length and width separated by space.",
    output_format: "Area and perimeter separated by space.",
    sample_input: "5 4",
    sample_output: "20 18\n",
    explanation: "Area = 5 * 4 = 20. Perimeter = 2 * (5 + 4) = 18.",
    generator: () => {
      const inputs = [
        [5, 4], [10, 10], [100, 50], [1, 1], [12, 8],
        [15, 6], [20, 10], [30, 40], [7, 3], [9, 9],
        [50, 40], [25, 4], [1000, 10]
      ];
      return inputs.map(([l, w]) => {
        const area = l * w;
        const perim = 2 * (l + w);
        return {
          input: `${l} ${w}`,
          output: `${area} ${perim}\n`
        };
      });
    }
  },
  {
    id: 9,
    title: "Bitwise Operations",
    topic: "Operators",
    difficulty: "Easy",
    description: "Read two integers A and B, print the result of bitwise AND, OR, and XOR operations on new lines.",
    constraints: "0 <= A, B <= 1000",
    input_format: "Two space-separated integers A and B.",
    output_format: "Three lines: first AND, second OR, third XOR result.",
    sample_input: "5 3",
    sample_output: "1\n7\n6\n",
    explanation: "5 (101) & 3 (011) = 1 (001). 5 | 3 = 7. 5 ^ 3 = 6.",
    generator: () => {
      const inputs = [
        [5, 3], [12, 25], [0, 7], [15, 15], [100, 200],
        [1, 0], [64, 63], [7, 8], [10, 20], [50, 30],
        [255, 0], [512, 512], [9, 10]
      ];
      return inputs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${a & b}\n${a | b}\n${a ^ b}\n`
      }));
    }
  },
  // Topic 4: If Else
  {
    id: 10,
    title: "Odd or Even",
    topic: "If Else",
    difficulty: "Easy",
    description: "Read an integer and determine if it is Odd or Even. Print 'Even' or 'Odd'.",
    constraints: "-10^9 <= N <= 10^9",
    input_format: "A single integer.",
    output_format: "Print 'Even' or 'Odd'.",
    sample_input: "4",
    sample_output: "Even\n",
    explanation: "4 is divisible by 2, so it is Even.",
    generator: () => {
      const inputs = [4, 7, 0, -1, 100, -999, 123456, -1234567, 2, 1, 9, 8, 11];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${(n % 2 === 0) ? "Even" : "Odd"}\n`
      }));
    }
  },
  {
    id: 11,
    title: "Leap Year",
    topic: "If Else",
    difficulty: "Easy",
    description: "Determine if a given year is a leap year. Print 'Leap Year' if it is, else print 'Not Leap Year'.",
    constraints: "1 <= Year <= 9999",
    input_format: "A single integer for year.",
    output_format: "'Leap Year' or 'Not Leap Year'.",
    sample_input: "2020",
    sample_output: "Leap Year\n",
    explanation: "2020 is divisible by 4 and not by 100, so it is a Leap Year.",
    generator: () => {
      const inputs = [2020, 1900, 2000, 2021, 2024, 2100, 1600, 1700, 2012, 2015, 2004, 2008, 1999];
      return inputs.map(yr => {
        const isLeap = (yr % 4 === 0 && yr % 100 !== 0) || (yr % 400 === 0);
        return {
          input: yr.toString(),
          output: `${isLeap ? "Leap Year" : "Not Leap Year"}\n`
        };
      });
    }
  },
  {
    id: 12,
    title: "Voting Eligibility",
    topic: "If Else",
    difficulty: "Easy",
    description: "Read an age of a person. If it is 18 or above, print 'Eligible to Vote'. Otherwise, print 'Not Eligible to Vote'.",
    constraints: "1 <= Age <= 150",
    input_format: "A single integer Age.",
    output_format: "'Eligible to Vote' or 'Not Eligible to Vote'.",
    sample_input: "18",
    sample_output: "Eligible to Vote\n",
    explanation: "Age 18 satisfies eligibility criteria.",
    generator: () => {
      const inputs = [18, 17, 100, 5, 21, 12, 19, 80, 15, 14, 16, 70, 1];
      return inputs.map(age => ({
        input: age.toString(),
        output: `${age >= 18 ? "Eligible to Vote" : "Not Eligible to Vote"}\n`
      }));
    }
  },
  // Topic 5: Nested If
  {
    id: 13,
    title: "Largest of Three",
    topic: "Nested If",
    difficulty: "Easy",
    description: "Read three integers and print the largest value using nested if-else statements (do not use logical operators like && or ||).",
    constraints: "-10^5 <= A, B, C <= 10^5",
    input_format: "Three space-separated integers A, B, and C.",
    output_format: "The largest integer.",
    sample_input: "12 45 32",
    sample_output: "45\n",
    explanation: "Among 12, 45, and 32, the largest is 45.",
    generator: () => {
      const inputs = [
        [12, 45, 32], [5, 5, 5], [10, 9, 8], [1, 2, 3], [-5, -10, -2],
        [100, 0, 50], [0, 0, 10], [9, 15, 12], [88, 77, 99], [40, 50, 10],
        [1000, 200, 1500], [50, 1000, 20], [99, 99, 100]
      ];
      return inputs.map(([a, b, c]) => {
        let max = a;
        if (b > max) max = b;
        if (c > max) max = c;
        return {
          input: `${a} ${b} ${c}`,
          output: `${max}\n`
        };
      });
    }
  },
  {
    id: 14,
    title: "Coordinate Quadrant",
    topic: "Nested If",
    difficulty: "Easy",
    description: "Given coordinates (X, Y) of a point in 2D space, find which quadrant it lies in. Print 'Q1', 'Q2', 'Q3', 'Q4', or 'Origin'.",
    constraints: "-1000 <= X, Y <= 1000",
    input_format: "Two space-separated integers X and Y.",
    output_format: "'Q1', 'Q2', 'Q3', 'Q4', or 'Origin'.",
    sample_input: "3 -4",
    sample_output: "Q4\n",
    explanation: "X positive and Y negative lies in the 4th quadrant.",
    generator: () => {
      const inputs = [
        [3, -4], [0, 0], [-2, -2], [-5, 8], [1, 1],
        [0, 5], [5, 0], [-10, 0], [0, -10], [10, 10],
        [-10, 10], [-10, -10], [10, -10]
      ];
      return inputs.map(([x, y]) => {
        let ans = "Origin";
        if (x > 0) {
          if (y > 0) ans = "Q1";
          else if (y < 0) ans = "Q4";
          else ans = "Origin"; // Treating axes or origin as Origin/Axis, requirement: origin/quadrant
        } else if (x < 0) {
          if (y > 0) ans = "Q2";
          else if (y < 0) ans = "Q3";
          else ans = "Origin";
        }
        return {
          input: `${x} ${y}`,
          output: `${ans}\n`
        };
      });
    }
  },
  {
    id: 15,
    title: "Grade Evaluation",
    topic: "Nested If",
    difficulty: "Easy",
    description: "Read percentage marks of a student. Print grade: 'A' for >= 90, 'B' for >= 80, 'C' for >= 70, 'D' for >= 60, else 'F'.",
    constraints: "0 <= Marks <= 100",
    input_format: "An integer representing marks.",
    output_format: "A single character representing the grade.",
    sample_input: "85",
    sample_output: "B\n",
    explanation: "85 is >= 80 and < 90, so the grade is B.",
    generator: () => {
      const inputs = [85, 90, 95, 80, 79, 70, 69, 60, 59, 100, 0, 50, 75];
      return inputs.map(marks => {
        let grade = "F";
        if (marks >= 90) grade = "A";
        else if (marks >= 80) grade = "B";
        else if (marks >= 70) grade = "C";
        else if (marks >= 60) grade = "D";
        return {
          input: marks.toString(),
          output: `${grade}\n`
        };
      });
    }
  },
  // Topic 6: Switch Case
  {
    id: 16,
    title: "Simple Calculator",
    topic: "Switch Case",
    difficulty: "Easy",
    description: "Read an operator character (+, -, *, /) and two integers A and B. Print result of application. For '/', output integer division. For invalid operator, print 'Invalid Operator'.",
    constraints: "Operators: +, -, *, /. -1000 <= A, B <= 1000. B != 0 for '/'.",
    input_format: "A character operator, followed by two space-separated integers A and B.",
    output_format: "Calculation result or 'Invalid Operator'.",
    sample_input: "+ 5 3",
    sample_output: "8\n",
    explanation: "5 + 3 = 8.",
    generator: () => {
      const testCases = [
        { input: "+ 5 3", output: "8\n" },
        { input: "- 10 4", output: "6\n" },
        { input: "* 6 7", output: "42\n" },
        { input: "/ 20 5", output: "4\n" },
        { input: "% 5 2", output: "Invalid Operator\n" },
        { input: "+ 0 0", output: "0\n" },
        { input: "- 5 10", output: "-5\n" },
        { input: "* 0 100", output: "0\n" },
        { input: "/ 7 3", output: "2\n" },
        { input: "/ -10 2", output: "-5\n" },
        { input: "+ 99 1", output: "100\n" },
        { input: "* -5 -5", output: "25\n" },
        { input: "$ 1 1", output: "Invalid Operator\n" }
      ];
      return testCases;
    }
  },
  {
    id: 17,
    title: "Day of Week",
    topic: "Switch Case",
    difficulty: "Easy",
    description: "Read an integer representing day number (1-7). Print corresponding day name starting with Monday. For invalid input, print 'Invalid Day'.",
    constraints: "1 <= N <= 7",
    input_format: "An integer.",
    output_format: "Day name (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday) or 'Invalid Day'.",
    sample_input: "1",
    sample_output: "Monday\n",
    explanation: "1 corresponds to Monday.",
    generator: () => {
      const days = ["Invalid Day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const inputs = [1, 2, 3, 4, 5, 6, 7, 0, 8, 10, -1, 5, 4];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${(n >= 1 && n <= 7) ? days[n] : "Invalid Day"}\n`
      }));
    }
  },
  {
    id: 18,
    title: "Vowel or Consonant",
    topic: "Switch Case",
    difficulty: "Easy",
    description: "Read a single alphabet character. Check if it is a vowel (a, e, i, o, u, case-insensitive). Print 'Vowel' or 'Consonant'. Ensure non-alphabetic inputs print 'Invalid'.",
    constraints: "Single character.",
    input_format: "A single character.",
    output_format: "'Vowel', 'Consonant', or 'Invalid'.",
    sample_input: "a",
    sample_output: "Vowel\n",
    explanation: "'a' is a vowel.",
    generator: () => {
      const testCases = [
        { input: "a", output: "Vowel\n" },
        { input: "E", output: "Vowel\n" },
        { input: "b", output: "Consonant\n" },
        { input: "Z", output: "Consonant\n" },
        { input: "1", output: "Invalid\n" },
        { input: "o", output: "Vowel\n" },
        { input: "u", output: "Vowel\n" },
        { input: "I", output: "Vowel\n" },
        { input: "t", output: "Consonant\n" },
        { input: "y", output: "Consonant\n" },
        { input: "#", output: "Invalid\n" },
        { input: "A", output: "Vowel\n" },
        { input: "x", output: "Consonant\n" }
      ];
      return testCases;
    }
  },
  // Topic 7: For Loop
  {
    id: 19,
    title: "Factorial of Number",
    topic: "For Loop",
    difficulty: "Easy",
    description: "Calculate and print the factorial of a given integer N.",
    constraints: "0 <= N <= 12",
    input_format: "A single integer N.",
    output_format: "The factorial of N.",
    sample_input: "5",
    sample_output: "120\n",
    explanation: "5! = 5 * 4 * 3 * 2 * 1 = 120.",
    generator: () => {
      const fact = (n) => n <= 1 ? 1 : n * fact(n - 1);
      const inputs = [5, 0, 1, 3, 4, 6, 7, 8, 9, 10, 11, 12, 2];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${fact(n)}\n`
      }));
    }
  },
  {
    id: 20,
    title: "Sum of Natural Numbers",
    topic: "For Loop",
    difficulty: "Easy",
    description: "Read an integer N, calculate the sum of first N natural numbers (1 to N) using a loop.",
    constraints: "1 <= N <= 10^5",
    input_format: "A single integer N.",
    output_format: "The sum of numbers from 1 to N.",
    sample_input: "5",
    sample_output: "15\n",
    explanation: "1 + 2 + 3 + 4 + 5 = 15.",
    generator: () => {
      const inputs = [5, 1, 10, 100, 1000, 50, 25, 12, 99, 4, 3, 200, 15];
      return inputs.map(n => {
        const sum = (n * (n + 1)) / 2;
        return {
          input: n.toString(),
          output: `${sum}\n`
        };
      });
    }
  },
  {
    id: 21,
    title: "Fibonacci Series",
    topic: "For Loop",
    difficulty: "Easy",
    description: "Print the first N terms of the Fibonacci series separated by spaces. The series starts with 0 and 1.",
    constraints: "1 <= N <= 30",
    input_format: "An integer N.",
    output_format: "Fibonacci terms separated by spaces.",
    sample_input: "5",
    sample_output: "0 1 1 2 3\n",
    explanation: "The first 5 terms are 0, 1, 1, 2, 3.",
    generator: () => {
      const getFib = (n) => {
        const arr = [0, 1];
        if (n === 1) return [0];
        for (let i = 2; i < n; i++) {
          arr.push(arr[i-1] + arr[i-2]);
        }
        return arr.slice(0, n).join(" ");
      };
      const inputs = [5, 1, 2, 3, 10, 15, 20, 25, 30, 4, 6, 7, 8];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${getFib(n)}\n`
      }));
    }
  },
  {
    id: 22,
    title: "Prime Checker",
    topic: "For Loop",
    difficulty: "Easy",
    description: "Check if a given positive integer N is prime. Print 'Prime' or 'Not Prime'.",
    constraints: "1 <= N <= 10^6",
    input_format: "An integer N.",
    output_format: "'Prime' or 'Not Prime'.",
    sample_input: "7",
    sample_output: "Prime\n",
    explanation: "7 is only divisible by 1 and 7, so it is prime.",
    generator: () => {
      const isPrime = (n) => {
        if (n <= 1) return false;
        for (let i = 2; i * i <= n; i++) {
          if (n % i === 0) return false;
        }
        return true;
      };
      const inputs = [7, 1, 2, 4, 15, 17, 97, 100, 100003, 19, 23, 29, 30];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${isPrime(n) ? "Prime" : "Not Prime"}\n`
      }));
    }
  },
  // Topic 8: While Loop
  {
    id: 23,
    title: "Reverse Integer",
    topic: "While Loop",
    difficulty: "Easy",
    description: "Reverse the digits of a given positive integer N using a while loop.",
    constraints: "0 <= N <= 10^9",
    input_format: "A single integer.",
    output_format: "The reversed integer (omit leading zeros if any).",
    sample_input: "1230",
    sample_output: "321\n",
    explanation: "Reversing 1230 yields 0321, which simplifies to 321.",
    generator: () => {
      const rev = (n) => parseInt(n.toString().split("").reverse().join(""), 10);
      const inputs = [1230, 0, 5, 100, 12345, 987654321, 5544, 12, 909, 888, 12000, 456, 123];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${rev(n)}\n`
      }));
    }
  },
  {
    id: 24,
    title: "Sum of Digits",
    topic: "While Loop",
    difficulty: "Easy",
    description: "Calculate and print the sum of digits of a given positive integer N.",
    constraints: "0 <= N <= 10^9",
    input_format: "An integer N.",
    output_format: "The sum of digits of N.",
    sample_input: "1234",
    sample_output: "10\n",
    explanation: "1 + 2 + 3 + 4 = 10.",
    generator: () => {
      const sumD = (n) => n.toString().split("").reduce((acc, curr) => acc + parseInt(curr, 10), 0);
      const inputs = [1234, 0, 9, 9999, 1000, 123456789, 55, 12, 45, 87, 101, 202, 303];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${sumD(n)}\n`
      }));
    }
  },
  {
    id: 25,
    title: "Palindrome Number",
    topic: "While Loop",
    difficulty: "Easy",
    description: "Check if a given positive integer N is a palindrome (reads same forward and backward). Print 'Palindrome' or 'Not Palindrome'.",
    constraints: "0 <= N <= 10^9",
    input_format: "An integer N.",
    output_format: "'Palindrome' or 'Not Palindrome'.",
    sample_input: "121",
    sample_output: "Palindrome\n",
    explanation: "121 reversed is 121, so it is a palindrome.",
    generator: () => {
      const isPal = (n) => n.toString() === n.toString().split("").reverse().join("");
      const inputs = [121, 123, 0, 5, 100, 99, 1221, 12321, 987654, 444, 454, 120, 11];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${isPal(n) ? "Palindrome" : "Not Palindrome"}\n`
      }));
    }
  },
  // Topic 9: Do While Loop
  {
    id: 26,
    title: "Count Digits",
    topic: "Do While Loop",
    difficulty: "Easy",
    description: "Count the number of digits in a given non-negative integer N using a do-while loop.",
    constraints: "0 <= N <= 2*10^9",
    input_format: "A single integer N.",
    output_format: "The count of digits.",
    sample_input: "0",
    sample_output: "1\n",
    explanation: "0 has exactly 1 digit.",
    generator: () => {
      const inputs = [0, 5, 123, 999999, 1000000000, 12, 4567, 88, 9, 10, 100, 1000, 12345];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${n.toString().length}\n`
      }));
    }
  },
  {
    id: 27,
    title: "Collatz Sequence Count",
    topic: "Do While Loop",
    difficulty: "Easy",
    description: "For a given positive integer N, apply Collatz conjecture: if odd, N = 3N+1; if even, N = N/2. Count the number of steps required to reach 1 (including the initial step if N=1, which is 0 steps).",
    constraints: "1 <= N <= 1000",
    input_format: "A single integer N.",
    output_format: "The number of steps to reach 1.",
    sample_input: "6",
    sample_output: "8\n",
    explanation: "6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1 (8 steps).",
    generator: () => {
      const collatz = (n) => {
        if (n === 1) return 0;
        let count = 0;
        let current = n;
        do {
          if (current % 2 === 0) {
            current = current / 2;
          } else {
            current = 3 * current + 1;
          }
          count++;
        } while (current !== 1);
        return count;
      };
      const inputs = [6, 1, 2, 3, 7, 12, 100, 27, 50, 10, 9, 8, 5];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${collatz(n)}\n`
      }));
    }
  },
  {
    id: 28,
    title: "Greatest Common Divisor",
    topic: "Do While Loop",
    difficulty: "Easy",
    description: "Calculate the GCD of two positive integers A and B.",
    constraints: "1 <= A, B <= 10^5",
    input_format: "Two space-separated integers A and B.",
    output_format: "GCD of A and B.",
    sample_input: "12 18",
    sample_output: "6\n",
    explanation: "Common factors of 12 and 18 are 1, 2, 3, 6. The largest is 6.",
    generator: () => {
      const gcd = (a, b) => {
        let temp;
        do {
          temp = a % b;
          a = b;
          b = temp;
        } while (b !== 0);
        return a;
      };
      const inputs = [
        [12, 18], [5, 7], [10, 10], [100, 25], [45, 75],
        [8, 12], [24, 36], [17, 51], [99, 9], [60, 48],
        [144, 60], [13, 29], [40, 60]
      ];
      return inputs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${gcd(a, b)}\n`
      }));
    }
  },
  // Topic 10: Patterns
  {
    id: 29,
    title: "Right Triangle Pattern",
    topic: "Patterns",
    difficulty: "Easy",
    description: "Read an integer N and print a right-angled triangle pattern of asterisks with N rows.",
    constraints: "1 <= N <= 20",
    input_format: "An integer N.",
    output_format: "Right triangle pattern where row i has i asterisks.",
    sample_input: "3",
    sample_output: "*\n**\n***\n",
    explanation: "Row 1: 1 star, Row 2: 2 stars, Row 3: 3 stars.",
    generator: () => {
      const getPat = (n) => {
        let s = "";
        for (let i = 1; i <= n; i++) {
          s += "*".repeat(i) + "\n";
        }
        return s;
      };
      const inputs = [3, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      return inputs.map(n => ({
        input: n.toString(),
        output: getPat(n)
      }));
    }
  },
  {
    id: 30,
    title: "Square Grid Pattern",
    topic: "Patterns",
    difficulty: "Easy",
    description: "Read an integer N and print an N x N grid of asterisks.",
    constraints: "1 <= N <= 20",
    input_format: "An integer N.",
    output_format: "N rows, each containing N asterisks.",
    sample_input: "3",
    sample_output: "***\n***\n***\n",
    explanation: "A 3x3 square of stars is printed.",
    generator: () => {
      const getPat = (n) => {
        let s = "";
        for (let i = 0; i < n; i++) {
          s += "*".repeat(n) + "\n";
        }
        return s;
      };
      const inputs = [3, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      return inputs.map(n => ({
        input: n.toString(),
        output: getPat(n)
      }));
    }
  },
  {
    id: 31,
    title: "Number Pyramid",
    topic: "Patterns",
    difficulty: "Easy",
    description: "Read an integer N and print N rows of a number pyramid pattern. Row i contains the digit i repeated i times.",
    constraints: "1 <= N <= 9",
    input_format: "An integer N.",
    output_format: "Number pyramid rows.",
    sample_input: "3",
    sample_output: "1\n22\n333\n",
    explanation: "Row 1: one '1', Row 2: two '2's, Row 3: three '3's.",
    generator: () => {
      const getPat = (n) => {
        let s = "";
        for (let i = 1; i <= n; i++) {
          s += i.toString().repeat(i) + "\n";
        }
        return s;
      };
      const inputs = [3, 1, 2, 4, 5, 6, 7, 8, 9, 5, 6, 7, 8];
      return inputs.map(n => ({
        input: n.toString(),
        output: getPat(n)
      }));
    }
  },
  // Topic 11: Arrays
  {
    id: 32,
    title: "Min Max in Array",
    topic: "Arrays",
    difficulty: "Easy",
    description: "Read an array of N elements and find the minimum and maximum elements in it. Print them separated by space.",
    constraints: "1 <= N <= 100, -10^5 <= Element <= 10^5",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "Minimum and maximum separated by space.",
    sample_input: "5\n10 2 34 5 1",
    sample_output: "1 34\n",
    explanation: "Min value is 1, Max value is 34.",
    generator: () => {
      const inputs = [
        "5\n10 2 34 5 1",
        "1\n10",
        "4\n-5 -2 -10 -1",
        "3\n0 0 0",
        "6\n1 2 3 4 5 6",
        "6\n6 5 4 3 2 1",
        "5\n100 -100 50 -50 0",
        "4\n99 99 99 99",
        "5\n12 45 89 23 11",
        "3\n7 8 9",
        "8\n2 3 5 7 11 13 17 19",
        "10\n1 2 3 4 5 6 7 8 9 10",
        "2\n9 3"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const arr = lines[1].split(" ").map(Number);
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return {
          input: inp,
          output: `${min} ${max}\n`
        };
      });
    }
  },
  {
    id: 33,
    title: "Reverse Array",
    topic: "Arrays",
    difficulty: "Easy",
    description: "Read an array of integers and print it reversed, separated by space.",
    constraints: "1 <= N <= 100",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "N space-separated integers in reversed order.",
    sample_input: "4\n1 2 3 4",
    sample_output: "4 3 2 1\n",
    explanation: "The input array [1, 2, 3, 4] reversed is [4, 3, 2, 1].",
    generator: () => {
      const inputs = [
        "4\n1 2 3 4",
        "1\n5",
        "3\n10 20 30",
        "5\n9 8 7 6 5",
        "2\n0 1",
        "6\n1 1 1 2 2 2",
        "5\n-1 -2 -3 -4 -5",
        "4\n9 9 9 9",
        "5\n12 23 34 45 56",
        "3\n7 8 9",
        "5\n100 200 300 400 500",
        "2\n12 34",
        "4\n4 3 2 1"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const arr = lines[1].split(" ").reverse();
        return {
          input: inp,
          output: `${arr.join(" ")}\n`
        };
      });
    }
  },
  {
    id: 34,
    title: "Sum of Array",
    topic: "Arrays",
    difficulty: "Easy",
    description: "Calculate the sum of all elements in a given array of size N.",
    constraints: "1 <= N <= 1000, -10^4 <= Element <= 10^4",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "The integer sum of elements.",
    sample_input: "5\n1 2 3 4 5",
    sample_output: "15\n",
    explanation: "1+2+3+4+5 = 15.",
    generator: () => {
      const inputs = [
        "5\n1 2 3 4 5",
        "1\n100",
        "4\n-10 -20 30 0",
        "3\n0 0 0",
        "6\n10 20 30 40 50 60",
        "2\n5 5",
        "5\n-1 -1 -1 -1 -1",
        "3\n9 9 9",
        "4\n12 12 12 12",
        "5\n5 10 15 20 25",
        "3\n7 8 9",
        "10\n1 1 1 1 1 1 1 1 1 1",
        "2\n99 1"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const sum = lines[1].split(" ").map(Number).reduce((acc, curr) => acc + curr, 0);
        return {
          input: inp,
          output: `${sum}\n`
        };
      });
    }
  },
  {
    id: 35,
    title: "Linear Search",
    topic: "Arrays",
    difficulty: "Easy",
    description: "Search for a key integer in an array of size N. Print the 0-indexed index of the first occurrence. If not found, print -1.",
    constraints: "1 <= N <= 100. Key is an integer.",
    input_format: "First line contains N and Key separated by space. Second line contains N space-separated integers.",
    output_format: "Index of first occurrence or -1.",
    sample_input: "5 30\n10 20 30 40 30",
    sample_output: "2\n",
    explanation: "30 first appears at index 2.",
    generator: () => {
      const inputs = [
        "5 30\n10 20 30 40 30",
        "3 100\n1 2 3",
        "1 5\n5",
        "4 2\n2 2 2 2",
        "5 -1\n0 1 -1 3 -1",
        "3 9\n7 8 9",
        "5 0\n1 2 3 4 5",
        "2 12\n12 34",
        "3 34\n12 34 56",
        "4 5\n5 6 7 8",
        "5 8\n1 2 3 8 9",
        "2 9\n99 9",
        "3 1\n1 2 3"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const [n, key] = lines[0].split(" ").map(Number);
        const arr = lines[1].split(" ").map(Number);
        const idx = arr.indexOf(key);
        return {
          input: inp,
          output: `${idx}\n`
        };
      });
    }
  },
  // Topic 12: Strings
  {
    id: 36,
    title: "String Length",
    topic: "Strings",
    difficulty: "Easy",
    description: "Read a single word string and print its length (number of characters).",
    constraints: "1 <= string length <= 100",
    input_format: "A single string word.",
    output_format: "An integer representing the length.",
    sample_input: "hello",
    sample_output: "5\n",
    explanation: "'hello' contains 5 characters.",
    generator: () => {
      const words = ["hello", "a", "programming", "javascript", "c", "python", "java", "assessment", "platform", "online", "exam", "student", "faculty"];
      return words.map(w => ({
        input: w,
        output: `${w.length}\n`
      }));
    }
  },
  {
    id: 37,
    title: "Reverse String",
    topic: "Strings",
    difficulty: "Easy",
    description: "Read a single word string and print it reversed.",
    constraints: "1 <= string length <= 100",
    input_format: "A single word.",
    output_format: "Reversed string.",
    sample_input: "world",
    sample_output: "dlrow\n",
    explanation: "Reversing 'world' yields 'dlrow'.",
    generator: () => {
      const words = ["world", "a", "racecar", "step", "reverse", "code", "run", "web", "react", "node", "sql", "git", "test"];
      return words.map(w => ({
        input: w,
        output: `${w.split("").reverse().join("")}\n`
      }));
    }
  },
  {
    id: 38,
    title: "Count Vowels and Consonants",
    topic: "Strings",
    difficulty: "Easy",
    description: "Read a lower-case alphabetical string and count the number of vowels and consonants in it. Print counts separated by space.",
    constraints: "1 <= string length <= 100, lower-case letters only.",
    input_format: "A string.",
    output_format: "Vowels count and consonants count separated by space.",
    sample_input: "education",
    sample_output: "5 4\n",
    explanation: "Vowels: e, u, a, i, o (5). Consonants: d, c, t, n (4).",
    generator: () => {
      const words = ["education", "abc", "xyz", "aeiou", "bcdf", "hello", "world", "programming", "assessment", "test", "vowel", "consonant", "school"];
      return words.map(w => {
        let v = 0, c = 0;
        for (const char of w) {
          if ("aeiou".includes(char)) v++;
          else c++;
        }
        return {
          input: w,
          output: `${v} ${c}\n`
        };
      });
    }
  },
  {
    id: 39,
    title: "Palindrome String",
    topic: "Strings",
    difficulty: "Easy",
    description: "Check if a given string (single word) is a palindrome. Print 'Yes' or 'No'.",
    constraints: "1 <= length <= 100, case-insensitive.",
    input_format: "A single string.",
    output_format: "'Yes' or 'No'.",
    sample_input: "Madam",
    sample_output: "Yes\n",
    explanation: "'Madam' read backward is 'madaM', case-insensitive it is a palindrome.",
    generator: () => {
      const words = ["Madam", "hello", "racecar", "Noon", "world", "abcba", "abccba", "ab", "a", "yes", "no", "Radar", "Level"];
      return words.map(w => {
        const lower = w.toLowerCase();
        const isPal = lower === lower.split("").reverse().join("");
        return {
          input: w,
          output: `${isPal ? "Yes" : "No"}\n`
        };
      });
    }
  },
  // Topic 13: Functions
  {
    id: 40,
    title: "Power Function",
    topic: "Functions",
    difficulty: "Easy",
    description: "Implement a function/program that calculates A raised to power B (A^B).",
    constraints: "1 <= A <= 20, 0 <= B <= 10",
    input_format: "Two integers A and B separated by space.",
    output_format: "A^B.",
    sample_input: "2 5",
    sample_output: "32\n",
    explanation: "2 * 2 * 2 * 2 * 2 = 32.",
    generator: () => {
      const inputs = [
        [2, 5], [5, 3], [10, 0], [10, 3], [3, 4],
        [1, 10], [9, 2], [7, 3], [15, 1], [4, 5],
        [6, 3], [12, 2], [2, 10]
      ];
      return inputs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${Math.pow(a, b)}\n`
      }));
    }
  },
  {
    id: 41,
    title: "Armstrong Number",
    topic: "Functions",
    difficulty: "Easy",
    description: "Check if an N-digit positive number is an Armstrong number (sum of digits raised to power N equals the number itself). Print 'Armstrong' or 'Not Armstrong'.",
    constraints: "1 <= Num <= 10^5",
    input_format: "A single integer Num.",
    output_format: "'Armstrong' or 'Not Armstrong'.",
    sample_input: "153",
    sample_output: "Armstrong\n",
    explanation: "153 has 3 digits. 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153.",
    generator: () => {
      const isArmstrong = (num) => {
        const digits = num.toString().split("").map(Number);
        const power = digits.length;
        const sum = digits.reduce((acc, curr) => acc + Math.pow(curr, power), 0);
        return sum === num;
      };
      const inputs = [153, 370, 371, 9474, 9475, 1, 9, 10, 100, 1634, 8208, 123, 407];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${isArmstrong(n) ? "Armstrong" : "Not Armstrong"}\n`
      }));
    }
  },
  {
    id: 42,
    title: "LCM of Two Numbers",
    topic: "Functions",
    difficulty: "Easy",
    description: "Calculate the Least Common Multiple (LCM) of two positive integers A and B.",
    constraints: "1 <= A, B <= 10^4",
    input_format: "Two space-separated integers.",
    output_format: "LCM of A and B.",
    sample_input: "12 15",
    sample_output: "60\n",
    explanation: "LCM of 12 and 15 is 60.",
    generator: () => {
      const gcd = (x, y) => (!y ? x : gcd(y, x % y));
      const lcm = (x, y) => (x * y) / gcd(x, y);
      const inputs = [
        [12, 15], [4, 6], [5, 7], [10, 20], [15, 20],
        [9, 12], [8, 14], [18, 24], [7, 11], [100, 25],
        [30, 45], [14, 35], [25, 30]
      ];
      return inputs.map(([a, b]) => ({
        input: `${a} ${b}`,
        output: `${lcm(a, b)}\n`
      }));
    }
  },
  // Topic 14: Recursion Basics
  {
    id: 43,
    title: "Recursive Factorial",
    topic: "Recursion Basics",
    difficulty: "Easy",
    description: "Calculate the factorial of a non-negative integer N recursively.",
    constraints: "0 <= N <= 12",
    input_format: "An integer N.",
    output_format: "Factorial of N.",
    sample_input: "4",
    sample_output: "24\n",
    explanation: "4! = 4 * 3 * 2 * 1 = 24.",
    generator: () => {
      const fact = (n) => n <= 1 ? 1 : n * fact(n - 1);
      const inputs = [4, 0, 1, 5, 6, 7, 8, 9, 10, 11, 12, 2, 3];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${fact(n)}\n`
      }));
    }
  },
  {
    id: 44,
    title: "Recursive Fibonacci Term",
    topic: "Recursion Basics",
    difficulty: "Easy",
    description: "Find the Nth Fibonacci term using recursion. (0-indexed, where term 0 is 0, term 1 is 1, term 2 is 1, etc.).",
    constraints: "0 <= N <= 25",
    input_format: "An integer N.",
    output_format: "Nth Fibonacci term.",
    sample_input: "6",
    sample_output: "8\n",
    explanation: "Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8. Term 6 is 8.",
    generator: () => {
      const fib = (n) => n <= 0 ? 0 : n === 1 ? 1 : fib(n - 1) + fib(n - 2);
      const inputs = [6, 0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 7, 8];
      return inputs.map(n => ({
        input: n.toString(),
        output: `${fib(n)}\n`
      }));
    }
  },
  {
    id: 45,
    title: "Recursive Array Sum",
    topic: "Recursion Basics",
    difficulty: "Easy",
    description: "Find the sum of all elements of an array of size N recursively.",
    constraints: "1 <= N <= 100",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "The sum of elements.",
    sample_input: "3\n5 10 15",
    sample_output: "30\n",
    explanation: "5 + 10 + 15 = 30.",
    generator: () => {
      const inputs = [
        "3\n5 10 15",
        "1\n10",
        "4\n1 2 3 4",
        "5\n-5 -5 -5 10 5",
        "2\n0 0",
        "6\n10 20 30 40 50 60",
        "5\n1 1 1 1 1",
        "3\n9 8 7",
        "4\n12 34 56 78",
        "5\n5 5 5 5 5",
        "3\n100 -50 20",
        "2\n99 1",
        "4\n10 20 30 40"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const sum = lines[1].split(" ").map(Number).reduce((acc, curr) => acc + curr, 0);
        return {
          input: inp,
          output: `${sum}\n`
        };
      });
    }
  },
  // Topic 15: Searching
  {
    id: 46,
    title: "Binary Search",
    topic: "Searching",
    difficulty: "Easy",
    description: "Search for a key integer in a sorted array of size N using binary search. Output 0-indexed index of occurrence, or -1 if not found.",
    constraints: "1 <= N <= 100. Array is sorted.",
    input_format: "First line contains N and Key separated by space. Second line contains N sorted space-separated integers.",
    output_format: "Index of key, or -1.",
    sample_input: "5 30\n10 20 30 40 50",
    sample_output: "2\n",
    explanation: "30 is at index 2.",
    generator: () => {
      const inputs = [
        "5 30\n10 20 30 40 50",
        "3 100\n10 20 30",
        "1 5\n5",
        "5 5\n1 2 3 4 5",
        "5 1\n1 2 3 4 5",
        "5 2\n1 2 3 4 5",
        "5 4\n1 2 3 4 5",
        "4 12\n10 12 14 16",
        "6 50\n10 20 30 40 50 60",
        "2 9\n9 99",
        "3 10\n10 20 30",
        "4 40\n10 20 30 40",
        "5 0\n-5 -2 0 3 6"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const [n, key] = lines[0].split(" ").map(Number);
        const arr = lines[1].split(" ").map(Number);
        const idx = arr.indexOf(key);
        return {
          input: inp,
          output: `${idx}\n`
        };
      });
    }
  },
  {
    id: 47,
    title: "Search 2D Array",
    topic: "Searching",
    difficulty: "Easy",
    description: "Given an R x C 2D array and a key integer, find if the key exists. Print 'Found' or 'Not Found'.",
    constraints: "1 <= R, C <= 10",
    input_format: "First line contains R, C and Key separated by spaces. Next R lines contain C integers each.",
    output_format: "'Found' or 'Not Found'.",
    sample_input: "2 3 5\n1 2 3\n4 5 6",
    sample_output: "Found\n",
    explanation: "5 is in the grid at row 1, col 1 (0-indexed).",
    generator: () => {
      const inputs = [
        "2 3 5\n1 2 3\n4 5 6",
        "2 2 10\n1 2\n3 4",
        "1 1 5\n5",
        "3 3 9\n1 2 3\n4 5 6\n7 8 9",
        "3 3 0\n1 2 3\n4 5 6\n7 8 9",
        "2 2 -1\n-1 0\n2 3",
        "1 3 2\n1 2 3",
        "3 1 4\n1\n2\n3",
        "2 3 12\n1 2 3\n4 5 6",
        "3 3 1\n1 1 1\n1 1 1\n1 1 1",
        "2 2 5\n1 2\n3 4",
        "3 2 6\n1 2\n3 4\n5 6",
        "2 4 8\n1 2 3 4\n5 6 7 8"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const [r, c, key] = lines[0].split(" ").map(Number);
        let found = false;
        for (let i = 1; i <= r; i++) {
          if (lines[i].split(" ").map(Number).includes(key)) {
            found = true;
            break;
          }
        }
        return {
          input: inp,
          output: `${found ? "Found" : "Not Found"}\n`
        };
      });
    }
  },
  // Topic 16: Sorting Basics
  {
    id: 48,
    title: "Bubble Sort",
    topic: "Sorting Basics",
    difficulty: "Easy",
    description: "Read an array of size N, sort the array in ascending order using Bubble Sort algorithm, and print it separated by space.",
    constraints: "1 <= N <= 100",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "N sorted space-separated integers.",
    sample_input: "5\n5 4 3 2 1",
    sample_output: "1 2 3 4 5\n",
    explanation: "[5, 4, 3, 2, 1] sorted is [1, 2, 3, 4, 5].",
    generator: () => {
      const inputs = [
        "5\n5 4 3 2 1",
        "1\n10",
        "3\n3 1 2",
        "6\n12 34 56 1 2 3",
        "5\n-1 -5 0 10 -2",
        "4\n9 9 9 9",
        "2\n20 10",
        "5\n1 2 3 4 5",
        "6\n6 5 4 3 2 1",
        "3\n7 8 9",
        "5\n100 23 89 45 12",
        "4\n4 2 1 3",
        "3\n50 20 40"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const arr = lines[1].split(" ").map(Number).sort((a, b) => a - b);
        return {
          input: inp,
          output: `${arr.join(" ")}\n`
        };
      });
    }
  },
  {
    id: 49,
    title: "Selection Sort",
    topic: "Sorting Basics",
    difficulty: "Easy",
    description: "Read an array of size N, sort it using Selection Sort in ascending order, and print elements separated by space.",
    constraints: "1 <= N <= 100",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "Sorted integers separated by space.",
    sample_input: "4\n40 10 30 20",
    sample_output: "10 20 30 40\n",
    explanation: "[40, 10, 30, 20] sorted is [10, 20, 30, 40].",
    generator: () => {
      const inputs = [
        "4\n40 10 30 20",
        "1\n99",
        "3\n10 5 15",
        "5\n2 1 5 4 3",
        "5\n-1 -2 -3 -4 -5",
        "6\n100 500 200 400 300 0",
        "2\n5 1",
        "5\n1 2 3 4 5",
        "4\n9 9 9 9",
        "3\n12 11 10",
        "5\n45 67 23 89 12",
        "3\n7 8 9",
        "5\n10 20 15 5 25"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const arr = lines[1].split(" ").map(Number).sort((a, b) => a - b);
        return {
          input: inp,
          output: `${arr.join(" ")}\n`
        };
      });
    }
  },
  {
    id: 50,
    title: "Insertion Sort",
    topic: "Sorting Basics",
    difficulty: "Easy",
    description: "Read an array of size N, sort it using Insertion Sort in ascending order, and print elements separated by space.",
    constraints: "1 <= N <= 100",
    input_format: "First line contains N. Second line contains N space-separated integers.",
    output_format: "Sorted integers separated by space.",
    sample_input: "5\n12 11 13 5 6",
    sample_output: "5 6 11 12 13\n",
    explanation: "[12, 11, 13, 5, 6] sorted is [5, 6, 11, 12, 13].",
    generator: () => {
      const inputs = [
        "5\n12 11 13 5 6",
        "1\n1",
        "4\n9 5 1 3",
        "3\n0 -5 5",
        "5\n100 50 10 5 1",
        "6\n1 1 2 2 3 3",
        "2\n9 2",
        "5\n1 2 3 4 5",
        "4\n9 9 9 9",
        "3\n10 20 30",
        "5\n23 12 56 34 89",
        "3\n7 8 9",
        "5\n5 4 3 2 1"
      ];
      return inputs.map(inp => {
        const lines = inp.split("\n");
        const arr = lines[1].split(" ").map(Number).sort((a, b) => a - b);
        return {
          input: inp,
          output: `${arr.join(" ")}\n`
        };
      });
    }
  }
];

// Helper function to build question list with test cases
function getQuestions() {
  return questions.map(q => {
    const allCases = q.generator();
    const visible = allCases.slice(0, 3);
    const hidden = allCases.slice(3, 13);
    return {
      id: q.id,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      description: q.description,
      constraints: q.constraints,
      input_format: q.input_format,
      output_format: q.output_format,
      sample_input: q.sample_input,
      sample_output: q.sample_output,
      explanation: q.explanation,
      visible_test_cases: visible,
      hidden_test_cases: hidden,
      language_support: ["C", "Java", "Python"]
    };
  });
}

module.exports = {
  getQuestions
};
