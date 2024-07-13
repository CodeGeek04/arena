function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function findFirst400000Primes() {
  const primes = [];
  let num = 2;
  while (primes.length < 400000) {
    if (isPrime(num)) {
      primes.push(num);
    }
    num++;
  }
  return primes;
}

console.log("Finding the first 400000 prime numbers...");
const result = findFirst400000Primes();
console.log(`The first 400000 prime numbers are:`);
console.log(`The 400000th prime number is: ${result[result.length - 1]}`);
