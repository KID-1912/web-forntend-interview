class MyPromise {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";
  PromiseState = MyPromise.PENDING;
  PromiseResult = undefined;
  _fulfilledCallbacks = [];
  _rejectedCallbacks = [];
  constructor(handle) {
    try {
      handle(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }
  resolve(result) {
    setTimeout(() => {
      if (this.PromiseState === MyPromise.PENDING) {
        this.PromiseResult = result;
        const allSuccess = this._fulfilledCallbacks.every((cb) => {
          try {
            this.PromiseResult = cb(this.PromiseResult);
            return true;
          } catch (error) {
            this.reject(error);
            return false;
          }
        });
        allSuccess && (this.PromiseState = MyPromise.FULFILLED);
      }
    }, 0);
  }
  reject(error) {
    setTimeout(() => {
      if (this.PromiseState === MyPromise.PENDING) {
        this.PromiseResult = error;
        this._rejectedCallbacks.some((cb) => {
          try {
            cb(this.PromiseResult);
            return true;
          } catch (error) {
            this.PromiseResult = error;
            return false;
          }
        });
        this.PromiseState = MyPromise.REJECTED;
      }
    }, 0);
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (err) => {
            throw err;
          };
    if (this.PromiseState === MyPromise.PENDING) {
      this._fulfilledCallbacks.push(onFulfilled);
      this._rejectedCallbacks.push(onRejected);
    }
    if (this.PromiseState === MyPromise.FULFILLED) {
      this.PromiseResult = onFulfilled(this.PromiseResult);
    }
    if (this.PromiseState === MyPromise.REJECTED) {
      this.PromiseResult = onRejected(this.PromiseResult);
    }
    return this;
  }
  catch(cb) {
    return this.then(null, cb);
  }
  finally(cb) {
    return this.then(cb, cb);
  }
}

const pro = new MyPromise((resolve, reject) => {
  resolve("resolve return res");
})
  .then(
    (result) => {
      console.log("then1", result);
      throw new Error("then error");
    },
    (err) => {
      console.log("then catch");
    }
  )
  .finally(() => {
    console.log("finally!");
  })
  .then((result) => {
    console.log("then2", result);
  })
  .catch((error) => {
    console.log("error:message", error.message);
  })
  .catch((error) => {
    console.log("error:message2", error.message);
  });
