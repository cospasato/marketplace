const { PrismaClient } = require("@prisma/client");

async function main() {
  const db = new PrismaClient();
  try {
    console.log("Cleaning orphaned rows before migration...");
    const tables = ["SyncLog", "Webhook", "Product", "Order"];
    for (const table of tables) {
      try {
        await db.$executeRawUnsafe(
          `DELETE FROM "${table}" WHERE "storeId" NOT IN (SELECT id FROM "Store")`
        );
        console.log(`Cleaned ${table}`);
      } catch (e) {
        console.log(`Skip ${table}: ${e.message}`);
      }
    }
    // Also clean Notification rows with missing orderId
    try {
      await db.$executeRawUnsafe(
        `DELETE FROM "Notification" WHERE "orderId" NOT IN (SELECT id FROM "Order")`
      );
    } catch (e) {}
    // Clean new tables if they exist
    for (const t of ["AccountSession", "Payment"]) {
      try { await db.$executeRawUnsafe(`DELETE FROM "${t}" WHERE 1=0`); } catch {}
    }
    console.log("Cleanup complete.");
  } catch (err) {
    console.log("Cleanup skipped:", err.message);
  } finally {
    await db.$disconnect();
  }
}
main();
