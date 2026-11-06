export function onceSuccessful(operation: () => Promise<void>) {
  let result: Promise<void> | undefined;
  return () => result ??= Promise.resolve().then(operation).catch((error) => {
    result = undefined;
    throw error;
  });
}
