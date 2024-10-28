// 构造函数（类型）的原型是否存在在对象的原型链上

function _instanceof(obj, Con) {
  if (obj === null || obj === undefined) return false;
  const primitiveTypes = ["string", "number", "boolean", "symbol", "bigint"];
  if (primitiveTypes.includes(typeof obj)) return false;
  if (obj.__proto__ === Con.prototype) return true;
  return _instanceof(obj.__proto__, Con);
}

const str = "";
console.log("------------------------------");
console.log(_instanceof([], Object));
console.log(_instanceof(str, String));
