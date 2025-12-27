export type DesktopApplication =
  | "firefox"
  | "1password"
  | "thunderbird"
  | "vscode"
  | "terminal"
  | "desktop"
  | "directory"
  | "browseros";

export async function openDesktopApplication(
  application: DesktopApplication,
): Promise<boolean> {
  const response = await fetch("/api/proxy/desktop/computer-use", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "application",
      application,
    }),
  });

  return response.ok;
}
