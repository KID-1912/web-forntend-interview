# 0.1 + 0.2 !== 0.3

JS 采用双精度版本（64位）存储数字， 64 位之外多余的会被裁剪掉，造成精度丢失；

很多十进制小数用二进制表示都是无限循环的；

**解决**

```js
parseFloat((0.1 + 0.2).toFixed(10)) === 0.3 // true
Math.round(num * 100) / 100; // 四舍五入指定位
```

ecimal.js或big.js，提供高精度的十进制运算；

# 垃圾回收机

垃圾回收目的：内存释放

垃圾回收器：内存释放机制，核心：识别确定的需要回收的内存（无法引用的值）

**内存泄露**

原因：垃圾回收器无法回收的内存，这部分占用过多导致溢出

**垃圾回收机制**

目的：防止内存泄露或不必要内存占用

方法：引用计数（已淘汰）标记清除（无法触及的引用值将被释放，所以我们可以通过设置null手动标记）

新生代、旧生代、generation、星历图都只是具体细节
