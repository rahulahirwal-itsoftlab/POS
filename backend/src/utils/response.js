export const sendSuccess = (res, statusCode = 200, message = 'Operation successful', data = {}, meta = undefined) => {
  if (meta === undefined && data && Array.isArray(data.items) && data.meta) {
    meta = data.meta;
    data = data.items;
  }
  const payload = {
    success: true,
    message,
    data: data !== null ? data : {},
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, statusCode = 500, message = 'Something went wrong', error = {}) => {
  let errorsList = [];
  if (Array.isArray(error)) {
    errorsList = error;
  } else if (error?.validationErrors && Array.isArray(error.validationErrors)) {
    errorsList = error.validationErrors;
  } else if (error?.details) {
    errorsList = Array.isArray(error.details) ? error.details : [error.details];
  } else if (typeof error === 'string') {
    errorsList = [error];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: errorsList,
  });
};

export default {
  sendSuccess,
  sendError,
};
