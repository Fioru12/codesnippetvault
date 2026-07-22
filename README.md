# CodeSnippetVault

Modern code snippet manager with syntax highlighting, tags, and search.

## Features

- Save and organize code snippets
- Syntax highlighting (Prism.js)
- Tag-based organization
- Full-text search
- Copy to clipboard
- Statistics tracking
- Responsive design

## Quick Start

```bash
# Clone
git clone https://github.com/Fioru12/codesnippetvault.git
cd codesnippetvault

# Install
npm install

# Run
npm start
# Open http://localhost:3002
```

## Docker

```bash
docker-compose up -d
# Open http://localhost:3002
```

## API

- `GET /api/health` - Health check
- `GET /api/snippets` - List all snippets
- `POST /api/snippets` - Create snippet
- `GET /api/snippets/:id` - Get snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet
- `POST /api/snippets/:id/copy` - Increment copy count
- `GET /api/tags` - Get all tags
- `GET /api/languages` - Get all languages

## Tech Stack

- Node.js + Express
- Vanilla JavaScript
- Prism.js (syntax highlighting)
- Docker
- Helmet.js (security)
- Compression (gzip)

## License

MIT
