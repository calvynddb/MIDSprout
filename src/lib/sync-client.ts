export async function sendDatabaseMutation(body: Record<string, unknown>) {
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "Database write failed.");
  } catch (error) {
    console.error("MIDSprout could not sync a change to the database:", error);
  }
}
