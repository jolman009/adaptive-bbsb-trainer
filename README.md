# Adaptive BBSB Trainer

A modern, robust React application for adaptive training built with Vite, TypeScript, and Material Design 3.

## Project Setup

### Quick Start

```bash
# Install dependencies with pnpm
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Available Scripts

- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm build` - Build for production with source maps
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint checks
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking

## Tech Stack

- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite** - Fast build tool
- **Material UI (MUI)** - Component library with Material Design 3
- **Zod** - Schema validation
- **pnpm** - Package manager

## Code Quality

- **ESLint** - Code linting with strict TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Strict type checking enabled

### IDE Setup

For the best development experience with VS Code, install:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Enable `format on save` in your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Project Structure

```
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── theme/           # Theme configuration (Material Design 3)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Root component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## License

MIT
