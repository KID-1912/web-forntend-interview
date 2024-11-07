# 数据类型

## 基本数据类型

2 大类数据类型【基本（原始）数据类型】【引用（对象）数据类型】，基本类型存储的是值，一般存储在栈上；引用类型存储的是地址（指针），数据存储在堆上；

**原始数据类型**：

`string` `number` `boolean` `object` `undefined` `null` `symbol` `bigint`

## 类型判断

**typeof**

适用于判断基本数据类型，对于引用类型，除了函数判断出 "function"，其他对象都是 "object"，无法区分类型；

**instanceof**

原型链的方式来判断是否为构建函数的实例，另外可以通过构造函数判断 `[].constructor === Array`

**Object.prototype.toString.call**

能判断的类型最完整；`toString` 方法用于强制字符串转换，使用 `Object.toString` 转换为一个字符串类型

**isXxx API**

isNaN、isArray

## 类型转换

仅支持以下类型转换：

- 转换为布尔值
- 转换为数字
- 转换为字符串

# this 指向

# 闭包

定义：**假如一个函数能访问外部的变量，那么就形成了一个闭包，而不是一定要返回一个函数**。

## 深浅拷贝

**浅拷贝**：`Object.assign`、`...展开运算符`

**深拷贝**：`JSON.parse(JSON.stringify(obj))`，但存在循环引用，以及函数、Symbol、undefined 这些类型会被忽略

**手写深拷贝**

# ES6

## var、let 及 const

**声明提升**：这也是 let、const 不允许声明前就使用变量，会报错

**块级作用域**

## 原型继承/Class 继承

常见的继承方式：

**组合继承**

`Con.prototype = new SupType()` + `SupType.call(this)`

**寄生组合式**

```js
// Con.prototype = new SupType() 替换为
Child.prototype = Object.create(Parent.prototype, {
  constructor: {
    value: Child,
    enumerable: false,
    writable: true,
    configurable: true,
  },
});
```

**Class 继承**：`super` + `extends`

## 模块化

**立即执行函数**

**CommonJS**：本质是 require 时，对模块使用立即执行函数包装一层返回值

**ES Module**

# Proxy

`let p = new Proxy(target, handler)`

`target`  代表需要添加代理的对象，`handler`  用来自定义对象中的操作，比如可以用来自定义  `set`  或者  `get`  函数。

Vue3.0 要使用  `Proxy`  替换原本的 API 原因在于  `Proxy`  无需递归为每个属性添加代理，性能上更好；并且原本的实现有一些数据更新不能监听到（数组下标方式设置值），但是  `Proxy`  可以完美监听到任何方式的数据改变；

# Object、Map、WeakMap

Object 的  `key`  只能为  `string`  或者  `symbol`  类型；

Map 的  `key`  接受任意类型；

WeakMap 的  `key`  只能为  `object` 或者  `symbol`  类型；

# 异步编程

## 回调函数

回调函数存在两大问题：

1. 信任问题：我们将回调交给了第三方去调用，可能会出现意料之外的事情，比如说不能保证调用次数。
2. 可读性：多指回调地狱（Callback hell）

回调地狱的根本问题是：

1. 嵌套函数存在耦合性，一旦有所改动，就会牵一发而动全身
2. 嵌套函数一多，就很难处理错误

除此之外，回调函数还存在缺点：

- 不能使用  `try catch`  捕获错误
- 不能直接  `return`

## Generator

它最大的特点就是可以控制函数的执行；

```js
function* fetch() {
  yield ajax(url, () => {});
  yield ajax(url1, () => {});
  yield ajax(url2, () => {});
}
let it = fetch();
let result1 = it.next();
let result2 = it.next();
let result3 = it.next();
```

## Promise

**Promise** 三种状态：

1. 等待中（pending）
2. 完成了 （resolved）
3. 拒绝了（rejected）

**手写 promise**

**实现**：Promise 类、promise 状态、resolve、reject、then、catch、finally

**注意点**：

then 函数支持传入 2 个参数，分别为 `fulfilled/rejected` 时执行，支持链式调用，支持 Promise 完成后追加处理；

then 函数返回一个新 Promise，若传入的函数并没有返回值则将 undefined 作为下一个 Promise 的 data；

若传入的函数返回值是一个普通值（非 Promise），则将这个值作为下一个 Promise 的 data；

# Event Loop事件循环

## 线程与进程

线程，进程；本质上来说，都是 CPU **工作时间片**的一个描述；

进程描述了 CPU 在 **运行指令及加载和保存上下文所需的时间**

线程是进程中的更小单位，描述了执行一段指令所需的时间。

你打开一个 Tab 页时，其实就是创建了一个进程，一个进程中可以有多个线程，比如渲染线程、JS 引擎线程、HTTP 请求线程等等。当你发起一个请求时，其实就是创建了一个线程，当请求结束后，该线程可能就会被销毁。

## 执行栈与任务队列

**执行栈**：一个遵循先进后出的存储函数调用的结构

**任务队列**：通过任务队列实现任务的异步执行；

不同的任务源会被分配到不同的 Task 队列中，任务源可以分为 **微任务**（microtask） 和 **宏任务**（macrotask）。在 ES6 规范中，microtask 称为 `jobs`，macrotask 称为 `task`。

## 微任务

微任务包括 `process.nextTick` 、`queueMicrotask`（一个 Web API，用于将一个回调函数加入微任务队列）、`promise.then` 、`MutationObserver`，其中 `process.nextTick` 为 Node 独有。

## 宏任务

宏任务包括 `script` 、 `setTimeout` 、`setInterval` 、`setImmediate` 、`I/O` 及 `UI rendering`。
