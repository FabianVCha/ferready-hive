import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261124180000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "selection_line" (
      "id" text not null primary key,
      "session_hash" text not null,
      "product_id" text not null,
      "slug" text not null,
      "quantity" integer not null check ("quantity" between 0 and 20),
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null
    );`);
    this.addSql(`create index if not exists "selection_line_session" on "selection_line" ("session_hash") where "deleted_at" is null;`);
  }
  async down(): Promise<void> {
    this.addSql('drop table if exists "selection_line";');
  }
}
