# 数据类型

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

仅支持一下类型转换：

- 转换为布尔值
- 转换为数字
- 转换为字符串

# this 指向
