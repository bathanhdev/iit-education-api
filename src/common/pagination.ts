export type PaginationQuery = {
  page?: string | number;
  limit?: string | number;
};

export type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

export function getQueryValue(value: unknown): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === undefined || rawValue === null) {
    return undefined;
  }

  const normalizedValue = String(rawValue).trim();
  if (
    !normalizedValue ||
    normalizedValue === 'undefined' ||
    normalizedValue === 'null' ||
    /^{{.+}}$/.test(normalizedValue)
  ) {
    return undefined;
  }

  return normalizedValue;
}

type PaginationDelegate<T> = {
  findMany(args?: Record<string, any>): Promise<T[]>;
  count(args?: Record<string, any>): Promise<number>;
};

export function getPaginationParams(
  query?: PaginationQuery,
  options: PaginationOptions = {},
): PaginationParams | null {
  if (!query?.page && !query?.limit) {
    return null;
  }

  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const page = Math.max(Number(query?.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query?.limit) || defaultLimit, 1), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  pagination: Pick<PaginationParams, 'page' | 'limit'>,
) {
  return {
    data,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function paginate<T>(
  delegate: PaginationDelegate<T>,
  query?: PaginationQuery,
  args: Record<string, any> = {},
  options?: PaginationOptions,
) {
  const pagination = getPaginationParams(query, options);
  if (!pagination) {
    return delegate.findMany(args);
  }

  const total = await delegate.count({ where: args.where });
  const totalPages = Math.ceil(total / pagination.limit);
  const page = totalPages > 0 ? Math.min(pagination.page, totalPages) : pagination.page;
  const data = await delegate.findMany({
    ...args,
    skip: (page - 1) * pagination.limit,
    take: pagination.limit,
  });

  return buildPaginatedResult(data, total, {
    page,
    limit: pagination.limit,
  });
}