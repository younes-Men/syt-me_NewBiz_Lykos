
const existingCodes = [
  "10.71D", "45.31Z", "45.40Z", "46.12A", "46.12B", "46.15Z", "46.19A", "46.22Z", "46.31Z", "46.32A", "46.32C", "46.33Z", "46.38A", "46.39A", "46.43Z", "46.44Z", "46.47Z", "46.49Z", "46.51Z", "46.52Z", "46.65Z", "46.66Z", "46.69A", "46.69B", "46.69C", "46.72Z", "46.73A", "46.73B", "46.74A", "46.74B", "46.75Z", "46.76Z", "46.90Z", "47.11A", "47.23Z", "47.52A", "47.52B", "47.59B", "47.72A", "47.76Z", "47.78C", "47.81Z", "47.89Z", "47.91B", "47.99B", "77.29Z", "96.09Z"
];

const userInput = `
8129A
6910Z
3700Z/ 3812Z/ 8122Z
6910Z
1013B/ 4722Z/ 4781Z/ 5621Z
1071C
1013B/ 4722Z/ 4781Z/ 5621Z
4617A/ 4617B/ 4638B/ 4639B/ 4711B/ 4711C/ 4711D/ 4711F/ 4725Z
1812Z, 1813Z, 1814Z, 5819Z
9529Z, 9601A, 9601B
5510Z, 5610A, 5610B, 5621Z, 5630Z, 9311Z
4531Z, 4540Z, 4622Z, 4631Z, 4632A, 4632C, 4633Z. 4639A. 4643Z, 4644Z, 4645Z, 4647Z, 4648Z, 4649Z, 4651Z, 4652Z, 4665Z, 4666Z, 4669A, 4669B, 4669C, 4673A, 4673B, 4674B, 4675Z, 4676Z, 4690Z, 4711A,4799B
"4612A, 4612B, 4615Z, 4619A, 4644Z, 4647Z, 4649Z. 4669B. 4669C, 4672Z, 4673B. 4674A, 4674B, 4752A,
4752B, 4759B, 7729Z"
1610A, 1610B, 1622Z, 1623Z, 1624Z, 1629Z, 3230Z, 3291Z, 3299Z, 3319Z, 4332A, 4391A, 4647Z, 4649Z, 4673A,4753Z, 9529Z
4751Z/ 4753Z/ 4759B/ 4771Z
4772A
`;

// Extract all 5-character NAF codes (e.g., 8129A)
const regex = /\b\d{4}[A-Z]\b/g;
const newCodesRaw = userInput.match(regex) || [];

// Format with dot: 8129A -> 81.29A
const formatCode = (code) => code.substring(0, 2) + "." + code.substring(2);

const formattedNewCodes = newCodesRaw.map(formatCode);

// Merge and deduplicate
const allCodes = Array.from(new Set([...existingCodes, ...formattedNewCodes])).sort();

console.log(JSON.stringify(allCodes, null, 2));
