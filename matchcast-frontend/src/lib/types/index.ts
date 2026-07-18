export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: { message: string; code: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiErrorResponse;
