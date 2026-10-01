let givenNumber = 11;
let number = givenNumber + 1;
let isPrime = false;

while (true) {
    isPrime = true;

    for (let i = 2; i <= Math.sqrt(number); i++) {
        if (number % i === 0) {
            isPrime = false;
            break;
        }
    }

    if (isPrime) {
        console.log("Given number: " + givenNumber);
        console.log("Next prime number: " + number);
        break;
    }

    number++;
}