import { Client } from "pg";

export default async function whoami() {
  const url = process.env.DATABASE_URL ?? "";
  const redacted = url.replace(/\/\/[^@]*@/, "//<cred>@");
  const client = new Client({ connectionString: url });
  await client.connect();
  const info = await client.query(
    "select current_database() as db, inet_server_port() as port, current_user as usr, (select count(*) from information_schema.tables where table_schema='public') as tables"
  );
  console.log("DATABASE_URL=", redacted);
  console.log(info.rows[0]);
  await client.end();
}
