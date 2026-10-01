function createPhoneNumber(numbers) {
    let areaCode = numbers.slice(0, 3).join("");
    let firstPart = numbers.slice(3, 6).join("");
    let secondPart = numbers.slice(6, 10).join("");

    return "(" + areaCode + ") " + firstPart + "-" + secondPart;
}

let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

console.log(createPhoneNumber(numbers));