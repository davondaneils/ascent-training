import { adminClient, testUserId } from "./support";

/** Leave nothing behind in the test account except its enrollment. */
export default async function globalTeardown() {
  const id = await testUserId();
  for (const table of ["workouts", "cardio_logs", "mobility_logs"]) {
    await adminClient().from(table).delete().eq("user_id", id);
  }
}
