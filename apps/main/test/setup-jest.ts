jest.mock("better-auth", () => ({
  betterAuth: () => ({}),
}));

jest.mock("better-auth/adapters/mongodb", () => ({
  mongodbAdapter: () => ({}),
}));

jest.mock("better-auth/plugins", () => ({
  genericOAuth: () => () => ({}),
}));
