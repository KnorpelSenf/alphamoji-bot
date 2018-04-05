var obj = require('./sample_emoji');
console.log(JSON.stringify(obj));
console.log(Object.keys(obj));
var key = "0023-20e3"; // Object.keys(obj)[0];
console.log(key);
var value = obj[key];
console.log(value);
