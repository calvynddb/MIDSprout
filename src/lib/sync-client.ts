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

export async function deleteDatabaseRecord(kind: "organization" | "collaboration", id: string) {
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: `delete-${kind}`, id }),
    });
    if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "Delete failed.");
    return true;
  } catch (error) {
    console.error(`MIDSprout could not delete ${kind}:`, error);
    return false;
  }
}
