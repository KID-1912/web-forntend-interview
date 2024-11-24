function typeOf(value) {
  if (value instanceof Object || value === null) return "object";
  const typeString = Object.prototype.toString.call(value);
  const match = typeString.match(/^\[object (\w+)\]$/);
  return match ? match[1].toLowerCase() : null;
}

console.log(typeOf([]));
console.log(typeOf(undefined));
console.log(typeOf("str"));
