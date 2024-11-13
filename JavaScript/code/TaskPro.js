class TaskPro {
  index = 0;
  queen = [];
  constructor() {}
  push(handle) {
    this.queen.push(handle);
  }
  run() {
    const dispatch = async (i) => {
      if (i >= this.queen.length) return;
      const next = () => {
        if (this.index > i) return;
        this.index = i + 1;
        return dispatch(i + 1);
      };
      await this.queen[i].call(this, next);
    };
    dispatch(0);
  }
}

const tasks = new TaskPro();

tasks.push(async (next) => {
  console.log(1);
  await next();
  console.log(2);
});

tasks.push(async (next) => {
  console.log(3);
  await new Promise((resolve) => {
    setTimeout(() => {
      console.log(4);
      resolve();
    }, 2000);
  });
  next();
});

tasks.push(async (next) => {
  console.log(5);
  next();
  console.log(6);
});

tasks.run();
