import { RequestContext } from "../context.ts";
import { Handler, Middleware } from "../types.ts";
import { Cascade } from "../utils/Cascade.ts";

export interface BaseRouteConfig<S extends object = object> {
  path: string;
  middleware?: Middleware<S> | Middleware<S>[];
  handler?: Handler<S>;
}

export class BaseRoute<S extends object = object> {
  path: string;
  middleware: Middleware<S>[];
  handler?: Handler<S>;

  constructor(routeObj: BaseRouteConfig<S>) {
    this.path = routeObj.path;
    this.handler = routeObj.handler && Cascade.promisify(routeObj.handler);
    this.middleware = [routeObj.middleware]
      .flat()
      .filter(Boolean)
      .map((mware) => Cascade.promisify(mware!));
  }

  get regexPath() {
    return new RegExp(this.path);
  }

  match(ctx: RequestContext<S>): boolean {
    return this.regexPath.test(ctx.url.pathname);
  }
}

export class BaseRouter<
  S extends object = object,
  Config extends BaseRouteConfig<S> = BaseRouteConfig<S>,
  R extends BaseRoute<S> = BaseRoute<S>
> {
  Route = BaseRoute<S>;

  constructor(
    public state?: S,
    public middleware: Middleware<S>[] = [],
    public routes: R[] = [] // <- use this as a hashmap for routes
  ) {}

  /**
   * Running Request through middleware cascade for Response.
   * @param request: Request
   * @returns Promise<Response>
   */
  async handle(request: Request): Promise<Response> {
    const ctx = new RequestContext(request, this.state);
    const res = await new Cascade<S>(ctx, this.middleware).run();
    return res ? res : new Response("", { status: 404 });
  }

  /**
   * Add global middleware or another router's middleware
   * @param middleware: Middleware[] | Middleware | Router
   * @returns number - server.middleware.length
   */
  use(middleware: Middleware<S> | Middleware<S>[]) {
    if (Array.isArray(middleware)) {
      middleware.forEach((mware) => this.use(mware));
    } else {
      this.middleware.push(Cascade.promisify(middleware));
    }
    return this;
  }

  /**
   * Add Route
   * @param route: Route | Route["path"]
   * @param arg2?: Partial<Route> | Middleware | Middleware[],
   * @param arg3?: Handler
   * @returns route: Route - added route object
   */
  addRoute(route: Config): R;
  addRoute(route: Config["path"], data: Omit<Config, "path"> | Handler<S>): R;
  addRoute(
    route: Config["path"],
    middleware: Middleware<S> | Middleware<S>[],
    handler: Handler<S>
  ): R;
  addRoute(
    arg1: Config | Config["path"],
    arg2?: Middleware<S> | Middleware<S>[] | Omit<Config, "path"> | Handler<S>,
    arg3?: Handler<S>
  ): R {
    // overload resolution
    const routeObj =
      typeof arg1 !== "string"
        ? arg1
        : arguments.length === 2
        ? arg2 instanceof Function
          ? { path: arg1, handler: arg2 as Handler<S> }
          : { path: arg1, ...(arg2 as Omit<Config, "path">) }
        : {
            path: arg1,
            middleware: arg2 as Middleware<S> | Middleware<S>[],
            handler: arg3 as Handler<S>,
          };

    // create new Route object
    const fullRoute = new this.Route(routeObj);

    // check if route already exists
    if (
      this.routes.find(
        (existing) =>
          existing.regexPath.toString() === fullRoute.regexPath.toString()
      )
    ) {
      throw new Error(`Route with path ${routeObj.path} already exists!`);
    }

    // assemble middleware
    const mware = [
      ...fullRoute.middleware,
      ...(fullRoute.handler ? [fullRoute.handler] : []),
    ];

    // add route to appropriate routes and middleware
    this.routes.push(fullRoute as R);
    this.middleware.push(function RouteMiddleware(ctx) {
      if (fullRoute.match(ctx)) {
        return new Cascade<S>(ctx, mware).run();
      }
    });

    return fullRoute as R;
  }

  /**
   * Add Routes
   * @param routes: Route[] - middleware can be Middlewares or Middleware
   * @returns Route[] - added routes
   */
  addRoutes(routes: Config[]): R[] {
    return routes.map((route) => this.addRoute(route));
  }

  /**
   * Remove Route from Peko server
   * @param route: Route["path"] of route to remove
   * @returns Route - removed route
   */
  removeRoute(route: R["path"]): R | undefined {
    const routeToRemove = this.routes.find((r) => r.path === route);
    if (routeToRemove) {
      this.routes.splice(this.routes.indexOf(routeToRemove), 1);
    }

    return routeToRemove;
  }

  /**
   * Remove Routes
   * @param routes: Route["path"] of routes to remove
   * @returns Array<Route | undefined> - removed routes
   */
  removeRoutes(routes: R["path"][]): Array<R | undefined> {
    return routes.map((route) => this.removeRoute(route));
  }
}
