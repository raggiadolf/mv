export default function GET(req: Request, res: Response) {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 })
  }
  console.log("cron job")
  return new Response("OK", { status: 200 })
}
