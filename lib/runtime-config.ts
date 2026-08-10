export function resolveRuntimeFlags(input: { demoMode?: string; seedDemoData?: string; appEnvironment?: string }) {
  const appEnvironment = input.appEnvironment === "staging" || input.appEnvironment === "production"
    ? input.appEnvironment
    : "development";
  return {
    appEnvironment,
    demoMode: input.demoMode === "true",
    seedDemoData: input.seedDemoData === "true" && appEnvironment !== "production",
  } as const;
}

export const runtimeFlags = resolveRuntimeFlags({
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE,
  seedDemoData: process.env.NEXT_PUBLIC_SEED_DEMO_DATA,
  appEnvironment: process.env.NEXT_PUBLIC_APP_ENV,
});
