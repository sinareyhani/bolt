export default class SwitchableStream {
  private _readable: ReadableStream;
  private _controller: ReadableStreamDefaultController | null = null;
  private _switches = 0;

  constructor() {
    this._readable = new ReadableStream({
      start: (controller) => {
        this._controller = controller;
      }
    });
  }

  get readable() {
    return this._readable;
  }

  get switches() {
    return this._switches;
  }

  switchSource(newStream: ReadableStream) {
    this._switches++;
    
    const reader = newStream.getReader();
    
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          if (this._controller) {
            this._controller.enqueue(value);
          }
        }
      } catch (error) {
        if (this._controller) {
          this._controller.error(error);
        }
      }
    };
    
    pump();
  }

  close() {
    if (this._controller) {
      this._controller.close();
    }
  }
}