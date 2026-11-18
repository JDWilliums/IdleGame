/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 07-02 · lifting-state
 * Lesson:  07.2 Structuring & lifting state
 * Run:     npm run watch 07-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a small shop screen out of four components. The interesting part is
 * deciding WHERE each piece of state lives and WHAT is derived.
 *
 * ShopScreen({ initialGold, items })   ← owns ALL the state
 *   ├── GoldHeader       shows <output aria-label="Gold">{gold}</output>
 *   ├── ShopList         <ul aria-label="Shop">: one <li> per item with:
 *   │                      - a <button> showing the item's name: clicking it SELECTS the item
 *   │                      - "{price}g"
 *   │                      - a Buy button: <button aria-label="Buy {name}">
 *   │                          text "Owned" + disabled if owned,
 *   │                          text "Buy" + disabled if gold < price, otherwise enabled
 *   ├── OwnedList        <ul aria-label="Your gear">: one <li> per owned item, in the order bought, with
 *   │                      its name and a <button aria-label="Sell {name}">Sell</button>.
 *   │                      Selling refunds Math.floor(price / 2) and removes it from owned.
 *   │                      With nothing owned: <p>You don't own anything yet</p>
 *   └── ItemDetails      <section aria-label="Details">: for the selected item:
 *                          <h2>{name}</h2>, <p>{description}</p>, and <p>Owned</p> or <p>Not owned</p>.
 *                          With nothing selected: <p>Select an item to see details</p>
 *
 * Rules (the tests check the behaviour that follows from them):
 *   - The details panel must ALWAYS reflect the current owned status, e.g.
 *     select an item, then buy it, and the panel must say "Owned". Store the
 *     selected item's ID, not a copy of the item (lesson 07.2, principle 4).
 *   - Store owned items as a list of ids. Gold and ownership change together
 *     when buying and selling.
 *   - Child components receive data and callbacks through props. Only
 *     ShopScreen has useState.
 */

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type ShopScreenProps = {
  initialGold: number;
  items: readonly ShopItem[];
};

export function ShopScreen(props: ShopScreenProps) {
  return null; // TODO: state + compose the four children
}

// TODO: write GoldHeader, ShopList, OwnedList and ItemDetails below (they don't need to be exported).
