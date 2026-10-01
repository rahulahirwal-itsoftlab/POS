export const serializableTransaction = async (prisma, operation, retries = 3) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        maxWait: 10000,
        timeout: 20000,
      });
    } catch (error) {
      if ((error.code !== 'P2034' && error.code !== 'P2028') || attempt >= retries) throw error;
    }
  }
};

