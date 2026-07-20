# Toolbox Property Data Integration

**Date:** 2026-07-20
**Status:** Approved

## Summary

Integrate the bracelet property data (数量/价格/重量/长度/最大周长) into the DesignCanvas toolbox expansion, and remove the standalone PropertyPanel from the DIY page.

## Motivation

The property data currently lives in a separate PropertyPanel below the canvas. The user wants this data consolidated into the toolbox button's expansion area, reducing vertical space usage and keeping related information together.

## Design

### Data Flow

Pass `properties`, `wristSize`, and `wearingStyle` as props from `DiyPage` to `DesignCanvas`:

```
useDiyStore → DiyPage → DesignCanvas (new props)
```

New DesignCanvas props:
- `properties: BraceletProperties` — contains `beadCount`, `totalPrice`, `totalWeight`, `totalLength`
- `wristSize: number | null`
- `wearingStyle: 'single' | 'double'`

DesignCanvas will compute `maxCircumference` internally using the same formula as the current PropertyPanel.

### Toolbox Expansion Layout

When `isToolboxOpen` is true, the toolbox expands to show:

```
┌──────────────────────────────────────┐
│ 🧰 工具                               │  ← trigger (always visible)
├──────────────────────────────────────┤
│  数量  价格    重量   长度   最大周长    │  ← data labels
│   3   ¥45    12g   18cm   20.5cm     │  ← data values
├──────────────────────────────────────┤
│      [清空]          [分享]           │  ← action buttons
└──────────────────────────────────────┘
```

- Expansion grows both horizontally (width) and vertically (height)
- Data section uses compact formatting, same as current PropertyPanel
- Action buttons remain at the bottom of the expanded area
- Card-like background with subtle shadow

### Files to Modify

1. **`src/components/DesignCanvas/index.tsx`**
   - Add `properties`, `wristSize`, `wearingStyle` to props interface
   - Import `formatPrice`, `formatWeight`, `formatLength` from `../../utils/formatter`
   - Add `maxCircumference` computation (same formula as PropertyPanel)
   - Render data section inside `design-canvas__toolbox-content` above the buttons

2. **`src/components/DesignCanvas/index.scss`**
   - Add styles for data display section inside `toolbox-content`
   - Add vertical expansion transition (`max-height`)
   - Style data labels and values

3. **`src/pages/diy/index.tsx`**
   - Remove `PropertyPanel` import
   - Remove `diy-page__properties` section from JSX
   - Pass `properties`, `wristSize`, `wearingStyle` props to `DesignCanvas`

4. **`src/pages/diy/index.scss`**
   - Remove `&__properties` styles

### Max Circumference Formula

```typescript
const maxCircumference = useMemo(() => {
  if (wristSize === null) return '未设置'
  const increment = 1.6 + (wristSize - 14) * 0.1
  const baseCircumference = wristSize + increment
  const max = wearingStyle === 'double' ? baseCircumference * 2 : baseCircumference
  return `${max.toFixed(1)}cm`
}, [wristSize, wearingStyle])
```

### Formatting Utilities

Reuse existing formatters:
- `formatPrice(totalPrice)` → `¥45.00`
- `formatWeight(totalWeight)` → `12.0g`
- `formatLength(totalLength)` → `18.0cm`
