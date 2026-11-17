const createRequest = async (options) => {
  const { url, method, body } = options;
  const request = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!request.ok) {
    throw new Error("Ошибка");
  }

  const result = await request.json();

  return result;
};

export default createRequest;
