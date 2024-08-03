prime_num = 200000

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

def find_first_num_primes():
    primes = []
    num = 2
    while len(primes) < prime_num:
        if is_prime(num):
            primes.append(num)
        num += 1
    return primes

result = find_first_num_primes()
print(f"The {prime_num}th prime number is: {result[-1]}")