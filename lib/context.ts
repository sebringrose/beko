export class RequestContext<S extends object = object> {
  url: URL;
  params: Record<string, string> = {};

  constructor(public request: Request, public state: S) {
    this.url = new URL(request.url);
  }
}