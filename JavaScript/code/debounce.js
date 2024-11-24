function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

const handle = debounce(function () {
  console.log("fn is called");
});

const timer = setInterval(handle, 200);
setTimeout(() => clearInterval(timer), 1000);
