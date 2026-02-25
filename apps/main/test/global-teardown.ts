export default async () => {
  const mongod = (globalThis as any).__MONGOD__ as { stop: () => Promise<void> } | undefined;
  await mongod?.stop();
};
