/* ============================================================
   CalcHub — Calculator Database
   Each entry: id, name, category, icon, description, inputs[], compute(values)
   compute() returns an array of {label, value, unit} result rows
   ============================================================ */

const CATEGORIES = [
  { id: "finance", name: "Finance", icon: "💰" },
  { id: "student", name: "Student", icon: "🎓" },
  { id: "health", name: "Health", icon: "❤️" },
  { id: "math", name: "Mathematics", icon: "➗" },
  { id: "engineering", name: "Engineering", icon: "⚙️" },
  { id: "programming", name: "Programming", icon: "💻" },
  { id: "converter", name: "Unit Conversion", icon: "🔄" },
  { id: "time", name: "Time & Date", icon: "⏰" },
  { id: "business", name: "Business", icon: "📊" },
  { id: "utility", name: "Everyday Utilities", icon: "🧰" }
];

function num(v, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function fmt(n, decimals = 2) {
  if (!isFinite(n)) return "—";
  return Number(n.toFixed(decimals)).toLocaleString(undefined, {
    maximumFractionDigits: decimals
  });
}

/* Conversion factor tables (base unit = 1) */
const LENGTH_UNITS = { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mile: 1609.344 };
const WEIGHT_UNITS = { mg: 0.000001, g: 0.001, kg: 1, ton: 1000, oz: 0.0283495, lb: 0.453592, stone: 6.35029 };
const AREA_UNITS = { "m²": 1, "km²": 1e6, "cm²": 0.0001, "ft²": 0.092903, "yd²": 0.836127, acre: 4046.86, hectare: 10000 };
const VOLUME_UNITS = { ml: 0.001, l: 1, "m³": 1000, gallon: 3.78541, quart: 0.946353, pint: 0.473176, cup: 0.24, "ft³": 28.3168 };
const STORAGE_UNITS = { bit: 1 / 8, byte: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
const SPEED_UNITS = { "m/s": 1, "km/h": 0.277778, mph: 0.44704, knot: 0.514444, "ft/s": 0.3048 };
const TIME_UNITS = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 };

function unitSelectOptions(table) {
  return Object.keys(table);
}

/* ============================================================
   CALCULATOR DEFINITIONS
   ============================================================ */
const CALCULATORS = [

/* ---------------- GENERAL / MATH ---------------- */
{
  id: "basic-calculator", name: "Basic Calculator", category: "math", icon: "🧮",
  description: "Add, subtract, multiply and divide two numbers instantly.",
  inputs: [
    { id: "a", label: "First number", type: "number", placeholder: "e.g. 24" },
    { id: "op", label: "Operation", type: "select", options: ["+", "-", "×", "÷"] },
    { id: "b", label: "Second number", type: "number", placeholder: "e.g. 8" }
  ],
  compute: (v) => {
    const a = num(v.a), b = num(v.b);
    let r;
    if (v.op === "+") r = a + b;
    else if (v.op === "-") r = a - b;
    else if (v.op === "×") r = a * b;
    else r = b === 0 ? NaN : a / b;
    return [{ label: "Result", value: isNaN(r) ? "Cannot divide by zero" : fmt(r, 6) }];
  }
},
{
  id: "scientific-calculator", name: "Scientific Calculator", category: "math", icon: "📐",
  description: "Evaluate expressions with trig, powers, roots and logarithms.",
  inputs: [
    { id: "expr", label: "Expression (e.g. sin(30)+sqrt(16)*2^3)", type: "text", placeholder: "sin(30)+sqrt(16)" }
  ],
  compute: (v) => {
    try {
      let expr = v.expr || "0";
      expr = expr.replace(/\^/g, "**")
        .replace(/sin\(/g, "Math.sin(Math.PI/180*")
        .replace(/cos\(/g, "Math.cos(Math.PI/180*")
        .replace(/tan\(/g, "Math.tan(Math.PI/180*")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/pi/g, "Math.PI")
        .replace(/[^-()\d/*+.,MathsincoatqrgPIE\s]/g, "");
      // eslint-disable-next-line no-new-func
      const r = Function('"use strict";return (' + expr + ")")();
      return [{ label: "Result", value: fmt(r, 6) }];
    } catch (e) {
      return [{ label: "Result", value: "Invalid expression" }];
    }
  }
},
{
  id: "percentage", name: "Percentage Calculator", category: "math", icon: "％",
  description: "Find what X% of Y is, instantly.",
  inputs: [
    { id: "pct", label: "Percentage (%)", type: "number", placeholder: "e.g. 20" },
    { id: "val", label: "Of value", type: "number", placeholder: "e.g. 150" }
  ],
  compute: (v) => {
    const r = (num(v.pct) / 100) * num(v.val);
    return [{ label: `${v.pct || 0}% of ${v.val || 0}`, value: fmt(r) }];
  }
},
{
  id: "average", name: "Average Calculator", category: "math", icon: "📊",
  description: "Calculate the mean of a list of numbers.",
  inputs: [{ id: "nums", label: "Numbers (comma separated)", type: "text", placeholder: "4, 8, 15, 16, 23" }],
  compute: (v) => {
    const arr = (v.nums || "").split(",").map(x => num(x)).filter(x => !isNaN(x));
    if (!arr.length) return [{ label: "Average", value: "—" }];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return [
      { label: "Average", value: fmt(avg) },
      { label: "Sum", value: fmt(arr.reduce((a, b) => a + b, 0)) },
      { label: "Count", value: arr.length }
    ];
  }
},
{
  id: "ratio", name: "Ratio Calculator", category: "math", icon: "⚖️",
  description: "Simplify a ratio to its lowest terms.",
  inputs: [
    { id: "a", label: "Value A", type: "number", placeholder: "e.g. 12" },
    { id: "b", label: "Value B", type: "number", placeholder: "e.g. 18" }
  ],
  compute: (v) => {
    const a = Math.round(num(v.a)), b = Math.round(num(v.b));
    const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
    const g = gcd(Math.abs(a), Math.abs(b)) || 1;
    return [{ label: "Simplified ratio", value: `${a / g} : ${b / g}` }];
  }
},
{
  id: "quadratic-equation", name: "Quadratic Equation Solver", category: "math", icon: "📈",
  description: "Solve ax² + bx + c = 0 for real or complex roots.",
  inputs: [
    { id: "a", label: "a", type: "number", placeholder: "1" },
    { id: "b", label: "b", type: "number", placeholder: "-3" },
    { id: "c", label: "c", type: "number", placeholder: "2" }
  ],
  compute: (v) => {
    const a = num(v.a), b = num(v.b), c = num(v.c);
    if (a === 0) return [{ label: "Note", value: "Not quadratic (a=0)" }];
    const d = b * b - 4 * a * c;
    if (d > 0) {
      const x1 = (-b + Math.sqrt(d)) / (2 * a), x2 = (-b - Math.sqrt(d)) / (2 * a);
      return [{ label: "x₁", value: fmt(x1) }, { label: "x₂", value: fmt(x2) }];
    } else if (d === 0) {
      return [{ label: "x", value: fmt(-b / (2 * a)) }];
    } else {
      const re = -b / (2 * a), im = Math.sqrt(-d) / (2 * a);
      return [{ label: "x₁", value: `${fmt(re)} + ${fmt(im)}i` }, { label: "x₂", value: `${fmt(re)} - ${fmt(im)}i` }];
    }
  }
},
{
  id: "lcm-hcf", name: "LCM & HCF Calculator", category: "math", icon: "🔢",
  description: "Find the LCM and HCF (GCD) of two numbers.",
  inputs: [
    { id: "a", label: "Number A", type: "number", placeholder: "12" },
    { id: "b", label: "Number B", type: "number", placeholder: "18" }
  ],
  compute: (v) => {
    const a = Math.round(num(v.a)), b = Math.round(num(v.b));
    const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
    const g = gcd(Math.abs(a), Math.abs(b)) || 1;
    const l = Math.abs(a * b) / g;
    return [{ label: "HCF / GCD", value: g }, { label: "LCM", value: l }];
  }
},
{
  id: "factorial", name: "Factorial Calculator", category: "math", icon: "❗",
  description: "Compute n! for a non-negative integer.",
  inputs: [{ id: "n", label: "n", type: "number", placeholder: "6" }],
  compute: (v) => {
    let n = Math.round(num(v.n));
    if (n < 0 || n > 170) return [{ label: "Result", value: "Enter 0–170" }];
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return [{ label: `${n}!`, value: fmt(r, 0) }];
  }
},
{
  id: "prime-checker", name: "Prime Number Checker", category: "math", icon: "🔍",
  description: "Check whether a number is prime.",
  inputs: [{ id: "n", label: "Number", type: "number", placeholder: "97" }],
  compute: (v) => {
    let n = Math.round(num(v.n));
    if (n < 2) return [{ label: "Result", value: "Not prime" }];
    let isPrime = true;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) { isPrime = false; break; }
    return [{ label: "Result", value: isPrime ? "Prime ✅" : "Not prime ❌" }];
  }
},
{
  id: "fibonacci", name: "Fibonacci Sequence Generator", category: "math", icon: "🌀",
  description: "Generate the first N Fibonacci numbers.",
  inputs: [{ id: "n", label: "How many terms", type: "number", placeholder: "10" }],
  compute: (v) => {
    let n = Math.max(1, Math.min(50, Math.round(num(v.n, 10))));
    const seq = [0, 1];
    while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    return [{ label: "Sequence", value: seq.slice(0, n).join(", ") }];
  }
},
{
  id: "standard-deviation", name: "Standard Deviation Calculator", category: "math", icon: "📉",
  description: "Calculate mean, variance and standard deviation of a data set.",
  inputs: [{ id: "nums", label: "Numbers (comma separated)", type: "text", placeholder: "4, 8, 15, 16, 23, 42" }],
  compute: (v) => {
    const arr = (v.nums || "").split(",").map(x => num(x)).filter(x => !isNaN(x));
    if (arr.length < 2) return [{ label: "Result", value: "Enter at least 2 numbers" }];
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    return [
      { label: "Mean", value: fmt(mean) },
      { label: "Variance", value: fmt(variance) },
      { label: "Std. Deviation", value: fmt(Math.sqrt(variance)) }
    ];
  }
},
{
  id: "permutation-combination", name: "Permutation & Combination Calculator", category: "math", icon: "🔀",
  description: "Calculate nPr and nCr.",
  inputs: [
    { id: "n", label: "n", type: "number", placeholder: "10" },
    { id: "r", label: "r", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const n = Math.round(num(v.n)), r = Math.round(num(v.r));
    if (r > n || n < 0 || r < 0) return [{ label: "Result", value: "Invalid: need n ≥ r ≥ 0" }];
    const fact = (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
    const nPr = fact(n) / fact(n - r);
    const nCr = nPr / fact(r);
    return [{ label: "nPr (permutations)", value: fmt(nPr, 0) }, { label: "nCr (combinations)", value: fmt(nCr, 0) }];
  }
},
{
  id: "log-calculator", name: "Logarithm Calculator", category: "math", icon: "📏",
  description: "Compute log base b of x.",
  inputs: [
    { id: "x", label: "x", type: "number", placeholder: "1000" },
    { id: "base", label: "Base", type: "number", placeholder: "10" }
  ],
  compute: (v) => {
    const x = num(v.x), b = num(v.base, 10);
    if (x <= 0 || b <= 0 || b === 1) return [{ label: "Result", value: "Invalid input" }];
    return [{ label: `log base ${b} of ${x}`, value: fmt(Math.log(x) / Math.log(b), 6) }];
  }
},
{
  id: "root-calculator", name: "Nth Root Calculator", category: "math", icon: "√",
  description: "Find the nth root of a number.",
  inputs: [
    { id: "x", label: "Number", type: "number", placeholder: "27" },
    { id: "n", label: "Root (n)", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const x = num(v.x), n = num(v.n, 2);
    const r = x < 0 && n % 2 === 1 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n);
    return [{ label: `${n}th root of ${x}`, value: fmt(r, 6) }];
  }
},
{
  id: "matrix-2x2-determinant", name: "2×2 Matrix Determinant", category: "math", icon: "🔲",
  description: "Compute the determinant of a 2×2 matrix.",
  inputs: [
    { id: "a", label: "a (row1,col1)", type: "number", placeholder: "1" },
    { id: "b", label: "b (row1,col2)", type: "number", placeholder: "2" },
    { id: "c", label: "c (row2,col1)", type: "number", placeholder: "3" },
    { id: "d", label: "d (row2,col2)", type: "number", placeholder: "4" }
  ],
  compute: (v) => {
    const det = num(v.a) * num(v.d) - num(v.b) * num(v.c);
    return [{ label: "Determinant", value: fmt(det) }];
  }
},

/* ---------------- STUDENT ---------------- */
{
  id: "cgpa", name: "CGPA Calculator", category: "student", icon: "🎓",
  description: "Convert total grade points across semesters into CGPA.",
  inputs: [{ id: "points", label: "Grade points per semester (comma separated, out of 10)", type: "text", placeholder: "8.5, 9.0, 8.2" }],
  compute: (v) => {
    const arr = (v.points || "").split(",").map(x => num(x)).filter(x => !isNaN(x));
    if (!arr.length) return [{ label: "CGPA", value: "—" }];
    const cgpa = arr.reduce((a, b) => a + b, 0) / arr.length;
    return [{ label: "CGPA", value: fmt(cgpa) }, { label: "Equivalent %", value: fmt(cgpa * 9.5) }];
  }
},
{
  id: "gpa", name: "GPA Calculator", category: "student", icon: "🎓",
  description: "Calculate GPA from course grades and credit hours.",
  inputs: [
    { id: "grades", label: "Grade points (comma separated, out of 4.0)", type: "text", placeholder: "4, 3.7, 3.3, 4" },
    { id: "credits", label: "Credit hours (comma separated)", type: "text", placeholder: "3, 4, 3, 2" }
  ],
  compute: (v) => {
    const g = (v.grades || "").split(",").map(x => num(x));
    const c = (v.credits || "").split(",").map(x => num(x));
    if (!g.length || g.length !== c.length) return [{ label: "GPA", value: "Grades & credits count must match" }];
    let totalPoints = 0, totalCredits = 0;
    g.forEach((gr, i) => { totalPoints += gr * c[i]; totalCredits += c[i]; });
    return [{ label: "GPA", value: fmt(totalPoints / totalCredits) }, { label: "Total credits", value: totalCredits }];
  }
},
{
  id: "attendance", name: "Attendance Calculator", category: "student", icon: "📅",
  description: "Calculate attendance percentage and classes needed to reach a target.",
  inputs: [
    { id: "attended", label: "Classes attended", type: "number", placeholder: "42" },
    { id: "total", label: "Total classes held", type: "number", placeholder: "50" },
    { id: "target", label: "Target attendance %", type: "number", placeholder: "75" }
  ],
  compute: (v) => {
    const attended = num(v.attended), total = num(v.total), target = num(v.target, 75);
    if (total <= 0) return [{ label: "Result", value: "Enter total classes" }];
    const pct = (attended / total) * 100;
    let needed = 0;
    if (pct < target) {
      // (attended + x) / (total + x) = target/100
      needed = Math.ceil((target / 100 * total - attended) / (1 - target / 100));
    }
    const rows = [{ label: "Current attendance", value: fmt(pct) + "%" }];
    if (pct < target) rows.push({ label: `Classes needed to reach ${target}%`, value: needed });
    else rows.push({ label: "Classes you can skip", value: Math.floor((attended - (target / 100) * total) / (target / 100)) });
    return rows;
  }
},
{
  id: "marks-percentage", name: "Marks Percentage Calculator", category: "student", icon: "📝",
  description: "Calculate percentage from marks obtained and total marks.",
  inputs: [
    { id: "obtained", label: "Marks obtained", type: "number", placeholder: "450" },
    { id: "total", label: "Total marks", type: "number", placeholder: "500" }
  ],
  compute: (v) => {
    const pct = (num(v.obtained) / num(v.total, 1)) * 100;
    return [{ label: "Percentage", value: fmt(pct) + "%" }];
  }
},
{
  id: "grade-calculator", name: "Grade Calculator", category: "student", icon: "🏅",
  description: "Convert a percentage score into a letter grade.",
  inputs: [{ id: "pct", label: "Percentage", type: "number", placeholder: "82" }],
  compute: (v) => {
    const p = num(v.pct);
    let grade = "F";
    if (p >= 90) grade = "A+";
    else if (p >= 80) grade = "A";
    else if (p >= 70) grade = "B";
    else if (p >= 60) grade = "C";
    else if (p >= 50) grade = "D";
    else if (p >= 40) grade = "E";
    return [{ label: "Grade", value: grade }];
  }
},
{
  id: "exam-score-needed", name: "Exam Score Needed Calculator", category: "student", icon: "🎯",
  description: "Find the score needed on your final exam to reach a target grade.",
  inputs: [
    { id: "current", label: "Current grade (%)", type: "number", placeholder: "78" },
    { id: "currentWeight", label: "Current work weight (%)", type: "number", placeholder: "70" },
    { id: "target", label: "Target final grade (%)", type: "number", placeholder: "85" }
  ],
  compute: (v) => {
    const current = num(v.current), cw = num(v.currentWeight) / 100, target = num(v.target);
    const finalWeight = 1 - cw;
    if (finalWeight <= 0) return [{ label: "Result", value: "Final weight must be > 0" }];
    const needed = (target - current * cw) / finalWeight;
    return [{ label: "Score needed on remaining work", value: fmt(needed) + "%" }];
  }
},
{
  id: "study-time", name: "Study Time Planner", category: "student", icon: "⏳",
  description: "Divide available study hours evenly across subjects.",
  inputs: [
    { id: "hours", label: "Total study hours available", type: "number", placeholder: "12" },
    { id: "subjects", label: "Number of subjects", type: "number", placeholder: "4" }
  ],
  compute: (v) => {
    const h = num(v.hours), s = num(v.subjects, 1);
    return [{ label: "Hours per subject", value: fmt(h / s) }];
  }
},
{
  id: "percentile", name: "Percentile Calculator", category: "student", icon: "📈",
  description: "Find your percentile rank among test takers.",
  inputs: [
    { id: "rank", label: "Your rank", type: "number", placeholder: "150" },
    { id: "total", label: "Total candidates", type: "number", placeholder: "10000" }
  ],
  compute: (v) => {
    const rank = num(v.rank), total = num(v.total, 1);
    const percentile = ((total - rank) / total) * 100;
    return [{ label: "Percentile", value: fmt(percentile) + "%" }];
  }
},
{
  id: "weighted-average", name: "Weighted Average Calculator", category: "student", icon: "⚖️",
  description: "Calculate a weighted average from values and their weights.",
  inputs: [
    { id: "values", label: "Values (comma separated)", type: "text", placeholder: "80, 90, 70" },
    { id: "weights", label: "Weights (comma separated)", type: "text", placeholder: "0.3, 0.5, 0.2" }
  ],
  compute: (v) => {
    const vals = (v.values || "").split(",").map(x => num(x));
    const w = (v.weights || "").split(",").map(x => num(x));
    if (vals.length !== w.length || !vals.length) return [{ label: "Result", value: "Values & weights count must match" }];
    const totalW = w.reduce((a, b) => a + b, 0);
    const wavg = vals.reduce((a, b, i) => a + b * w[i], 0) / totalW;
    return [{ label: "Weighted average", value: fmt(wavg) }];
  }
},
{
  id: "sgpa-to-percentage", name: "SGPA to Percentage Converter", category: "student", icon: "🔄",
  description: "Convert SGPA (out of 10) into an equivalent percentage.",
  inputs: [{ id: "sgpa", label: "SGPA", type: "number", placeholder: "8.7" }],
  compute: (v) => [{ label: "Equivalent Percentage", value: fmt(num(v.sgpa) * 9.5) + "%" }]
},

/* ---------------- FINANCE ---------------- */
{
  id: "emi", name: "EMI Calculator", category: "finance", icon: "🏦",
  description: "Calculate monthly EMI for a loan amount, interest rate and tenure.",
  inputs: [
    { id: "principal", label: "Loan amount", type: "number", placeholder: "500000" },
    { id: "rate", label: "Annual interest rate (%)", type: "number", placeholder: "9.5" },
    { id: "years", label: "Tenure (years)", type: "number", placeholder: "5" }
  ],
  compute: (v) => {
    const p = num(v.principal), annualRate = num(v.rate), n = num(v.years) * 12;
    const r = annualRate / 12 / 100;
    if (p <= 0 || n <= 0) return [{ label: "EMI", value: "Enter valid values" }];
    const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    return [
      { label: "Monthly EMI", value: fmt(emi) },
      { label: "Total payment", value: fmt(total) },
      { label: "Total interest", value: fmt(total - p) }
    ];
  }
},
{
  id: "loan", name: "Loan Calculator", category: "finance", icon: "💵",
  description: "See your full loan repayment breakdown.",
  inputs: [
    { id: "principal", label: "Loan amount", type: "number", placeholder: "20000" },
    { id: "rate", label: "Annual interest rate (%)", type: "number", placeholder: "7" },
    { id: "months", label: "Tenure (months)", type: "number", placeholder: "36" }
  ],
  compute: (v) => {
    const p = num(v.principal), r = num(v.rate) / 12 / 100, n = num(v.months);
    if (p <= 0 || n <= 0) return [{ label: "Result", value: "Enter valid values" }];
    const pay = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return [
      { label: "Monthly payment", value: fmt(pay) },
      { label: "Total repayment", value: fmt(pay * n) },
      { label: "Total interest", value: fmt(pay * n - p) }
    ];
  }
},
{
  id: "gst", name: "GST Calculator", category: "finance", icon: "🧾",
  description: "Add or remove GST from an amount.",
  inputs: [
    { id: "amount", label: "Amount", type: "number", placeholder: "1000" },
    { id: "rate", label: "GST rate (%)", type: "number", placeholder: "18" },
    { id: "mode", label: "Mode", type: "select", options: ["Add GST", "Remove GST"] }
  ],
  compute: (v) => {
    const a = num(v.amount), r = num(v.rate);
    if (v.mode === "Add GST") {
      const gstAmt = a * r / 100;
      return [{ label: "GST amount", value: fmt(gstAmt) }, { label: "Total (incl. GST)", value: fmt(a + gstAmt) }];
    } else {
      const base = a / (1 + r / 100);
      return [{ label: "Base amount", value: fmt(base) }, { label: "GST amount", value: fmt(a - base) }];
    }
  }
},
{
  id: "discount", name: "Discount Calculator", category: "finance", icon: "🏷️",
  description: "Calculate the final price after a percentage discount.",
  inputs: [
    { id: "price", label: "Original price", type: "number", placeholder: "1200" },
    { id: "discount", label: "Discount (%)", type: "number", placeholder: "25" }
  ],
  compute: (v) => {
    const p = num(v.price), d = num(v.discount);
    const saved = p * d / 100;
    return [{ label: "You save", value: fmt(saved) }, { label: "Final price", value: fmt(p - saved) }];
  }
},
{
  id: "profit-loss", name: "Profit / Loss Calculator", category: "finance", icon: "📉",
  description: "Calculate profit or loss and margin from cost and selling price.",
  inputs: [
    { id: "cost", label: "Cost price", type: "number", placeholder: "800" },
    { id: "sell", label: "Selling price", type: "number", placeholder: "950" }
  ],
  compute: (v) => {
    const c = num(v.cost), s = num(v.sell);
    const diff = s - c;
    const pct = c !== 0 ? (diff / c) * 100 : 0;
    return [
      { label: diff >= 0 ? "Profit" : "Loss", value: fmt(Math.abs(diff)) },
      { label: "Percentage", value: fmt(Math.abs(pct)) + "%" }
    ];
  }
},
{
  id: "sip", name: "SIP Calculator", category: "finance", icon: "📈",
  description: "Estimate the future value of a monthly SIP investment.",
  inputs: [
    { id: "monthly", label: "Monthly investment", type: "number", placeholder: "5000" },
    { id: "rate", label: "Expected annual return (%)", type: "number", placeholder: "12" },
    { id: "years", label: "Duration (years)", type: "number", placeholder: "10" }
  ],
  compute: (v) => {
    const m = num(v.monthly), annual = num(v.rate), n = num(v.years) * 12;
    const r = annual / 12 / 100;
    const fv = r === 0 ? m * n : m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = m * n;
    return [
      { label: "Future value", value: fmt(fv) },
      { label: "Total invested", value: fmt(invested) },
      { label: "Wealth gained", value: fmt(fv - invested) }
    ];
  }
},
{
  id: "simple-interest", name: "Simple Interest Calculator", category: "finance", icon: "💹",
  description: "Calculate simple interest and total amount.",
  inputs: [
    { id: "principal", label: "Principal", type: "number", placeholder: "10000" },
    { id: "rate", label: "Rate (% per year)", type: "number", placeholder: "6" },
    { id: "years", label: "Time (years)", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const p = num(v.principal), r = num(v.rate), t = num(v.years);
    const si = (p * r * t) / 100;
    return [{ label: "Simple interest", value: fmt(si) }, { label: "Total amount", value: fmt(p + si) }];
  }
},
{
  id: "compound-interest", name: "Compound Interest Calculator", category: "finance", icon: "📊",
  description: "Calculate compound interest with configurable compounding frequency.",
  inputs: [
    { id: "principal", label: "Principal", type: "number", placeholder: "10000" },
    { id: "rate", label: "Annual rate (%)", type: "number", placeholder: "8" },
    { id: "years", label: "Time (years)", type: "number", placeholder: "5" },
    { id: "n", label: "Compounds per year", type: "select", options: ["1", "2", "4", "12", "365"] }
  ],
  compute: (v) => {
    const p = num(v.principal), r = num(v.rate) / 100, t = num(v.years), n = num(v.n, 1);
    const a = p * Math.pow(1 + r / n, n * t);
    return [{ label: "Final amount", value: fmt(a) }, { label: "Interest earned", value: fmt(a - p) }];
  }
},
{
  id: "flat-vs-reducing-interest", name: "Flat vs Reducing Interest Calculator", category: "finance", icon: "⚖️",
  description: "Compare total interest under flat rate vs reducing balance methods.",
  inputs: [
    { id: "principal", label: "Loan amount", type: "number", placeholder: "100000" },
    { id: "rate", label: "Annual rate (%)", type: "number", placeholder: "10" },
    { id: "years", label: "Tenure (years)", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const p = num(v.principal), rate = num(v.rate), years = num(v.years);
    const flatInterest = (p * rate * years) / 100;
    const n = years * 12, r = rate / 12 / 100;
    const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const reducingInterest = emi * n - p;
    return [
      { label: "Flat-rate total interest", value: fmt(flatInterest) },
      { label: "Reducing-balance total interest", value: fmt(reducingInterest) }
    ];
  }
},
{
  id: "income-tax", name: "Income Tax Estimator (simplified slabs)", category: "finance", icon: "🧮",
  description: "Rough estimate of tax using common progressive slabs — for illustration only.",
  inputs: [{ id: "income", label: "Annual taxable income", type: "number", placeholder: "1200000" }],
  compute: (v) => {
    let income = num(v.income), tax = 0;
    const slabs = [[300000, 0], [300000, 0.05], [300000, 0.10], [300000, 0.15], [300000, 0.20], [Infinity, 0.30]];
    let remaining = income;
    for (const [size, rate] of slabs) {
      const taxable = Math.min(remaining, size);
      tax += taxable * rate;
      remaining -= taxable;
      if (remaining <= 0) break;
    }
    return [{ label: "Estimated tax", value: fmt(tax) }, { label: "Net income", value: fmt(income - tax) }];
  }
},
{
  id: "savings-goal", name: "Savings Goal Calculator", category: "finance", icon: "🎯",
  description: "Find the monthly saving needed to reach a target amount.",
  inputs: [
    { id: "goal", label: "Target amount", type: "number", placeholder: "100000" },
    { id: "months", label: "Time (months)", type: "number", placeholder: "24" },
    { id: "rate", label: "Annual interest rate (%)", type: "number", placeholder: "5" }
  ],
  compute: (v) => {
    const goal = num(v.goal), n = num(v.months), r = num(v.rate) / 12 / 100;
    const pmt = r === 0 ? goal / n : goal / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    return [{ label: "Monthly saving needed", value: fmt(pmt) }];
  }
},
{
  id: "break-even", name: "Break-Even Point Calculator", category: "finance", icon: "⚖️",
  description: "Find the number of units to sell to cover fixed costs.",
  inputs: [
    { id: "fixed", label: "Fixed costs", type: "number", placeholder: "50000" },
    { id: "price", label: "Selling price per unit", type: "number", placeholder: "500" },
    { id: "variable", label: "Variable cost per unit", type: "number", placeholder: "300" }
  ],
  compute: (v) => {
    const fixed = num(v.fixed), price = num(v.price), variable = num(v.variable);
    const margin = price - variable;
    if (margin <= 0) return [{ label: "Result", value: "Price must exceed variable cost" }];
    return [{ label: "Break-even units", value: fmt(fixed / margin, 0) }, { label: "Break-even revenue", value: fmt((fixed / margin) * price) }];
  }
},
{
  id: "markup", name: "Markup Calculator", category: "finance", icon: "🔺",
  description: "Calculate selling price from cost and desired markup %.",
  inputs: [
    { id: "cost", label: "Cost price", type: "number", placeholder: "200" },
    { id: "markup", label: "Markup (%)", type: "number", placeholder: "40" }
  ],
  compute: (v) => {
    const c = num(v.cost), m = num(v.markup);
    return [{ label: "Selling price", value: fmt(c * (1 + m / 100)) }, { label: "Markup amount", value: fmt(c * m / 100) }];
  }
},
{
  id: "tip", name: "Tip Calculator", category: "finance", icon: "🍽️",
  description: "Calculate tip amount and total bill.",
  inputs: [
    { id: "bill", label: "Bill amount", type: "number", placeholder: "80" },
    { id: "tipPct", label: "Tip (%)", type: "number", placeholder: "15" },
    { id: "people", label: "Split between (people)", type: "number", placeholder: "1" }
  ],
  compute: (v) => {
    const bill = num(v.bill), tipPct = num(v.tipPct), people = num(v.people, 1) || 1;
    const tip = bill * tipPct / 100;
    return [
      { label: "Tip amount", value: fmt(tip) },
      { label: "Total bill", value: fmt(bill + tip) },
      { label: "Per person", value: fmt((bill + tip) / people) }
    ];
  }
},
{
  id: "currency-converter", name: "Currency Converter", category: "finance", icon: "💱",
  description: "Convert between currencies using approximate reference rates (offline).",
  inputs: [
    { id: "amount", label: "Amount", type: "number", placeholder: "100" },
    { id: "from", label: "From", type: "select", options: ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"] },
    { id: "to", label: "To", type: "select", options: ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"] }
  ],
  compute: (v) => {
    const RATES_TO_USD = { USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012, JPY: 0.0064, AUD: 0.66, CAD: 0.73 };
    const amount = num(v.amount);
    const usd = amount * (RATES_TO_USD[v.from] || 1);
    const result = usd / (RATES_TO_USD[v.to] || 1);
    return [
      { label: `${v.from} → ${v.to}`, value: fmt(result) },
      { label: "Note", value: "Reference rates, not live market rates" }
    ];
  }
},
{
  id: "inflation", name: "Inflation Calculator", category: "finance", icon: "📉",
  description: "Estimate the future value of money after inflation.",
  inputs: [
    { id: "amount", label: "Current amount", type: "number", placeholder: "10000" },
    { id: "rate", label: "Annual inflation rate (%)", type: "number", placeholder: "6" },
    { id: "years", label: "Years", type: "number", placeholder: "10" }
  ],
  compute: (v) => {
    const a = num(v.amount), r = num(v.rate) / 100, y = num(v.years);
    return [{ label: "Future equivalent value needed", value: fmt(a * Math.pow(1 + r, y)) }];
  }
},
{
  id: "retirement-savings", name: "Retirement Savings Calculator", category: "finance", icon: "🏖️",
  description: "Estimate retirement corpus from monthly contributions.",
  inputs: [
    { id: "monthly", label: "Monthly contribution", type: "number", placeholder: "10000" },
    { id: "rate", label: "Expected annual return (%)", type: "number", placeholder: "10" },
    { id: "years", label: "Years to retirement", type: "number", placeholder: "25" }
  ],
  compute: (v) => {
    const m = num(v.monthly), r = num(v.rate) / 12 / 100, n = num(v.years) * 12;
    const fv = r === 0 ? m * n : m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    return [{ label: "Estimated retirement corpus", value: fmt(fv) }];
  }
},
{
  id: "car-loan", name: "Car Loan Calculator", category: "finance", icon: "🚗",
  description: "Calculate monthly payments for a car loan.",
  inputs: [
    { id: "price", label: "Car price", type: "number", placeholder: "25000" },
    { id: "downpayment", label: "Down payment", type: "number", placeholder: "5000" },
    { id: "rate", label: "Annual interest rate (%)", type: "number", placeholder: "6.5" },
    { id: "years", label: "Loan term (years)", type: "number", placeholder: "5" }
  ],
  compute: (v) => {
    const p = num(v.price) - num(v.downpayment), r = num(v.rate) / 12 / 100, n = num(v.years) * 12;
    if (p <= 0 || n <= 0) return [{ label: "Result", value: "Enter valid values" }];
    const pay = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return [{ label: "Monthly payment", value: fmt(pay) }, { label: "Total cost", value: fmt(pay * n + num(v.downpayment)) }];
  }
},
{
  id: "mortgage", name: "Mortgage Calculator", category: "finance", icon: "🏠",
  description: "Calculate monthly mortgage payments including principal and interest.",
  inputs: [
    { id: "price", label: "Home price", type: "number", placeholder: "300000" },
    { id: "downpayment", label: "Down payment", type: "number", placeholder: "60000" },
    { id: "rate", label: "Annual interest rate (%)", type: "number", placeholder: "6.5" },
    { id: "years", label: "Loan term (years)", type: "number", placeholder: "30" }
  ],
  compute: (v) => {
    const p = num(v.price) - num(v.downpayment), r = num(v.rate) / 12 / 100, n = num(v.years) * 12;
    if (p <= 0 || n <= 0) return [{ label: "Result", value: "Enter valid values" }];
    const pay = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return [
      { label: "Monthly payment (P&I)", value: fmt(pay) },
      { label: "Total interest over term", value: fmt(pay * n - p) }
    ];
  }
},
{
  id: "credit-card-interest", name: "Credit Card Interest Calculator", category: "finance", icon: "💳",
  description: "Estimate monthly interest charges on an outstanding credit card balance.",
  inputs: [
    { id: "balance", label: "Outstanding balance", type: "number", placeholder: "2000" },
    { id: "apr", label: "APR (%)", type: "number", placeholder: "24" }
  ],
  compute: (v) => {
    const balance = num(v.balance), apr = num(v.apr);
    const monthly = balance * (apr / 100 / 12);
    return [{ label: "Estimated monthly interest", value: fmt(monthly) }];
  }
},
{
  id: "salary-hike", name: "Salary Hike Calculator", category: "finance", icon: "📈",
  description: "Calculate new salary and hike percentage.",
  inputs: [
    { id: "current", label: "Current salary", type: "number", placeholder: "50000" },
    { id: "hikePct", label: "Hike (%)", type: "number", placeholder: "10" }
  ],
  compute: (v) => {
    const c = num(v.current), h = num(v.hikePct);
    return [{ label: "New salary", value: fmt(c * (1 + h / 100)) }, { label: "Increase amount", value: fmt(c * h / 100) }];
  }
},
{
  id: "cagr", name: "CAGR Calculator", category: "finance", icon: "📊",
  description: "Calculate Compound Annual Growth Rate between two values.",
  inputs: [
    { id: "initial", label: "Initial value", type: "number", placeholder: "10000" },
    { id: "final", label: "Final value", type: "number", placeholder: "25000" },
    { id: "years", label: "Years", type: "number", placeholder: "5" }
  ],
  compute: (v) => {
    const i = num(v.initial), f = num(v.final), y = num(v.years, 1);
    if (i <= 0 || y <= 0) return [{ label: "CAGR", value: "Enter valid values" }];
    const cagr = (Math.pow(f / i, 1 / y) - 1) * 100;
    return [{ label: "CAGR", value: fmt(cagr) + "%" }];
  }
},

/* ---------------- HEALTH ---------------- */
{
  id: "bmi", name: "BMI Calculator", category: "health", icon: "⚖️",
  description: "Calculate Body Mass Index from height and weight.",
  inputs: [
    { id: "weight", label: "Weight (kg)", type: "number", placeholder: "70" },
    { id: "height", label: "Height (cm)", type: "number", placeholder: "175" }
  ],
  compute: (v) => {
    const w = num(v.weight), h = num(v.height) / 100;
    if (h <= 0) return [{ label: "BMI", value: "Enter valid height" }];
    const bmi = w / (h * h);
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";
    return [{ label: "BMI", value: fmt(bmi) }, { label: "Category", value: category }];
  }
},
{
  id: "bmr", name: "BMR Calculator", category: "health", icon: "🔥",
  description: "Estimate Basal Metabolic Rate using the Mifflin-St Jeor formula.",
  inputs: [
    { id: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { id: "weight", label: "Weight (kg)", type: "number", placeholder: "70" },
    { id: "height", label: "Height (cm)", type: "number", placeholder: "175" },
    { id: "age", label: "Age", type: "number", placeholder: "28" }
  ],
  compute: (v) => {
    const w = num(v.weight), h = num(v.height), a = num(v.age);
    const bmr = v.gender === "Male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    return [{ label: "BMR", value: fmt(bmr) + " kcal/day" }];
  }
},
{
  id: "water-intake", name: "Water Intake Calculator", category: "health", icon: "💧",
  description: "Estimate daily recommended water intake based on body weight.",
  inputs: [
    { id: "weight", label: "Weight (kg)", type: "number", placeholder: "70" },
    { id: "activity", label: "Activity level", type: "select", options: ["Low", "Moderate", "High"] }
  ],
  compute: (v) => {
    const w = num(v.weight);
    let base = w * 0.033;
    if (v.activity === "Moderate") base += 0.35;
    if (v.activity === "High") base += 0.7;
    return [{ label: "Recommended daily water intake", value: fmt(base) + " L" }];
  }
},
{
  id: "calorie-needs", name: "Daily Calorie Needs Calculator", category: "health", icon: "🍎",
  description: "Estimate daily calorie needs using BMR and activity multiplier.",
  inputs: [
    { id: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { id: "weight", label: "Weight (kg)", type: "number", placeholder: "70" },
    { id: "height", label: "Height (cm)", type: "number", placeholder: "175" },
    { id: "age", label: "Age", type: "number", placeholder: "28" },
    { id: "activity", label: "Activity level", type: "select", options: ["Sedentary", "Light", "Moderate", "Active", "Very Active"] }
  ],
  compute: (v) => {
    const w = num(v.weight), h = num(v.height), a = num(v.age);
    const bmr = v.gender === "Male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const mult = { Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, "Very Active": 1.9 }[v.activity] || 1.2;
    return [{ label: "Estimated daily calories", value: fmt(bmr * mult) + " kcal" }];
  }
},
{
  id: "body-fat", name: "Body Fat Percentage Calculator", category: "health", icon: "📏",
  description: "Estimate body fat % using the U.S. Navy method.",
  inputs: [
    { id: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { id: "waist", label: "Waist (cm)", type: "number", placeholder: "85" },
    { id: "neck", label: "Neck (cm)", type: "number", placeholder: "38" },
    { id: "height", label: "Height (cm)", type: "number", placeholder: "175" },
    { id: "hip", label: "Hip (cm, women only)", type: "number", placeholder: "95" }
  ],
  compute: (v) => {
    const waist = num(v.waist), neck = num(v.neck), height = num(v.height), hip = num(v.hip);
    let bf;
    if (v.gender === "Male") {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
      bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }
    return [{ label: "Estimated body fat", value: fmt(bf) + "%" }];
  }
},
{
  id: "ideal-weight", name: "Ideal Weight Calculator", category: "health", icon: "🎯",
  description: "Estimate ideal body weight using the Devine formula.",
  inputs: [
    { id: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { id: "height", label: "Height (cm)", type: "number", placeholder: "175" }
  ],
  compute: (v) => {
    const h = num(v.height), inches = h / 2.54;
    const over5ft = Math.max(0, inches - 60);
    const ideal = v.gender === "Male" ? 50 + 2.3 * over5ft : 45.5 + 2.3 * over5ft;
    return [{ label: "Ideal weight", value: fmt(ideal) + " kg" }];
  }
},
{
  id: "pregnancy-due-date", name: "Pregnancy Due Date Calculator", category: "health", icon: "🤰",
  description: "Estimate due date from the first day of the last menstrual period.",
  inputs: [{ id: "lmp", label: "First day of last period", type: "date" }],
  compute: (v) => {
    if (!v.lmp) return [{ label: "Due date", value: "Select a date" }];
    const d = new Date(v.lmp);
    d.setDate(d.getDate() + 280);
    return [{ label: "Estimated due date", value: d.toDateString() }];
  }
},
{
  id: "heart-rate-zone", name: "Target Heart Rate Zone Calculator", category: "health", icon: "❤️‍🔥",
  description: "Calculate training heart rate zones based on age.",
  inputs: [{ id: "age", label: "Age", type: "number", placeholder: "30" }],
  compute: (v) => {
    const max = 220 - num(v.age);
    return [
      { label: "Max heart rate", value: fmt(max, 0) + " bpm" },
      { label: "Fat burn zone (50–69%)", value: `${fmt(max * 0.5, 0)}–${fmt(max * 0.69, 0)} bpm` },
      { label: "Cardio zone (70–85%)", value: `${fmt(max * 0.7, 0)}–${fmt(max * 0.85, 0)} bpm` }
    ];
  }
},
{
  id: "calories-burned", name: "Calories Burned Calculator", category: "health", icon: "🏃",
  description: "Estimate calories burned during an activity using MET values.",
  inputs: [
    { id: "activity", label: "Activity", type: "select", options: ["Walking (3.5 MET)", "Running (9.8 MET)", "Cycling (7.5 MET)", "Swimming (8 MET)", "Yoga (2.5 MET)"] },
    { id: "weight", label: "Weight (kg)", type: "number", placeholder: "70" },
    { id: "minutes", label: "Duration (minutes)", type: "number", placeholder: "30" }
  ],
  compute: (v) => {
    const met = parseFloat((v.activity || "").match(/[\d.]+/)?.[0] || "3.5");
    const kcal = (met * 3.5 * num(v.weight) / 200) * num(v.minutes);
    return [{ label: "Calories burned", value: fmt(kcal) + " kcal" }];
  }
},
{
  id: "macro-calculator", name: "Macro Nutrient Calculator", category: "health", icon: "🥗",
  description: "Split daily calories into protein, carb and fat grams.",
  inputs: [
    { id: "calories", label: "Daily calorie target", type: "number", placeholder: "2200" },
    { id: "proteinPct", label: "Protein %", type: "number", placeholder: "30" },
    { id: "carbPct", label: "Carb %", type: "number", placeholder: "40" },
    { id: "fatPct", label: "Fat %", type: "number", placeholder: "30" }
  ],
  compute: (v) => {
    const cal = num(v.calories);
    const protein = (cal * num(v.proteinPct) / 100) / 4;
    const carbs = (cal * num(v.carbPct) / 100) / 4;
    const fat = (cal * num(v.fatPct) / 100) / 9;
    return [
      { label: "Protein", value: fmt(protein) + " g" },
      { label: "Carbs", value: fmt(carbs) + " g" },
      { label: "Fat", value: fmt(fat) + " g" }
    ];
  }
},
{
  id: "sleep-calculator", name: "Sleep Cycle Calculator", category: "health", icon: "😴",
  description: "Find ideal bedtimes based on 90-minute sleep cycles.",
  inputs: [{ id: "wake", label: "Wake-up time", type: "time" }],
  compute: (v) => {
    if (!v.wake) return [{ label: "Result", value: "Select a wake time" }];
    const [h, m] = v.wake.split(":").map(Number);
    const wake = new Date(); wake.setHours(h, m, 0, 0);
    const cycles = [6, 5, 4];
    return cycles.map(c => {
      const bed = new Date(wake.getTime() - c * 90 * 60000);
      return { label: `${c} cycles (${c * 1.5}h sleep)`, value: bed.toTimeString().slice(0, 5) };
    });
  }
},

/* ---------------- TIME & DATE ---------------- */
{
  id: "age", name: "Age Calculator", category: "time", icon: "🎂",
  description: "Calculate exact age in years, months and days.",
  inputs: [{ id: "dob", label: "Date of birth", type: "date" }],
  compute: (v) => {
    if (!v.dob) return [{ label: "Age", value: "Select a date" }];
    const dob = new Date(v.dob), now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now - dob) / 86400000);
    return [
      { label: "Age", value: `${years} years, ${months} months, ${days} days` },
      { label: "Total days lived", value: fmt(totalDays, 0) }
    ];
  }
},
{
  id: "date-difference", name: "Date Difference Calculator", category: "time", icon: "📆",
  description: "Find the number of days, weeks and months between two dates.",
  inputs: [
    { id: "start", label: "Start date", type: "date" },
    { id: "end", label: "End date", type: "date" }
  ],
  compute: (v) => {
    if (!v.start || !v.end) return [{ label: "Result", value: "Select both dates" }];
    const days = Math.round((new Date(v.end) - new Date(v.start)) / 86400000);
    return [
      { label: "Total days", value: fmt(Math.abs(days), 0) },
      { label: "Weeks", value: fmt(Math.abs(days) / 7, 1) },
      { label: "Months (approx.)", value: fmt(Math.abs(days) / 30.44, 1) }
    ];
  }
},
{
  id: "time-duration", name: "Time Duration Calculator", category: "time", icon: "⏱️",
  description: "Calculate the duration between two times.",
  inputs: [
    { id: "start", label: "Start time", type: "time" },
    { id: "end", label: "End time", type: "time" }
  ],
  compute: (v) => {
    if (!v.start || !v.end) return [{ label: "Duration", value: "Select both times" }];
    const [sh, sm] = v.start.split(":").map(Number);
    const [eh, em] = v.end.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return [{ label: "Duration", value: `${Math.floor(mins / 60)}h ${mins % 60}m` }];
  }
},
{
  id: "day-of-week", name: "Day of the Week Finder", category: "time", icon: "📅",
  description: "Find which day of the week a given date falls on.",
  inputs: [{ id: "date", label: "Date", type: "date" }],
  compute: (v) => {
    if (!v.date) return [{ label: "Day", value: "Select a date" }];
    return [{ label: "Day of week", value: new Date(v.date).toLocaleDateString(undefined, { weekday: "long" }) }];
  }
},
{
  id: "countdown", name: "Countdown Calculator", category: "time", icon: "⏳",
  description: "Count down the days remaining until a future date.",
  inputs: [{ id: "target", label: "Target date", type: "date" }],
  compute: (v) => {
    if (!v.target) return [{ label: "Result", value: "Select a date" }];
    const days = Math.ceil((new Date(v.target) - new Date()) / 86400000);
    return [{ label: "Days remaining", value: days >= 0 ? fmt(days, 0) : "Date has passed" }];
  }
},
{
  id: "add-subtract-days", name: "Add/Subtract Days from Date", category: "time", icon: "➕",
  description: "Add or subtract a number of days from a given date.",
  inputs: [
    { id: "date", label: "Start date", type: "date" },
    { id: "days", label: "Days to add (negative to subtract)", type: "number", placeholder: "30" }
  ],
  compute: (v) => {
    if (!v.date) return [{ label: "Result", value: "Select a date" }];
    const d = new Date(v.date);
    d.setDate(d.getDate() + Math.round(num(v.days)));
    return [{ label: "Resulting date", value: d.toDateString() }];
  }
},
{
  id: "leap-year", name: "Leap Year Checker", category: "time", icon: "🐸",
  description: "Check whether a given year is a leap year.",
  inputs: [{ id: "year", label: "Year", type: "number", placeholder: "2028" }],
  compute: (v) => {
    const y = Math.round(num(v.year));
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return [{ label: "Result", value: isLeap ? `${y} is a leap year ✅` : `${y} is not a leap year ❌` }];
  }
},
{
  id: "age-in-days", name: "Age in Days/Hours/Minutes Calculator", category: "time", icon: "🕒",
  description: "Convert your age into total days, hours and minutes lived.",
  inputs: [{ id: "dob", label: "Date of birth", type: "date" }],
  compute: (v) => {
    if (!v.dob) return [{ label: "Result", value: "Select a date" }];
    const ms = new Date() - new Date(v.dob);
    return [
      { label: "Days", value: fmt(ms / 86400000, 0) },
      { label: "Hours", value: fmt(ms / 3600000, 0) },
      { label: "Minutes", value: fmt(ms / 60000, 0) }
    ];
  }
},
{
  id: "work-hours", name: "Work Hours Calculator", category: "time", icon: "🧑‍💼",
  description: "Calculate total work hours between clock-in and clock-out, minus break time.",
  inputs: [
    { id: "start", label: "Clock-in time", type: "time" },
    { id: "end", label: "Clock-out time", type: "time" },
    { id: "breakMins", label: "Break (minutes)", type: "number", placeholder: "30" }
  ],
  compute: (v) => {
    if (!v.start || !v.end) return [{ label: "Result", value: "Select both times" }];
    const [sh, sm] = v.start.split(":").map(Number);
    const [eh, em] = v.end.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm) - num(v.breakMins);
    if (mins < 0) mins += 24 * 60;
    return [{ label: "Total work time", value: `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m` }];
  }
},

/* ---------------- CONVERTERS ---------------- */
{
  id: "length-converter", name: "Length Converter", category: "converter", icon: "📏",
  description: "Convert between mm, cm, m, km, inches, feet, yards and miles.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "10" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(LENGTH_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(LENGTH_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * LENGTH_UNITS[v.from] / LENGTH_UNITS[v.to], 6) + " " + v.to }]
},
{
  id: "weight-converter", name: "Weight Converter", category: "converter", icon: "⚖️",
  description: "Convert between mg, g, kg, tonnes, ounces, pounds and stones.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "10" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(WEIGHT_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(WEIGHT_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * WEIGHT_UNITS[v.from] / WEIGHT_UNITS[v.to], 6) + " " + v.to }]
},
{
  id: "temperature-converter", name: "Temperature Converter", category: "converter", icon: "🌡️",
  description: "Convert between Celsius, Fahrenheit and Kelvin.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "25" },
    { id: "from", label: "From", type: "select", options: ["Celsius", "Fahrenheit", "Kelvin"] },
    { id: "to", label: "To", type: "select", options: ["Celsius", "Fahrenheit", "Kelvin"] }
  ],
  compute: (v) => {
    const x = num(v.value);
    let c;
    if (v.from === "Celsius") c = x;
    else if (v.from === "Fahrenheit") c = (x - 32) * 5 / 9;
    else c = x - 273.15;
    let r;
    if (v.to === "Celsius") r = c;
    else if (v.to === "Fahrenheit") r = c * 9 / 5 + 32;
    else r = c + 273.15;
    return [{ label: `${x} ${v.from} =`, value: fmt(r) + " " + v.to }];
  }
},
{
  id: "area-converter", name: "Area Converter", category: "converter", icon: "🔲",
  description: "Convert between m², km², cm², ft², yd², acres and hectares.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "500" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(AREA_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(AREA_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * AREA_UNITS[v.from] / AREA_UNITS[v.to], 6) + " " + v.to }]
},
{
  id: "volume-converter", name: "Volume Converter", category: "converter", icon: "🧴",
  description: "Convert between ml, l, m³, gallons, quarts, pints, cups and ft³.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "2" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(VOLUME_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(VOLUME_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * VOLUME_UNITS[v.from] / VOLUME_UNITS[v.to], 6) + " " + v.to }]
},
{
  id: "storage-converter", name: "Digital Storage Converter", category: "converter", icon: "💾",
  description: "Convert between bits, bytes, KB, MB, GB and TB.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "1024" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(STORAGE_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(STORAGE_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * STORAGE_UNITS[v.from] / STORAGE_UNITS[v.to], 6) + " " + v.to }]
},
{
  id: "speed-converter", name: "Speed Converter", category: "converter", icon: "🚀",
  description: "Convert between m/s, km/h, mph, knots and ft/s.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "100" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(SPEED_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(SPEED_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * SPEED_UNITS[v.from] / SPEED_UNITS[v.to], 6) + " " + v.to }]
},
{
  id: "time-unit-converter", name: "Time Unit Converter", category: "converter", icon: "⏲️",
  description: "Convert between seconds, minutes, hours, days, weeks, months and years.",
  inputs: [
    { id: "value", label: "Value", type: "number", placeholder: "3600" },
    { id: "from", label: "From", type: "select", options: unitSelectOptions(TIME_UNITS) },
    { id: "to", label: "To", type: "select", options: unitSelectOptions(TIME_UNITS) }
  ],
  compute: (v) => [{ label: `${v.value || 0} ${v.from} =`, value: fmt(num(v.value) * TIME_UNITS[v.from] / TIME_UNITS[v.to], 6) + " " + v.to }]
},

/* ---------------- PROGRAMMING ---------------- */
{
  id: "binary-decimal", name: "Binary to Decimal Converter", category: "programming", icon: "0️⃣",
  description: "Convert a binary number to decimal.",
  inputs: [{ id: "bin", label: "Binary number", type: "text", placeholder: "101101" }],
  compute: (v) => {
    const n = parseInt(v.bin || "0", 2);
    return [{ label: "Decimal", value: isNaN(n) ? "Invalid binary" : n }];
  }
},
{
  id: "decimal-binary", name: "Decimal to Binary Converter", category: "programming", icon: "1️⃣",
  description: "Convert a decimal number to binary.",
  inputs: [{ id: "dec", label: "Decimal number", type: "number", placeholder: "45" }],
  compute: (v) => [{ label: "Binary", value: (Math.round(num(v.dec)) >>> 0).toString(2) }]
},
{
  id: "hex-converter", name: "Hexadecimal Converter", category: "programming", icon: "🔡",
  description: "Convert between decimal and hexadecimal.",
  inputs: [
    { id: "value", label: "Value", type: "text", placeholder: "255 or FF" },
    { id: "mode", label: "Mode", type: "select", options: ["Decimal → Hex", "Hex → Decimal"] }
  ],
  compute: (v) => {
    if (v.mode === "Decimal → Hex") return [{ label: "Hexadecimal", value: (Math.round(num(v.value)) >>> 0).toString(16).toUpperCase() }];
    const n = parseInt(v.value || "0", 16);
    return [{ label: "Decimal", value: isNaN(n) ? "Invalid hex" : n }];
  }
},
{
  id: "ascii-converter", name: "ASCII / Text Converter", category: "programming", icon: "🔤",
  description: "Convert text to ASCII codes and back.",
  inputs: [{ id: "text", label: "Text", type: "text", placeholder: "Hi" }],
  compute: (v) => {
    const codes = (v.text || "").split("").map(c => c.charCodeAt(0)).join(" ");
    return [{ label: "ASCII codes", value: codes || "—" }];
  }
},
{
  id: "base64", name: "Base64 Encoder/Decoder", category: "programming", icon: "🔐",
  description: "Encode text to Base64 or decode Base64 back to text.",
  inputs: [
    { id: "text", label: "Text", type: "text", placeholder: "Hello World" },
    { id: "mode", label: "Mode", type: "select", options: ["Encode", "Decode"] }
  ],
  compute: (v) => {
    try {
      const result = v.mode === "Encode" ? btoa(v.text || "") : atob(v.text || "");
      return [{ label: v.mode === "Encode" ? "Encoded" : "Decoded", value: result }];
    } catch {
      return [{ label: "Result", value: "Invalid Base64 input" }];
    }
  }
},
{
  id: "uuid-generator", name: "UUID Generator", category: "programming", icon: "🆔",
  description: "Generate a random UUID (v4).",
  inputs: [],
  compute: () => {
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0, val = c === "x" ? r : (r & 0x3) | 0x8;
      return val.toString(16);
    });
    return [{ label: "UUID v4", value: uuid }];
  }
},
{
  id: "number-base-converter", name: "Number Base Converter", category: "programming", icon: "🔢",
  description: "Convert a number between any two bases (2–36).",
  inputs: [
    { id: "value", label: "Value", type: "text", placeholder: "255" },
    { id: "fromBase", label: "From base", type: "number", placeholder: "10" },
    { id: "toBase", label: "To base", type: "number", placeholder: "16" }
  ],
  compute: (v) => {
    const fromBase = Math.round(num(v.fromBase, 10)), toBase = Math.round(num(v.toBase, 2));
    const n = parseInt(v.value || "0", fromBase);
    if (isNaN(n)) return [{ label: "Result", value: "Invalid input for that base" }];
    return [{ label: `Base ${toBase}`, value: n.toString(toBase).toUpperCase() }];
  }
},
{
  id: "password-generator", name: "Password Generator", category: "programming", icon: "🔑",
  description: "Generate a strong random password.",
  inputs: [
    { id: "length", label: "Length", type: "number", placeholder: "16" },
    { id: "symbols", label: "Include symbols?", type: "select", options: ["Yes", "No"] }
  ],
  compute: (v) => {
    const len = Math.max(4, Math.min(64, Math.round(num(v.length, 16))));
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    if (v.symbols === "Yes") chars += "!@#$%^&*()-_=+[]{}";
    let pass = "";
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return [{ label: "Generated password", value: pass }];
  }
},

/* ---------------- ENGINEERING ---------------- */
{
  id: "ohms-law", name: "Ohm's Law Calculator", category: "engineering", icon: "🔌",
  description: "Calculate voltage, current or resistance using Ohm's Law (V=IR).",
  inputs: [
    { id: "v", label: "Voltage (V) — leave blank to solve", type: "number", placeholder: "" },
    { id: "i", label: "Current (A) — leave blank to solve", type: "number", placeholder: "" },
    { id: "r", label: "Resistance (Ω) — leave blank to solve", type: "number", placeholder: "" }
  ],
  compute: (v) => {
    const V = v.v === "" || v.v == null ? null : num(v.v);
    const I = v.i === "" || v.i == null ? null : num(v.i);
    const R = v.r === "" || v.r == null ? null : num(v.r);
    if (V === null && I !== null && R !== null) return [{ label: "Voltage", value: fmt(I * R) + " V" }];
    if (I === null && V !== null && R !== null) return [{ label: "Current", value: fmt(V / R) + " A" }];
    if (R === null && V !== null && I !== null) return [{ label: "Resistance", value: fmt(V / I) + " Ω" }];
    return [{ label: "Result", value: "Fill exactly two fields" }];
  }
},
{
  id: "voltage-divider", name: "Voltage Divider Calculator", category: "engineering", icon: "⚡",
  description: "Calculate output voltage of a resistor voltage divider.",
  inputs: [
    { id: "vin", label: "Input voltage (V)", type: "number", placeholder: "12" },
    { id: "r1", label: "R1 (Ω)", type: "number", placeholder: "1000" },
    { id: "r2", label: "R2 (Ω)", type: "number", placeholder: "2000" }
  ],
  compute: (v) => {
    const vin = num(v.vin), r1 = num(v.r1), r2 = num(v.r2);
    const vout = vin * (r2 / (r1 + r2));
    return [{ label: "Output voltage (Vout)", value: fmt(vout) + " V" }];
  }
},
{
  id: "power-calculator", name: "Electrical Power Calculator", category: "engineering", icon: "🔋",
  description: "Calculate electrical power using P = V × I.",
  inputs: [
    { id: "v", label: "Voltage (V)", type: "number", placeholder: "230" },
    { id: "i", label: "Current (A)", type: "number", placeholder: "2" }
  ],
  compute: (v) => [{ label: "Power", value: fmt(num(v.v) * num(v.i)) + " W" }]
},
{
  id: "area-of-shapes", name: "Area of Shapes Calculator", category: "engineering", icon: "🔺",
  description: "Calculate the area of common geometric shapes.",
  inputs: [
    { id: "shape", label: "Shape", type: "select", options: ["Circle", "Rectangle", "Triangle", "Square"] },
    { id: "a", label: "Dimension A (radius/length/base/side)", type: "number", placeholder: "5" },
    { id: "b", label: "Dimension B (width/height, if needed)", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const a = num(v.a), b = num(v.b);
    let area;
    if (v.shape === "Circle") area = Math.PI * a * a;
    else if (v.shape === "Rectangle") area = a * b;
    else if (v.shape === "Triangle") area = 0.5 * a * b;
    else area = a * a;
    return [{ label: "Area", value: fmt(area) + " sq units" }];
  }
},
{
  id: "volume-of-shapes", name: "Volume of Shapes Calculator", category: "engineering", icon: "🧊",
  description: "Calculate the volume of common 3D shapes.",
  inputs: [
    { id: "shape", label: "Shape", type: "select", options: ["Cube", "Sphere", "Cylinder", "Cone"] },
    { id: "a", label: "Dimension A (side/radius)", type: "number", placeholder: "4" },
    { id: "h", label: "Height (if applicable)", type: "number", placeholder: "10" }
  ],
  compute: (v) => {
    const a = num(v.a), h = num(v.h);
    let vol;
    if (v.shape === "Cube") vol = a ** 3;
    else if (v.shape === "Sphere") vol = (4 / 3) * Math.PI * a ** 3;
    else if (v.shape === "Cylinder") vol = Math.PI * a * a * h;
    else vol = (1 / 3) * Math.PI * a * a * h;
    return [{ label: "Volume", value: fmt(vol) + " cubic units" }];
  }
},
{
  id: "force-calculator", name: "Force Calculator (F=ma)", category: "engineering", icon: "🏋️",
  description: "Calculate force using Newton's second law.",
  inputs: [
    { id: "mass", label: "Mass (kg)", type: "number", placeholder: "10" },
    { id: "accel", label: "Acceleration (m/s²)", type: "number", placeholder: "9.8" }
  ],
  compute: (v) => [{ label: "Force", value: fmt(num(v.mass) * num(v.accel)) + " N" }]
},
{
  id: "density-calculator", name: "Density Calculator", category: "engineering", icon: "🧱",
  description: "Calculate density from mass and volume.",
  inputs: [
    { id: "mass", label: "Mass (kg)", type: "number", placeholder: "5" },
    { id: "volume", label: "Volume (m³)", type: "number", placeholder: "0.002" }
  ],
  compute: (v) => [{ label: "Density", value: fmt(num(v.mass) / num(v.volume, 1)) + " kg/m³" }]
},
{
  id: "pressure-calculator", name: "Pressure Calculator", category: "engineering", icon: "🌪️",
  description: "Calculate pressure from force and area (P = F/A).",
  inputs: [
    { id: "force", label: "Force (N)", type: "number", placeholder: "100" },
    { id: "area", label: "Area (m²)", type: "number", placeholder: "2" }
  ],
  compute: (v) => [{ label: "Pressure", value: fmt(num(v.force) / num(v.area, 1)) + " Pa" }]
},

/* ---------------- BUSINESS ---------------- */
{
  id: "roi", name: "ROI Calculator", category: "business", icon: "📈",
  description: "Calculate Return on Investment percentage.",
  inputs: [
    { id: "gain", label: "Final value of investment", type: "number", placeholder: "15000" },
    { id: "cost", label: "Cost of investment", type: "number", placeholder: "10000" }
  ],
  compute: (v) => {
    const gain = num(v.gain), cost = num(v.cost, 1);
    return [{ label: "ROI", value: fmt(((gain - cost) / cost) * 100) + "%" }];
  }
},
{
  id: "profit-margin", name: "Profit Margin Calculator", category: "business", icon: "💹",
  description: "Calculate gross profit margin percentage.",
  inputs: [
    { id: "revenue", label: "Revenue", type: "number", placeholder: "10000" },
    { id: "cost", label: "Cost of goods sold", type: "number", placeholder: "6500" }
  ],
  compute: (v) => {
    const rev = num(v.revenue, 1), cost = num(v.cost);
    return [{ label: "Gross profit", value: fmt(rev - cost) }, { label: "Margin", value: fmt(((rev - cost) / rev) * 100) + "%" }];
  }
},
{
  id: "salary-to-hourly", name: "Salary to Hourly Rate Converter", category: "business", icon: "💼",
  description: "Convert an annual salary into an equivalent hourly rate.",
  inputs: [
    { id: "salary", label: "Annual salary", type: "number", placeholder: "60000" },
    { id: "hoursPerWeek", label: "Hours per week", type: "number", placeholder: "40" }
  ],
  compute: (v) => {
    const hourly = num(v.salary) / (num(v.hoursPerWeek, 40) * 52);
    return [{ label: "Hourly rate", value: fmt(hourly) }];
  }
},
{
  id: "hourly-to-salary", name: "Hourly to Salary Converter", category: "business", icon: "🧑‍💻",
  description: "Convert an hourly rate into an equivalent annual salary.",
  inputs: [
    { id: "hourly", label: "Hourly rate", type: "number", placeholder: "25" },
    { id: "hoursPerWeek", label: "Hours per week", type: "number", placeholder: "40" }
  ],
  compute: (v) => [{ label: "Annual salary", value: fmt(num(v.hourly) * num(v.hoursPerWeek, 40) * 52) }]
},
{
  id: "discount-stacking", name: "Stacked Discount Calculator", category: "business", icon: "🏷️",
  description: "Calculate the final price after applying two sequential discounts.",
  inputs: [
    { id: "price", label: "Original price", type: "number", placeholder: "1000" },
    { id: "d1", label: "First discount (%)", type: "number", placeholder: "20" },
    { id: "d2", label: "Second discount (%)", type: "number", placeholder: "10" }
  ],
  compute: (v) => {
    const p = num(v.price);
    const afterFirst = p * (1 - num(v.d1) / 100);
    const afterSecond = afterFirst * (1 - num(v.d2) / 100);
    return [
      { label: "Final price", value: fmt(afterSecond) },
      { label: "Effective discount", value: fmt((1 - afterSecond / p) * 100) + "%" }
    ];
  }
},
{
  id: "vat", name: "VAT Calculator", category: "business", icon: "🧾",
  description: "Add or remove VAT from an amount.",
  inputs: [
    { id: "amount", label: "Amount", type: "number", placeholder: "1000" },
    { id: "rate", label: "VAT rate (%)", type: "number", placeholder: "20" },
    { id: "mode", label: "Mode", type: "select", options: ["Add VAT", "Remove VAT"] }
  ],
  compute: (v) => {
    const a = num(v.amount), r = num(v.rate);
    if (v.mode === "Add VAT") {
      const vat = a * r / 100;
      return [{ label: "VAT amount", value: fmt(vat) }, { label: "Total (incl. VAT)", value: fmt(a + vat) }];
    }
    const base = a / (1 + r / 100);
    return [{ label: "Base amount", value: fmt(base) }, { label: "VAT amount", value: fmt(a - base) }];
  }
},

/* ---------------- EVERYDAY UTILITIES ---------------- */
{
  id: "bill-split", name: "Bill Split Calculator", category: "utility", icon: "🧾",
  description: "Split a bill evenly among any number of people.",
  inputs: [
    { id: "total", label: "Total bill", type: "number", placeholder: "150" },
    { id: "people", label: "Number of people", type: "number", placeholder: "4" }
  ],
  compute: (v) => [{ label: "Each person pays", value: fmt(num(v.total) / num(v.people, 1)) }]
},
{
  id: "fuel-cost", name: "Fuel Cost Calculator", category: "utility", icon: "⛽",
  description: "Estimate trip fuel cost from distance, mileage and fuel price.",
  inputs: [
    { id: "distance", label: "Distance (km)", type: "number", placeholder: "300" },
    { id: "mileage", label: "Mileage (km per litre)", type: "number", placeholder: "15" },
    { id: "price", label: "Fuel price per litre", type: "number", placeholder: "100" }
  ],
  compute: (v) => {
    const litres = num(v.distance) / num(v.mileage, 1);
    return [{ label: "Fuel needed", value: fmt(litres) + " L" }, { label: "Estimated cost", value: fmt(litres * num(v.price)) }];
  }
},
{
  id: "paint-needed", name: "Paint Needed Calculator", category: "utility", icon: "🎨",
  description: "Estimate how much paint you need for a wall area.",
  inputs: [
    { id: "area", label: "Wall area (m²)", type: "number", placeholder: "40" },
    { id: "coverage", label: "Paint coverage (m² per litre)", type: "number", placeholder: "10" },
    { id: "coats", label: "Number of coats", type: "number", placeholder: "2" }
  ],
  compute: (v) => {
    const litres = (num(v.area) / num(v.coverage, 1)) * num(v.coats, 1);
    return [{ label: "Paint required", value: fmt(litres) + " L" }];
  }
},
{
  id: "electricity-bill", name: "Electricity Bill Calculator", category: "utility", icon: "💡",
  description: "Estimate electricity cost from appliance wattage and usage.",
  inputs: [
    { id: "watts", label: "Appliance power (Watts)", type: "number", placeholder: "1500" },
    { id: "hours", label: "Hours used per day", type: "number", placeholder: "3" },
    { id: "rate", label: "Cost per kWh", type: "number", placeholder: "8" }
  ],
  compute: (v) => {
    const kwhPerDay = (num(v.watts) * num(v.hours)) / 1000;
    return [
      { label: "Energy used per day", value: fmt(kwhPerDay) + " kWh" },
      { label: "Estimated monthly cost", value: fmt(kwhPerDay * 30 * num(v.rate)) }
    ];
  }
},
{
  id: "typing-speed", name: "Typing Speed (WPM) Calculator", category: "utility", icon: "⌨️",
  description: "Calculate words per minute from character count and time.",
  inputs: [
    { id: "words", label: "Words typed", type: "number", placeholder: "250" },
    { id: "minutes", label: "Time taken (minutes)", type: "number", placeholder: "5" },
    { id: "errors", label: "Errors", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const words = num(v.words), minutes = num(v.minutes, 1), errors = num(v.errors);
    const gross = words / minutes;
    const net = (words - errors) / minutes;
    return [{ label: "Gross WPM", value: fmt(gross) }, { label: "Net WPM", value: fmt(net) }];
  }
},
{
  id: "random-number-generator", name: "Random Number Generator", category: "utility", icon: "🎲",
  description: "Generate a random number within a range.",
  inputs: [
    { id: "min", label: "Minimum", type: "number", placeholder: "1" },
    { id: "max", label: "Maximum", type: "number", placeholder: "100" }
  ],
  compute: (v) => {
    const min = Math.round(num(v.min)), max = Math.round(num(v.max, 100));
    return [{ label: "Random number", value: Math.floor(Math.random() * (max - min + 1)) + min }];
  }
},
{
  id: "shoe-size-converter", name: "Shoe Size Converter", category: "utility", icon: "👟",
  description: "Convert shoe sizes between US, UK and EU standards (approximate).",
  inputs: [
    { id: "us", label: "US size (men's)", type: "number", placeholder: "9" }
  ],
  compute: (v) => {
    const us = num(v.us);
    return [
      { label: "UK size", value: fmt(us - 0.5, 1) },
      { label: "EU size", value: fmt(us + 33, 1) }
    ];
  }
},
{
  id: "bmi-child", name: "Tip Split Calculator", category: "utility", icon: "🍕",
  description: "Split a restaurant bill including tip between friends.",
  inputs: [
    { id: "bill", label: "Bill amount", type: "number", placeholder: "120" },
    { id: "tipPct", label: "Tip (%)", type: "number", placeholder: "18" },
    { id: "people", label: "Number of people", type: "number", placeholder: "3" }
  ],
  compute: (v) => {
    const bill = num(v.bill), tip = bill * num(v.tipPct) / 100, people = num(v.people, 1);
    return [{ label: "Total with tip", value: fmt(bill + tip) }, { label: "Per person", value: fmt((bill + tip) / people) }];
  }
},
{
  id: "unit-price", name: "Unit Price Comparison Calculator", category: "utility", icon: "🛒",
  description: "Compare the price-per-unit of two products to find the better deal.",
  inputs: [
    { id: "priceA", label: "Product A price", type: "number", placeholder: "5" },
    { id: "qtyA", label: "Product A quantity", type: "number", placeholder: "500" },
    { id: "priceB", label: "Product B price", type: "number", placeholder: "9" },
    { id: "qtyB", label: "Product B quantity", type: "number", placeholder: "1000" }
  ],
  compute: (v) => {
    const unitA = num(v.priceA) / num(v.qtyA, 1);
    const unitB = num(v.priceB) / num(v.qtyB, 1);
    return [
      { label: "Product A unit price", value: fmt(unitA, 4) },
      { label: "Product B unit price", value: fmt(unitB, 4) },
      { label: "Better deal", value: unitA < unitB ? "Product A" : "Product B" }
    ];
  }
},
{
  id: "bmi-pet", name: "Pet Age (Dog Years) Calculator", category: "utility", icon: "🐶",
  description: "Convert your dog's age into approximate human years.",
  inputs: [{ id: "age", label: "Dog's age (years)", type: "number", placeholder: "3" }],
  compute: (v) => {
    const age = num(v.age);
    let human;
    if (age <= 2) human = age * 12.5;
    else human = 25 + (age - 2) * 4;
    return [{ label: "Approximate human years", value: fmt(human, 0) }];
  }
}

];

/* Attach quick lookup helpers */
const CALC_BY_ID = Object.fromEntries(CALCULATORS.map(c => [c.id, c]));
function getCalculatorsByCategory(catId) {
  return CALCULATORS.filter(c => c.category === catId);
}
