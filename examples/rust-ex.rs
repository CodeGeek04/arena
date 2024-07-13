fn is_prime(n: u32) -> bool {
    if n < 2 {
        return false;
    }
    let sqrt = (n as f64).sqrt() as u32;
    for i in 2..=sqrt {
        if n % i == 0 {
            return false;
        }
    }
    true
}

fn find_first_400000_primes() -> Vec<u32> {
    let mut primes = Vec::new();
    let mut num = 2;
    while primes.len() < 400000 {
        if is_prime(num) {
            primes.push(num);
        }
        num += 1;
    }
    primes
}

fn main() {
    println!("Finding the first 400000 prime numbers...");
    let result = find_first_400000_primes();
    println!("The first 400000 prime numbers are:");
    println!("The 400000th prime number is: {}", result.last().unwrap());
}