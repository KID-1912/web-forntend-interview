// 手写call、apply、bind方法
// 这3个方法都可以实现调用某个方法时指定其内部this指向值，并支持为被调用方法预设参数
Function.prototype.myCall = function (context) {
  if (context === undefined || context === null) {
    context = globalThis;
  }
  if (typeof context !== "object") {
    context = Object(context);
  }
  const symbol = Symbol();
  context[symbol] = this;
  const args = [...arguments].slice(1);
  const result = context[symbol](...args);
  delete context[symbol];
  return result; // 注意返回获取的函数运行结果
};

const fn = function (prefix = "", suffix = "") {
  for (key of Object.keys(this)) {
    console.log(`${prefix}${key}${suffix}`);
  }
};

fn.myCall({ name: "mike", sex: "man" }, "key: ", " is valid");
console.log("=============================");
// Test: 未指定this指向值
fn.myCall();
console.log("=============================");
// Test: 指定this指向值为一个非对象类型
fn.myCall("a string");