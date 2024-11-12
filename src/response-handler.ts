import { NextFunction, Request, Response, ErrorRequestHandler } from 'express';

export interface ErrorCustom {
  code?: string,
  statusCode?: number;
  messages?: any,
};

export class BaseErrors extends Error {
  code: string;
  statusCode: number;
  messages: any;
  constructor(code = 'server_error', status = 500, message = 'Internal server error') {
    super();
    this.code = code;
    this.statusCode = status;
    this.messages = message;
  }
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new BaseErrors('not_found', 404, 'Not Found'));
};

export const errorHandler: ErrorRequestHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  const code = error.code ? error.code : 'server_error';
  const statusCode = error.statusCode ? error.statusCode : 500;
  let messages = error.messages ? error.messages : 'Internal server error';

  console.error(error);

  if (error instanceof Error) {
    messages = error.message;
  }

  res.status(statusCode).json({
    code,
    statusCode,
    messages,
  });
};

export const responseSuccess = <T>(res: Response, data: T) => {
  res.status(200).json({ code: 'success', data });
}
