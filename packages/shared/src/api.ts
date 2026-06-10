export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
}

export interface ApiError {
  error: {
    code: string | number;
    message: string;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
