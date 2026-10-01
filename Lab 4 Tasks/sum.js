function sumMultiples(x, y, z) {
    let sum = 0;

    for (let i = 1; i < z; i++) {
        if (i % x === 0 || i % y === 0) {
            sum += i;
        }
    }

    return sum;
}

let x = 3;
let y = 5;
let z = 10;

console.log("Sum of multiples: " + sumMultiples(x, y, z));