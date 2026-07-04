export type HttpResponse = {
  status: number;
  headers: ReadonlyMap<string, string>;
  body: string;
};

export type HttpTransport = {
  get(url: string, headers?: Readonly<Record<string, string>>): Promise<HttpResponse>;
};
