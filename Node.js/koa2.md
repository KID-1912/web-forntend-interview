# Koa2

## 创建应用

```js
const Koa = require("koa"); 
const app = new Koa()
```

## 安装路由

```js
const Router = require("koa-router"); 
const adminRouter = new Router({ prefix: "/admin" })
// .....
app.use(router.routes());
```

## app.use

基于中间件的框架，`app.use` 是koa核心方法（注册中间件），允许你在请求处理的过程中添加多个函数（中间件本质就是函数）；如：

**错误处理**：app.use(errorMiddleware())

**跨域配置**：app.use(cors())

**响应体格式**：app.use(koaBody())

## 错误处理

**定义错误类**

**建立错误码映射**

**捕获错误并响应**

```js
const {
  InvalidRequestError,
  RouteNotFoundError,
} = require("../errors/client-error.js");

module.exports = function () {
  return async (ctx, next) => {
    try {
      await next();
      if (ctx.status === 404) throw new RouteNotFoundError();
      if (ctx.status === 405) throw new InvalidRequestError();
    } catch (error) {
      console.log("errorMiddle", error);
      // 错误日志
      // ......记录错误详细信息
      // 错误码响应
      const code = error.code || error.status;
      const message = code && error.message ? error.message : "未知错误";
      ctx.body = { code: code || 500, message };
    }
  };
};
```

**中间件处理抛出错误**

## 洋葱模型

实现同步/异步下都能控制中间件处理顺序；核心是 `next` 方法：

1. 执行所有app.use，收集中间件处理函数到列表
   
   ```js
   function Koa () {
     // ...
     this.middleares = [];
   }
   
   Koa.prototype.use = function (middleare) {
       // 此时 middleare 其实就是 (ctx, next) => ()
       this.middleares.push(middleare); // 发布订阅，先收集中间件
       reutrn this;
   }
   ```

2. 端口监听到请求 ，从第1个依次开始执行中间件处理
   
   ```js
   function compose (middleares) {
       // 准备递归
       function dispatch(i) {
           const middleare = middleares[i]; // 别忘记中间件的格式 (ctx, next) => ()
           return middleare('ctx', dispatch.bind(null, i + 1)); // 每次调用next，都用调用一次dispatch方法，并且i+1
       }
       return dispatch(0)
   }
   ```

3. 传递ctx参数以及next，next执行当前中间件的下一个，当内部调用next就会中途跳下一个，直到最后一个中间件完成回到最初第1个中间件；

**注**：koa利用koa-compose这个库组合中间件的，在koa-compose里面，next返回的都是一个promise函数。这就是为什么koa支持async、await处理；

## 对比Express

- Koa更轻量，Express内置了封装

- Koa有ctx上下文状态，对其访问和处理，Express直接暴露req，res

- Koa支持中间件的async/await异步处理，Express只能通过回调嵌套实现有序异步；
