/**
 * Test-only fixtures. Runs against the isolated test database and creates the
 * minimum rows needed to prove that drafts stay invisible and published
 * products are reachable through the Store API.
 */
import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";

const FIXTURES = [
  { handle: "fixture-published", title: "Fixture published", status: ProductStatus.PUBLISHED },
  { handle: "fixture-draft", title: "Fixture draft", status: ProductStatus.DRAFT },
];

export default async function createTestFixtures({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productService = container.resolve(Modules.PRODUCT);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const apiKeyService = container.resolve(Modules.API_KEY);

  const [salesChannel] = await salesChannelService.listSalesChannels({}, { take: 1 });

  for (const fixture of FIXTURES) {
    const [existing] = await productService.listProducts({ handle: fixture.handle }, { select: ["id"] });
    if (existing) {
      continue;
    }
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: fixture.title,
            handle: fixture.handle,
            status: fixture.status,
            metadata: { reference: fixture.handle.toUpperCase(), test_fixture: true },
            options: [{ title: "Presentación", values: ["Única"] }],
            variants: [
              {
                title: "Única",
                sku: `${fixture.handle}-sku`,
                manage_inventory: false,
                options: { Presentación: "Única" },
              },
            ],
            sales_channels: salesChannel ? [{ id: salesChannel.id }] : undefined,
          },
        ],
      },
    });
  }

  const keys = await apiKeyService.listApiKeys({ type: "publishable" }, { take: 1 });
  let token = keys[0]?.token ?? null;
  if (!token) {
    const [created] = await apiKeyService.createApiKeys([
      { title: "storefront-test", type: "publishable", created_by: "test-fixtures" },
    ]);
    token = created.token;
  }

  // The publishable key is a public client key; tests need it to call the Store API.
  logger.info(`[fixtures] publishable_key=${token}`);
  logger.info(`[fixtures] products=${FIXTURES.length}`);
}
