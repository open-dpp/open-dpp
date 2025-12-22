function getCurrentDateTime(): Date {
  return new Date(Date.now());
}

export const DateTime = {
  now: getCurrentDateTime,
};
