import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Prepares a fresh production database for the storefront: one sales channel
 * and one publishable key linked to it. Idempotent, because the deployment runs
 * it on every release. It never creates an admin user and never publishes a
 * product: those stay explicit human actions.
 */
export default async function bootstrapProduction({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const apiKeyService = container.resolve(Modules.API_KEY);

  let [channel] = await salesChannelService.listSalesChannels({}, { take: 1 });
  if (!channel) {
    channel = await salesChannelService.createSalesChannels({
      name: "Ferready",
      description: "Canal de venta de la tienda Ferready",
    });
    logger.info(`[bootstrap] created sales channel ${channel.id}`);
  } else {
    logger.info(`[bootstrap] sales channel ${channel.id} already present`);
  }

  const [existingKey] = await apiKeyService.listApiKeys({ type: "publishable" }, { take: 1 });
  const key =
    existingKey ??
    (await apiKeyService.createApiKeys({
      title: "Ferready Storefront",
      type: "publishable",
      created_by: "bootstrap",
    }));

  if (!existingKey) {
    logger.info("[bootstrap] created publishable key");
  } else {
    logger.info("[bootstrap] publishable key already present");
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: key.id, add: [channel.id] },
  });

  // Printed on purpose: the deploy step copies this value into the env file.
  console.log(`MEDUSA_PUBLISHABLE_KEY=${key.token}`);
}
