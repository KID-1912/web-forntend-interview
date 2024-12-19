// const add = (...rest) => {
//   // 第一次执行时，定义一个数组专门用来存储所有的参数
//   const _rest = rest;
//   // 在内部声明一个函数，利用闭包的特性保存_rest并收集所有的参数值
//   const _add = (...rest) => {
//     _rest.push(...rest);
//     return _add;
//   };
//   // 利用toString隐式转换的特性，当最后执行时隐式转换，并计算最终的值返回
//   _add.toString = () => _rest.reduce((t, v) => t + v);
//   return _add;
// };

function add() {
  const sum = [...arguments].reduce((v, t) => v + t, 0);

  const newAdd = add.bind(null, sum); // 柯里化，新函数都基于当前求和数
  newAdd.toString = () => sum; //
  return newAdd; // 1. 返回可调用的新函数
}

console.log(`${add(1, 3)(2)(6)}`);
