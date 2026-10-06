# payz-core

Shared Payz types, database schema, logging, payment-route contracts, and provider interfaces. Service repositories depend on this package for common Payz-owned contracts rather than each defining its own copy.

## Local development

```sh
pnpm install
pnpm typecheck
```

Database tools use `DATABASE_URL`. Use a local development database and never point schema commands at production.

## License

Licensed under the Apache License, Version 2.0. See `LICENSE`.
