import { RequestContext } from "../context.ts";
import { Middleware, Result, Next, Handler } from "../types.ts";

export type PromiseHandler<C extends object = object> = (
  ctx: RequestContext<C>,
) => Promise<Response>;
export type PromiseMiddleware<C extends object = object> = (
  ctx: RequestContext<C>,
  next: Next
) => Promise<Result>;

/**
 * Utility class for running middleware functions in a cascade
 */
export class Cascade<C extends object = object> {
  result: Result;
  called = 0;

  constructor(public ctx: RequestContext<C>, public middleware: Middleware<C>[]) {}

  static promisify<H extends Handler>(fcn: H): PromiseHandler<H extends Handler<infer C> ? C : never>
  static promisify<M extends Middleware>(fcn: Middleware): PromiseMiddleware<M extends Middleware<infer C> ? C : never>
  static promisify(fcn: Handler | Middleware): PromiseHandler | PromiseMiddleware {
    return fcn.constructor.name === "AsyncFunction"
      ? (fcn as PromiseMiddleware)
      : (ctx, next) =>
          new Promise((res, rej) => {
            try {
              res(fcn(ctx, next));
            } catch (e) {
              rej(e);
            }
          });
  }

  async run(): Promise<Result> {
    if (this.middleware[this.called]) {
      try {
        const res = await this.middleware[this.called++](this.ctx, () =>
          this.run.call(this)
        );
        if (res) this.result = res;
        else return await this.run();
      } catch (error) {
        throw error;
      }
    }

    return this.result;
  }
}
