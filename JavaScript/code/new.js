// new 关键字实现通过一个构造函数或者类实例化一个对象
// 1. 创建一个Object对象
// 2. 建立原型链接
// 3. 绑定this执行构造函数
// 4. 返回值新对象

function _new(constructor, ...args) {
  const obj = {};
  obj.__proto__ = constructor.prototype;
  // 或
  // const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  return result instanceof Object ? result : obj; // 构造函数返回值扩机
}

console.log(
  _new(function () {
    this.attr = "value";
  })
);
