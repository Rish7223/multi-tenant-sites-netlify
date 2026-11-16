export const reply = (
  status: number,
  body: object,
  headers: HeadersInit = {},
) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

type ReadResult = { ok: true; body: unknown } | { ok: false; res: Response };

export async function readJson(
  req: Request,
  maxBytes = 20_000,
): Promise<ReadResult> {
  const raw = await req.text();
  if (raw.length > maxBytes) {
    return {
      ok: false,
      res: reply(413, { success: false, message: "Payload too large" }),
    };
  }
  try {
    return { ok: true, body: JSON.parse(raw) };
  } catch {
    return {
      ok: false,
      res: reply(400, { success: false, message: "Invalid JSON" }),
    };
  }
}

export const validationFailed = (
  issues: { path: PropertyKey[]; message: string }[],
) =>
  reply(400, {
    success: false,
    message: "Validation failed",
    errors: issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
