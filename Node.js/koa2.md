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

基于中间件的框架，`app.use` 是koa核心方法（注册中间件），允许你在请求处理的过程中添加多个中间件函数；如：

**错误处理**：app.use(errorMiddleware());

**跨域配置**：app.use(cors());

**响应体格式**：app.use(koaBody());

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
