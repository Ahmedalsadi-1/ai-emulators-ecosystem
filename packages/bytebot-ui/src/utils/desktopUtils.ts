export type DesktopApplication =
  | "firefox"
  | "1password"
  | "thunderbird"
  | "vscode"
  | "terminal"
  | "desktop"
  | "directory"
  | "browseros"
  | "turix"
  | "aios"
  | "open-interface";

export async function openDesktopApplication(
  application: DesktopApplication,
): Promise<boolean> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("bytebot:authToken")
      : null;
  const response = await fetch("/api/proxy/desktop/computer-use", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: "application",
      application,
    }),
  });

  return response.ok;
}
