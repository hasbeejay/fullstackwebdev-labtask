var name = "Haseeb Jalil";
var age = 23;
var is_student = true;
var university = "Air University";
var degree = "BS Computer Science";

var address = {
    house: 2,
    street: 1,
    sector: "E-11",
    city: "Islamabad"
};

var degreeProgram = {
    title: "BS Computer Science",
    semester: 5,
    section: "A"
};

var biography = {
    name: name,
    age: age,
    is_student: is_student,
    university: university,
    address: address,
    degreeProgram: degreeProgram
};

console.log("Biography");
console.log("Name: " + biography.name);
console.log("Age: " + biography.age);
console.log("Student: " + biography.is_student);
console.log("University: " + biography.university);

console.log("Address:");
console.log("House: " + biography.address.house);
console.log("Street: " + biography.address.street);
console.log("Block: " + biography.address.block);
console.log("City: " + biography.address.city);

console.log("Degree Program:");
console.log("Degree: " + biography.degreeProgram.title);
console.log("Semester: " + biography.degreeProgram.semester);
console.log("Section: " + biography.degreeProgram.section);