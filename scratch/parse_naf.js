const input = `
4772A
4776Z, 4778C, 4789Z, 4791B, 9609Z
1071D 
4638A, 4723Z, 4781Z
4531Z, 4540Z, 4622Z, 4631Z, 4632A, 4632C, 4633Z. 4639A. 4643Z, 4644Z, 4647Z, 4649Z, 4651Z, 4652Z, 4665Z, 4666Z, 4669A, 4669B, 4669C, 4673A, 4673B, 4674B, 4675Z, 4676Z, 4690Z, 4711A, 4799B
4612A, 4612B, 4615Z, 4619A, 4644Z, 4647Z, 4649Z. 4669B. 4669C, 4672Z, 4673B. 4674A, 4674B, 4752A, 4752B, 4759B, 7729Z
`;

const codes = input
    .replace(/[.\n]/g, ',') // replace dots and newlines with commas
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);

const formatted = codes.map(c => {
    if (c.length === 5) {
        return c.substring(0, 2) + '.' + c.substring(2);
    }
    return c;
});

const unique = Array.from(new Set(formatted)).sort();

console.log(JSON.stringify(unique, null, 2));
