Function.prototype.myBind = function (context) {
  if (context === undefined || context === null) {
    context = globalThis;
  }
  if (typeof context == "object") {
    context = Object(context);
  }
  const _this = this;
  const args = [...arguments].slice(1);
  return function () {
    const symbol = Symbol();
    context[symbol] = _this;
    const result = context[symbol](...args, ...arguments); // 拼接调用时arguments参数
    delete context[symbol];
    return result;
  };
};

const printObjectKey = function (prefix = "", suffix = "") {
  for (key of Object.keys(this)) {
    console.log(`${prefix}${key}${suffix}`);
  }
};

const mikeInfo = { name: "mike", sex: "man" };
// const printMikeInfoKey = printObjectKey.myBind(mikeInfo, "key: ", " is valid");

// Test: 调用时追加参数
// const printMikeInfoKey = printObjectKey.myBind(mikeInfo, "key: ");
// printMikeInfoKey(" is valid");
