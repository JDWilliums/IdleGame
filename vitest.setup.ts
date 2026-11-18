// Adds DOM matchers like `toBeInTheDocument()` and `toHaveTextContent()` to `expect`.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Unmount anything React Testing Library rendered, so tests don't leak into each other.
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
