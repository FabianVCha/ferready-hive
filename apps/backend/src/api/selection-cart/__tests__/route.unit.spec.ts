import { GET, POST } from "../route";

const token = "a".repeat(64);
function harness(body: unknown = {}, session = token) {
  const lines: Record<string, any> = {};
  const service = {
    listSelectionLines: jest.fn(async (filter: Record<string, string>) => Object.values(lines).filter(
      (line: any) => Object.entries(filter).every(([key, value]) => line[key] === value))),
    createSelectionLines: jest.fn(async (line) => { lines[line.id] = line; return line; }),
    updateSelectionLines: jest.fn(async (line) => { lines[line.id] = line; return line; }),
  };
  const products = { listProducts: jest.fn(async () => [{ id: "prod_1", metadata: {
    reference: "12345", approved_by: "Ferready", pricing_status: "quote_required",
  } }]) };
  const req = { headers: { "x-selection-token": session }, body, scope: {
    resolve: (key: string) => key === "product" ? products : service,
  } };
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  return { req, res, service, products, lines };
}

test.each(["", "guessable", "x".repeat(64)])("rejects invalid session %s before accessing data", async (session) => {
  const { req, res, service } = harness({}, session);
  await GET(req as never, res as never);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(service.listSelectionLines).not.toHaveBeenCalled();
});

test.each([-1, 21, 1.5, "1", null])("rejects invalid quantity %s", async (quantity) => {
  const { req, res, products } = harness({ slug: "approved-tool", quantity });
  await POST(req as never, res as never);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(products.listProducts).not.toHaveBeenCalled();
});

test("rejects commercial fields supplied by a browser", async () => {
  const { req, res } = harness({ slug: "approved-tool", quantity: 1, price: 0 });
  await POST(req as never, res as never);
  expect(res.status).toHaveBeenCalledWith(400);
});

test("only approved imported pending-price products can be selected", async () => {
  const { req, res, products, service } = harness({ slug: "other", quantity: 1 });
  products.listProducts.mockResolvedValueOnce([]);
  await POST(req as never, res as never);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(service.createSelectionLines).not.toHaveBeenCalled();
});

test("retries do not duplicate; quantities persist without prices, tokens or checkout", async () => {
  const { req, res, service, lines } = harness({ slug: "approved-tool", quantity: 2 });
  await POST(req as never, res as never);
  await POST(req as never, res as never);
  expect(service.createSelectionLines).toHaveBeenCalledTimes(1);
  expect(service.updateSelectionLines).toHaveBeenCalledTimes(1);
  expect(Object.keys(lines)).toHaveLength(1);
  expect(JSON.stringify(lines)).not.toContain(token);
  expect(res.json).toHaveBeenLastCalledWith({
    pricing_status: "pending", checkout_allowed: false, items: [{ slug: "approved-tool", quantity: 2 }],
  });
  req.body = { slug: "approved-tool", quantity: 0 };
  await POST(req as never, res as never);
  expect(res.json).toHaveBeenLastCalledWith({ pricing_status: "pending", checkout_allowed: false, items: [] });
});

test("session isolation applies to every read", async () => {
  const { req, res } = harness({ slug: "approved-tool", quantity: 1 });
  await POST(req as never, res as never);
  req.headers["x-selection-token"] = "b".repeat(64);
  await GET(req as never, res as never);
  expect(res.json).toHaveBeenLastCalledWith({ pricing_status: "pending", checkout_allowed: false, items: [] });
});
