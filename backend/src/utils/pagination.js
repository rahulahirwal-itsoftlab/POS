export const getPagination = (query = {}) => {
  const parse = (value, fallback, name) => {
    if (value === undefined) return fallback;
    if (!/^\d+$/.test(String(value)) || Number(value) < 1) {
      const error = new Error(`${name} must be a positive integer`);
      error.statusCode = 422;
      throw error;
    }
    return Number(value);
  };
  const page = parse(query.page, 1, 'page');
  const limit = Math.min(parse(query.limit, 20, 'limit'), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const findManyPaginated = async (model, args, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const [items, total] = await Promise.all([
    model.findMany({ ...args, skip, take: limit }),
    model.count({ where: args.where }),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
