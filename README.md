# Elysia with Bun runtime

## Prerequisites
Download Bun using npm.
```bash
npm install -g bun
```

## Development
First, install the necessary dependencies.
```bash
bun install
```

To generate the database and start the server, run:
```bash
bun run db:push
bun run dev
```

## API Documentation
While the server is running, open http://localhost:3000/swagger to show the generated docs.