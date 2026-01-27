I will implement the 6 major crystal categories as requested by refactoring the `BeadSelector` component to use a static category structure. This ensures the categories always appear correctly and are organized exactly as specified.

### Plan:

1.  **Update Type Definitions**:
    -   Modify `src/types/common.ts`: Update `Category` interface to include an optional `children?: Category[]` field. This formally supports the nested category structure.

2.  **Refactor `BeadSelector` Component** (`src/components/BeadSelector/index.tsx`):
    -   Replace `MAIN_CATEGORIES_MAP` with a structured `CATEGORY_CONFIG` constant that matches the user's provided JSON (grouping "单色水晶", "发晶系列", etc., with their respective sub-categories).
    -   Refactor `processedCategories` to return this `CATEGORY_CONFIG` directly, removing the dependency on `beadService.getCategories()`. This ensures the categorization is fixed and doesn't rely on the API returning matching data.
    -   Remove the `categories` state and the `useEffect` hook that fetches categories, as the structure is now static.
    -   (Behavior) The selection logic remains the same: Users select a Main Category, then a Sub Category. The ID passed to `beadService.getBeads` will be the selected Main or Sub Category ID (e.g., "白水晶" or "单色水晶").

### Verification:
-   After changes, the "DIY" page should show the 6 main categories.
-   Clicking a main category (e.g., "单色水晶") should show its sub-categories (e.g., "白水晶", "粉水晶").
-   Selecting a sub-category should trigger the bead loading with the correct ID.
