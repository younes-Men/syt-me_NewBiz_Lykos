const input = `
4772A
4776Z, 4778C, 4789Z, 4791B, 9609Z
1071D 
4638A, 4723Z, 4781Z
4531Z, 4540Z, 4622Z, 4631Z, 4632A, 4632C, 4633Z. 4639A. 4643Z, 4644Z, 4647Z, 4649Z, 4651Z, 4652Z, 4665Z, 4666Z, 4669A, 4669B, 4669C, 4673A, 4673B, 4674B, 4675Z, 4676Z, 4690Z, 4711A, 4799B
"4612A, 4612B, 4615Z, 4619A, 4644Z, 4647Z, 4649Z. 4669B. 4669C, 4672Z, 4673B. 4674A, 4674B, 4752A,
4752B, 4759B, 7729Z"
`;

// Extract anything that looks like a NAF code (5 characters: 4 digits + 1 letter)
const matches = input.match(/\b\d{4}[A-Z]\b/g);

console.log("Found matches:", matches.length);
console.log("Matches:", matches.join(", "));

const unique = Array.from(new Set(matches)).sort();
console.log("Unique count:", unique.length);
