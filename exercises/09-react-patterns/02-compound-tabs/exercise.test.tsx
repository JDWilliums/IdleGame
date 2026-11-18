// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { Tab, TabList, TabPanel, Tabs } from './exercise';

function GameTabs(props: { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Game sections">
        <Tab value="skills">Skills</Tab>
        <Tab value="bank">Bank</Tab>
        <Tab value="shop">Shop</Tab>
      </TabList>
      <TabPanel value="skills">Skills content</TabPanel>
      <TabPanel value="bank">Bank content</TabPanel>
      <TabPanel value="shop">Shop content</TabPanel>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('Tabs', () => {
  it('renders an accessible tablist with the default tab selected', () => {
    render(<GameTabs defaultValue="bank" />);
    expect(screen.getByRole('tablist', { name: 'Game sections' })).toBeInTheDocument();
    expect(tab('Bank')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Skills')).toHaveAttribute('aria-selected', 'false');
    expect(tab('Bank')).toHaveAttribute('type', 'button');
  });

  it('only renders the active panel, linked to its tab', () => {
    render(<GameTabs defaultValue="skills" />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Skills content');
    expect(screen.queryByText('Bank content')).not.toBeInTheDocument();
    expect(panel).toHaveAccessibleName('Skills');
    expect(tab('Skills')).toHaveAttribute('aria-controls', panel.id);
  });

  it('gives every tab a unique id, even across two Tabs instances', () => {
    render(
      <>
        <GameTabs defaultValue="skills" />
        <GameTabs defaultValue="skills" />
      </>,
    );
    const ids = screen.getAllByRole('tab').map((t) => t.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('selects a tab on click', async () => {
    render(<GameTabs defaultValue="skills" />);
    await userEvent.click(tab('Shop'));
    expect(tab('Shop')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Shop content');
  });

  it('uses a roving tabindex', () => {
    render(<GameTabs defaultValue="bank" />);
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('moves selection and focus with arrow keys, wrapping around', async () => {
    render(<GameTabs defaultValue="skills" />);
    tab('Skills').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Bank')).toHaveFocus();
    expect(tab('Bank')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(tab('Skills')).toHaveFocus(); // wrapped
    await userEvent.keyboard('{ArrowLeft}');
    expect(tab('Shop')).toHaveFocus(); // wrapped backwards
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Shop content');
  });

  it('supports Home and End', async () => {
    render(<GameTabs defaultValue="bank" />);
    tab('Bank').focus();
    await userEvent.keyboard('{End}');
    expect(tab('Shop')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(tab('Skills')).toHaveFocus();
  });

  it('can be controlled', async () => {
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('skills');
      return (
        <GameTabs
          value={value}
          onValueChange={(v) => {
            onValueChange(v);
            setValue(v);
          }}
        />
      );
    }
    render(<Controlled />);
    await userEvent.click(tab('Bank'));
    expect(onValueChange).toHaveBeenCalledWith('bank');
    expect(tab('Bank')).toHaveAttribute('aria-selected', 'true');
  });

  it('does not change by itself when controlled', async () => {
    render(<GameTabs value="skills" onValueChange={() => {}} />);
    await userEvent.click(tab('Bank'));
    expect(tab('Skills')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('misuse', () => {
  let consoleError: MockInstance;
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('throws a helpful error when used outside <Tabs>', () => {
    expect(() => render(<Tab value="x">X</Tab>)).toThrow('<Tab> must be used within <Tabs>');
    expect(() => render(<TabPanel value="x">X</TabPanel>)).toThrow('<TabPanel> must be used within <Tabs>');
  });
});
