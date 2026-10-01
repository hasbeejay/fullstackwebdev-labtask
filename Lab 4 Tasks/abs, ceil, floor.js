function abs(...numbers) {
    if (numbers.length === 0) {
        return 0;
    }

    let results = numbers.map(function(number) {
        return Math.abs(number);
    });

    return numbers.length === 1 ? results[0] : results;
}

function ceil(...numbers) {
    if (numbers.length === 0) {
        return 0;
    }

    let results = numbers.map(function(number) {
        return Math.ceil(number);
    });

    return numbers.length === 1 ? results[0] : results;
}

function floor(...numbers) {
    if (numbers.length === 0) {
        return 0;
    }

    let results = numbers.map(function(number) {
        return Math.floor(number);
    });

    return numbers.length === 1 ? results[0] : results;
}

console.log("ABS:");
console.log(abs());
console.log(abs(-4.7));
console.log(abs(-4.7, 4.4));

console.log("CEIL:");
console.log(ceil());
console.log(ceil(4.2));
console.log(ceil(4.2, 4.8));

console.log("FLOOR:");
console.log(floor());
console.log(floor(4.8));
console.log(floor(4.8, 4.2));