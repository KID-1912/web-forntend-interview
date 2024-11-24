// function throttle(fun, delay = 500) {
//   let last, deferTimer;
//   return function () {
//     let that = this;
//     let _args = arguments;
//     let now = +new Date();
//     if (last && now < last + delay) {
//       clearTimeout(deferTimer);
//       deferTimer = setTimeout(function () {
//         last = now;
//         fun.apply(that, _args);
//       }, last + delay - now);
//     } else {
//       last = now;
//       fun.apply(that, _args);
//     }
//   };
// }

function throttle(fn, delay = 500) {
  let flag = false; // 是否锁定
  let next; // 等待锁解除后的调用
  // 锁定推迟调用
  function lockCall() {
    if (next) {
      next();
      flag = true;
      next = undefined;
      setTimeout(lockCall, delay);
    } else {
      flag = false;
    }
  }

  return function (...args) {
    next = fn.bind(...args);
    if (flag) return;
    lockCall();
  };
}

const handle = throttle(function () {
  console.log("fn is called");
}, 2000);

const timer = setInterval(handle, 200);
