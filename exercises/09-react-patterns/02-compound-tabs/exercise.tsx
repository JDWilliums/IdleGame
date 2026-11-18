/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 09-02 · compound-tabs
 * Lesson:  09.3 Composition patterns
 * Run:     npm run watch 09-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build accessible compound Tabs, following the WAI-ARIA Tabs pattern
 * ("automatic activation": moving focus also selects the tab).
 *
 *   <Tabs defaultValue="skills">                 ← uncontrolled
 *   <Tabs value={tab} onValueChange={setTab}>    ← or controlled
 *     <TabList aria-label="Game sections">
 *       <Tab value="skills">Skills</Tab>
 *       <Tab value="bank">Bank</Tab>
 *     </TabList>
 *     <TabPanel value="skills">…</TabPanel>
 *     <TabPanel value="bank">…</TabPanel>
 *   </Tabs>
 *
 * Requirements
 *   Tabs       Holds the active value: uncontrolled (defaultValue) OR
 *              controlled (value + onValueChange). When controlled, it calls
 *              onValueChange and doesn't change by itself. Shares state via context.
 *   TabList    role="tablist", passes through aria-label. Handles keyboard:
 *                ArrowRight / ArrowLeft → next / previous tab (WRAPS around)
 *                Home / End             → first / last tab
 *              Moving selects that tab AND focuses it.
 *   Tab        <button type="button" role="tab">, with aria-selected, a unique id,
 *              and aria-controls pointing at its panel's id. Roving tabindex:
 *              selected → 0, others → -1. Click selects it.
 *   TabPanel   role="tabpanel", aria-labelledby → its tab's id, and an id matching
 *              the tab's aria-controls. Renders ONLY when active.
 *   Tab/TabPanel/TabList used outside <Tabs> must throw an Error whose message
 *   is "<Tab> must be used within <Tabs>" (with the right component name).
 *
 * Tip: TabList can find its tabs in the DOM (querySelectorAll('[role="tab"]')
 * on a ref) and read each one's value from a data-value attribute.
 */
import type { ReactNode } from 'react';

export type TabsProps = {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs(props: TabsProps) {
  return <>{props.children}</>; // TODO
}

export function TabList({ children, 'aria-label': ariaLabel }: { children: ReactNode; 'aria-label': string }) {
  return null; // TODO
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return null; // TODO
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  return null; // TODO
}
