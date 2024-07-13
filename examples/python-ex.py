def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

def find_first_400000_primes():
    primes = []
    num = 2
    while len(primes) < 400000:
        if is_prime(num):
            primes.append(num)
        num += 1
    return primes

print("Finding the first 400000 prime numbers...")
result = find_first_400000_primes()
print(f"The first 400000 prime numbers are: {result[:100]}")
print(f"The 400000th prime number is: {result[-1]}")