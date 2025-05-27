import math

def normal_pdf_verbose(x, mu, sigma):
    print("\n--- Normal Distribution PDF Calculation Steps ---")
    print("STEP 1: Start")
    print(f"STEP 2: Input x = {x}, mean (mu) = {mu}, standard deviation (sigma) = {sigma}")
    z = (x - mu) / sigma
    print(f"STEP 3: Compute z = (x - mu) / sigma = ({x} - {mu}) / {sigma} = {z}")
    pdf = (1 / (sigma * math.sqrt(2 * math.pi))) * math.exp(-0.5 * z**2)
    print("STEP 4: Apply PDF formula:")
    print("        PDF(x) = (1/(sigma * sqrt(2*pi))) * exp(-0.5 * z^2)")
    print(f"        PDF({x}) = (1/({sigma} * sqrt(2*pi))) * exp(-0.5 * {z}^2) = {pdf}")
    print("STEP 5: Print result above")
    print("STEP 6: Stop\n")
    return pdf

def poisson_pmf_verbose(lmbda, k):
    print("\n--- Poisson Distribution PMF Calculation Steps ---")
    print("STEP 1: Start")
    print(f"STEP 2: Input mean number of events (lambda) = {lmbda}, number of occurrences (k) = {k}")
    exp_neg_lambda = math.exp(-lmbda)
    print(f"STEP 3: Compute e^(-lambda) = exp(-{lmbda}) = {exp_neg_lambda}")
    k_factorial = math.factorial(k)
    print(f"STEP 4: Compute k! = {k}! = {k_factorial}")
    probability = (lmbda ** k) * exp_neg_lambda / k_factorial
    print("STEP 5: Apply Poisson formula:")
    print("        P(X = k) = (lambda^k * e^(-lambda)) / k!")
    print(f"        P(X = {k}) = ({lmbda}^{k} * {exp_neg_lambda}) / {k_factorial} = {probability}")
    print("STEP 6: Print result above")
    print("STEP 7: Stop\n")
    return probability

def binomial_pmf_verbose(n, k, p):
    print("\n--- Binomial Distribution PMF Calculation Steps ---")
    print("STEP 1: Start")
    print(f"STEP 2: Input number of trials (n) = {n}, number of successes (k) = {k}, probability of success (p) = {p}")
    q = 1 - p
    print(f"        Probability of failure (q) = 1 - p = 1 - {p} = {q}")
    nCk = math.comb(n, k)
    print(f"STEP 3: Compute nCk (number of combinations) = C({n}, {k}) = {nCk}")
    probability = nCk * (p ** k) * (q ** (n - k))
    print("        Apply Binomial PMF formula:")
    print("        P(X = k) = nCk * p^k * q^(n-k)")
    print(f"        P(X = {k}) = {nCk} * {p}^{k} * {q}^{n-k} = {probability}")
    print("STEP 4: Print result above")
    print("STEP 5: Stop\n")
    return probability

if __name__ == "__main__":
    # Normal Distribution
    print("Normal Distribution PDF Calculation:")
    x = float(input("Enter value (x): "))
    mu = float(input("Enter mean (mu): "))
    sigma = float(input("Enter standard deviation (sigma): "))
    result_normal = normal_pdf_verbose(x, mu, sigma)
    print(f"Result: Normal Distribution PDF at x = {x} is {result_normal}\n")

    # Poisson Distribution
    print("Poisson Distribution PMF Calculation:")
    lmbda = float(input("Enter mean number of events (lambda): "))
    k_poi = int(input("Enter number of occurrences (k): "))
    result_poisson = poisson_pmf_verbose(lmbda, k_poi)
    print(f"Result: Poisson Distribution PMF for k = {k_poi}, lambda = {lmbda} is {result_poisson}\n")

    # Binomial Distribution
    print("Binomial Distribution PMF Calculation:")
    n = int(input("Enter number of trials (n): "))
    k_bin = int(input("Enter number of successes (k): "))
    p = float(input("Enter probability of success (p): "))
    result_binomial = binomial_pmf_verbose(n, k_bin, p)
    print(f"Result: Binomial Distribution PMF for n = {n}, k = {k_bin}, p = {p} is {result_binomial}\n")