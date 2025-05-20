class SafeCounter {
	constructor() {
	  this.count = 0;
	  this.queue = Promise.resolve();
	}
  
	increment(by = 1) {
	  this.queue = this.queue.then(() => {
		return new Promise((resolve) => {
		  this.count += by;
		  // console.log(`Counter updated: ${this.count}`);
		  resolve();
		});
	  });
	}

	decrement(by = 1) {
		this.queue = this.queue.then(() => {
		  return new Promise((resolve) => {
			this.count -= by;
			// console.log(`Counter updated: ${this.count}`);
			resolve();
		  });
		});
	  }
  
	get value() {
	  return this.count;
	}
  }
  
export {SafeCounter};
