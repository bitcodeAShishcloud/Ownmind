/**
 * Data layer built on Node's built in SQLite (node:sqlite).
 *
 * Why no ORM: node:sqlite ships with Node, so there is no native module to
 * compile and no codegen step. The whole schema is plain SQL below, which also
 * means the database file is trivially inspectable and portable.
 *
 * This module is server only. Never import it from a Client Component.
 */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const DATA_DIR = process.env.OWNMIND_DATA_DIR || path.join(process.cwd(), '.data')
const DB_FILE = path.join(DATA_DIR, 'ownmind.db')

let instance: DatabaseSync | null = null

export function db(): DatabaseSync {
  if (instance) return instance

  mkdirSync(DATA_DIR, { recursive: true })

  const conn = new DatabaseSync(DB_FILE)
  conn.exec('pragma journal_mode = wal')
  conn.exec('pragma foreign_keys = on')
  conn.exec('pragma busy_timeout = 5000')

  migrate(conn)
  instance = conn
  return conn
}

/* -------------------------------------------------------------------------- */
/* Migrations                                                                  */
/* -------------------------------------------------------------------------- */

type Migration = { name: string; sql: string }

const migrations: Migration[] = [
  {
    name: '001_initial',
    sql: /* sql */ `
      create table users (
        id            text primary key,
        email         text not null unique,
        password_hash text not null,
        name          text,
        theme         text not null default 'system',
        created_at    text not null
      );

      create table sessions (
        id         text primary key,
        user_id    text not null references users(id) on delete cascade,
        created_at text not null,
        expires_at text not null
      );
      create index sessions_user on sessions(user_id);

      create table cards (
        id            text primary key,
        user_id       text not null references users(id) on delete cascade,
        kind          text not null,
        title         text,
        body          text,
        url           text,
        site_name     text,
        domain        text,
        excerpt       text,
        image_url     text,
        image_width   integer,
        image_height  integer,
        accent        text,
        tags          text not null default '[]',
        tags_index    text not null default '',
        summary       text,
        read_minutes  integer,
        pinned        integer not null default 0,
        archived      integer not null default 0,
        recall_state  text,
        recalled_at   text,
        created_at    text not null,
        updated_at    text not null
      );
      create index cards_user_created on cards(user_id, created_at desc);
      create index cards_user_pinned on cards(user_id, pinned, created_at desc);

      create table card_links (
        from_id text not null references cards(id) on delete cascade,
        to_id   text not null references cards(id) on delete cascade,
        primary key (from_id, to_id)
      );
      create index card_links_to on card_links(to_id);

      create table spaces (
        id         text primary key,
        user_id    text not null references users(id) on delete cascade,
        name       text not null,
        rule       text not null,
        created_at text not null
      );
      create index spaces_user on spaces(user_id);

      create table space_cards (
        space_id text not null references spaces(id) on delete cascade,
        card_id  text not null references cards(id) on delete cascade,
        primary key (space_id, card_id)
      );
      create index space_cards_card on space_cards(card_id);

      -- Full text search over an external content table so there is one copy
      -- of the text. Kept in sync by the triggers at the end of this migration.
      create virtual table card_fts using fts5(
        title,
        body,
        url,
        site_name,
        tags_index,
        summary,
        excerpt,
        content = 'cards',
        content_rowid = 'rowid',
        tokenize = "unicode61 remove_diacritics 2 tokenchars '_'"
      );

      create trigger cards_fts_insert after insert on cards begin
        insert into card_fts(
          rowid, title, body, url, site_name, tags_index, summary, excerpt
        ) values (
          new.rowid, new.title, new.body, new.url,
          new.site_name, new.tags_index, new.summary, new.excerpt
        );
      end;

      create trigger cards_fts_delete after delete on cards begin
        insert into card_fts(
          card_fts, rowid, title, body, url, site_name, tags_index, summary, excerpt
        ) values (
          'delete', old.rowid, old.title, old.body, old.url,
          old.site_name, old.tags_index, old.summary, old.excerpt
        );
      end;

      create trigger cards_fts_update after update on cards begin
        insert into card_fts(
          card_fts, rowid, title, body, url, site_name, tags_index, summary, excerpt
        ) values (
          'delete', old.rowid, old.title, old.body, old.url,
          old.site_name, old.tags_index, old.summary, old.excerpt
        );
        insert into card_fts(
          rowid, title, body, url, site_name, tags_index, summary, excerpt
        ) values (
          new.rowid, new.title, new.body, new.url,
          new.site_name, new.tags_index, new.summary, new.excerpt
        );
      end;
    `,
  },
  {
    name: '002_password_resets',
    sql: /* sql */ `
      -- Single use reset tokens. used_at is stamped on redemption so a link can
      -- never be replayed, and the row is deleted once it is spent.
      create table password_resets (
        id         text primary key,
        user_id    text not null references users(id) on delete cascade,
        created_at text not null,
        expires_at text not null,
        used_at    text
      );
      create index password_resets_user on password_resets(user_id);
    `,
  },
  {
    name: '003_otp_codes',
    sql: /* sql */ `
      -- One-time passcodes for email verification during signup, signin and
      -- password reset. Codes are 6-digit numeric, single use and expire after
      -- 10 minutes. attempts tracks failed verification for rate limiting.
      create table otp_codes (
        id         text primary key,
        email      text not null,
        code       text not null,
        purpose    text not null,
        expires_at text not null,
        used_at    text,
        attempts   integer not null default 0
      );
      create index otp_codes_email on otp_codes(email);
      create index otp_codes_expires on otp_codes(expires_at);
    `,
  },
  {
    name: '004_pending_auth',
    sql: /* sql */ `
      -- Temporary state for multi-page auth flows (signup / signin).
      -- Stores name, email, otp purpose and a one-time token so data survives
      -- page-to-page navigation without exposing secrets in URLs.
      create table pending_auth (
        id         text primary key,
        kind       text not null,   -- 'signup' | 'signin'
        email      text,
        name       text,
        otp_code   text,
        otp_sent   integer not null default 0,
        token      text not null unique,
        expires_at text not null,
        created_at text not null
      );
      create index pending_auth_token on pending_auth(token);
      create index pending_auth_expires on pending_auth(expires_at);
    `,
  },
  {
    name: '005_otp_rate_limits',
    sql: /* sql */ `
      -- Rate limiting for OTP send requests. Tracks requests per email and
      -- per caller to prevent abuse (sending unlimited codes to victims).
      create table otp_rate_limits (
        id          text primary key,
        target_type text not null,  -- 'email' | 'caller'
        target      text not null,  -- email address or caller identifier
        created_at  text not null
      );
      create index otp_rate_limits_target on otp_rate_limits(target_type, target, created_at);
      create index otp_rate_limits_created on otp_rate_limits(created_at);
    `,
  },
  {
    name: '006_captcha_tokens',
    sql: /* sql */ `
      -- Single-use CAPTCHA tokens. Each token is stored in the database and
      -- deleted after verification to prevent replay attacks.
      create table captcha_tokens (
        token      text primary key,
        answer     integer not null,
        expires_at text not null,
        attempts   integer not null default 0,
        used_at    text,
        created_at text not null
      );
      create index captcha_tokens_expires on captcha_tokens(expires_at);
    `,
  },
  {
    name: '007_passwordless',
    sql: /* sql */ `
      -- Sign in is proved by a code sent to the address, so there is no password
      -- to store. The column stays because it still holds the hash for anyone
      -- who signed up before this change; those rows are left untouched and are
      -- simply never read again. SQLite cannot drop a column on every version,
      -- and nulling them out would throw away data for no gain.
      alter table users alter column password_hash drop not null;

      -- Password resets only existed to hand out a new password.
      drop table if exists password_resets;

      -- Replaced by Cloudflare Turnstile, which verifies on its own servers and
      -- needs nothing stored here.
      drop table if exists captcha_tokens;
    `,
  },
  {
    name: '008_consent_analytics',
    sql: /* sql */ `
      -- The proof of consent itself. Under section 5(2) of the DPDP Act a
      -- controller has to demonstrate that consent was given, so this is kept
      -- whether or not any other category was accepted. Deliberately carries no
      -- identifier: a consent log row is not tied to a person or an account.
      create table consent_logs (
        id              text primary key,
        consent_version text not null,
        source          text not null,  -- banner_accept_all | banner_reject | modal_save
        necessary       integer not null,
        preferences     integer not null,
        analytics       integer not null,
        location        integer not null,
        device          integer not null,
        created_at      text not null,  -- when the person chose
        last_seen_at    text not null   -- moves forward on every later choice
      );
      create index consent_logs_created on consent_logs(created_at desc);
      create index consent_logs_seen on consent_logs(last_seen_at);

      -- Everything collected about a visit. Every row here belongs to a
      -- category the visitor switched on; the category is not stored per row
      -- because the endpoint only ever writes a row for a granted category.
      -- There is no column for an account, an email, or anything that could
      -- identify a person, and session_id is new every session by design.
      create table analytics_events (
        id              text primary key,
        type            text not null,  -- pageview | scroll_50 | outbound_click
        session_id      text not null,
        page_url        text,
        page_path       text,
        page_title      text,
        referrer        text,
        href            text,           -- outbound_click target

        -- category: device
        browser         text,
        browser_version text,
        os              text,
        screen          text,
        viewport        text,
        language        text,
        timezone        text,
        device_type     text,           -- mobile | desktop

        -- category: location. City level only. Coordinates stay null unless a
        -- lookup genuinely returns one, and are rounded before they are stored.
        city            text,
        region          text,
        country         text,
        latitude        real,
        longitude       real,

        created_at      text not null
      );
      create index analytics_events_created on analytics_events(created_at desc);
      create index analytics_events_type_created on analytics_events(type, created_at desc);
      create index analytics_events_path on analytics_events(page_path);
      create index analytics_events_device on analytics_events(device_type);
      create index analytics_events_city on analytics_events(city);

      -- A request to erase data. Kept so the ask is on record even where the
      -- person gave no email and there is nothing to look up.
      create table deletion_requests (
        id          text primary key,
        email       text not null,
        details     text,
        status      text not null default 'received',
        created_at  text not null,
        resolved_at text
      );
      create index deletion_requests_created on deletion_requests(created_at desc);
      create index deletion_requests_email on deletion_requests(email);
    `,
  },
  {
    name: '009_no_coordinates',
    sql: /* sql */ `
      -- Coordinates are removed entirely rather than merely left empty. Keeping
      -- a column invites somebody to fill it in later, and the promise in the
      -- cookie policy is that a position is not held, not that it is held and
      -- rounded. Every row written so far had them null already, so nothing is
      -- lost. City, region and country stay: those are the whole of the
      -- location category now.
      alter table analytics_events drop column latitude;
      alter table analytics_events drop column longitude;
    `,
  },
]

function migrate(conn: DatabaseSync) {
  const row = conn.prepare('pragma user_version').get() as { user_version?: number } | undefined
  const current = Number(row?.user_version ?? 0)

  for (let i = current; i < migrations.length; i++) {
    const migration = migrations[i]
    conn.exec('begin')
    try {
      conn.exec(migration.sql)
      // PRAGMA does not accept bound parameters, so the value is inlined.
      // It is an integer from a loop counter, never user input.
      conn.exec(`pragma user_version = ${i + 1}`)
      conn.exec('commit')
    } catch (error) {
      conn.exec('rollback')
      throw new Error(`Migration ${migration.name} failed: ${(error as Error).message}`)
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Small helpers                                                               */
/* -------------------------------------------------------------------------- */

export function nowIso() {
  return new Date().toISOString()
}

export function newId() {
  return crypto.randomUUID()
}

/** Run a set of writes inside a single transaction. */
export function transact<T>(fn: () => T): T {
  const conn = db()
  conn.exec('begin')
  try {
    const result = fn()
    conn.exec('commit')
    return result
  } catch (error) {
    conn.exec('rollback')
    throw error
  }
}
