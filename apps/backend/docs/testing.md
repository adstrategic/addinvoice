# Backend testing

## Unit tests

Run with `yarn test` or `yarn test:unit`. No database required (Prisma is mocked).

## Integration tests

Integration tests use a **real Postgres database** dedicated to testing.

- Set `DATABASE_URL_TEST` to your test database URL (e.g. `postgresql://user:pass@host:5432/addinvoice_test`). Use a separate database from dev/prod.
- Apply the schema once (or in CI):  
  `yarn test:integration:prepare`  
  This runs `prisma migrate deploy` with `DATABASE_URL=$DATABASE_URL_TEST`.
- Run integration tests:  
  `yarn test:integration`

Vitest is configured so that when tests run, `DATABASE_URL` is set from `DATABASE_URL_TEST` when present, so the app connects to the test DB.
