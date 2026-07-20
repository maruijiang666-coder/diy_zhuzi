# Toolbox Property Data Integration - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate bracelet property data (数量/价格/重量/长度/最大周长) into the DesignCanvas toolbox expansion and remove the standalone PropertyPanel.

**Architecture:** Pass `properties`, `wristSize`, `wearingStyle` as props from DiyPage to DesignCanvas. Render a data section inside the toolbox expansion above the action buttons. Remove PropertyPanel from DiyPage.

**Tech Stack:** Taro 3, React, SCSS

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/DesignCanvas/index.tsx` | Modify | Add props, render data section in toolbox |
| `src/components/DesignCanvas/index.scss` | Modify | Add data section styles, vertical expansion |
| `src/pages/diy/index.tsx` | Modify | Pass new props, remove PropertyPanel |
| `src/pages/diy/index.scss` | Modify | Remove `__properties` styles |

---

### Task 1: Update DesignCanvas Props and Add Data Rendering

**Files:**
- Modify: `src/components/DesignCanvas/index.tsx`

- [ ] **Step 1: Add new props to the interface**

In `src/components/DesignCanvas/index.tsx`, add `properties`, `wristSize`, and `wearingStyle` to the `DesignCanvasProps` interface:

```typescript
interface DesignCanvasProps {
  bracelet: Bracelet;
  selectedBeadIndex: number | null;
  onBeadSelect: (index: number) => void;
  onBeadDelete: (index: number) => void;
  onBeadMove: (fromIndex: number, toIndex: number) => void;
  onSettingClick?: () => void;
  onClear?: () => void;
  onSave?: () => void;
  onAddToCart?: () => void;
  isSaving?: boolean;
  isAddingToCart?: boolean;
  disabled?: boolean;
  backgroundImageUrl?: string;
  properties?: BraceletProperties;
  wristSize?: number | null;
  wearingStyle?: 'single' | 'double';
}
```

- [ ] **Step 2: Add imports for formatters and type**

At the top of `src/components/DesignCanvas/index.tsx`, add:

```typescript
import type { BraceletProperties } from '../../types/bracelet'
import { formatPrice, formatWeight, formatLength } from '../../utils/formatter'
```

- [ ] **Step 3: Destructure new props**

In the component function, add the new props to the destructuring:

```typescript
const DesignCanvas: React.FC<DesignCanvasProps> = ({
  bracelet,
  selectedBeadIndex,
  onBeadSelect,
  onBeadDelete,
  onBeadMove,
  onSettingClick,
  onClear,
  onSave,
  onAddToCart,
  isSaving,
  isAddingToCart,
  disabled,
  backgroundImageUrl,
  properties,
  wristSize,
  wearingStyle,
}) => {
```

- [ ] **Step 4: Add max circumference computation**

After the existing `useMemo` hooks (around the `rpxRatio` useMemo), add:

```typescript
const maxCircumference = useMemo(() => {
  if (wristSize === null || wristSize === undefined) return '未设置'
  const increment = 1.6 + (wristSize - 14) * 0.1
  const baseCircumference = wristSize + increment
  const max = wearingStyle === 'double' ? baseCircumference * 2 : baseCircumference
  return `${max.toFixed(1)}cm`
}, [wristSize, wearingStyle])
```

- [ ] **Step 5: Render data section in toolbox expansion (empty state)**

In the empty state return block, replace the `design-canvas__toolbox-content` section with:

```tsx
<View className='design-canvas__toolbox-content'>
  {properties && (
    <View className='toolbox-data'>
      <View className='toolbox-data__row'>
        <View className='toolbox-data__item'>
          <Text className='toolbox-data__label'>数量</Text>
          <Text className='toolbox-data__value'>{properties.beadCount}</Text>
        </View>
        <View className='toolbox-data__item'>
          <Text className='toolbox-data__label'>价格</Text>
          <Text className='toolbox-data__value toolbox-data__value--price'>{formatPrice(properties.totalPrice)}</Text>
        </View>
        <View className='toolbox-data__item'>
          <Text className='toolbox-data__label'>重量</Text>
          <Text className='toolbox-data__value'>{formatWeight(properties.totalWeight)}</Text>
        </View>
        <View className='toolbox-data__item'>
          <Text className='toolbox-data__label'>长度</Text>
          <Text className='toolbox-data__value'>{formatLength(properties.totalLength)}</Text>
        </View>
        <View className='toolbox-data__item'>
          <Text className='toolbox-data__label'>最大周长</Text>
          <Text className='toolbox-data__value'>{maxCircumference}</Text>
        </View>
      </View>
    </View>
  )}
  <View className='toolbox-actions'>
    <Button className='design-canvas__toolbox-btn' onClick={onClear}>清空</Button>
    <Button className='design-canvas__toolbox-btn' openType='share'>分享</Button>
  </View>
</View>
```

- [ ] **Step 6: Render data section in toolbox expansion (non-empty state)**

In the non-empty state return block (the main `return`), replace the `design-canvas__toolbox-content` section with the same content as Step 5.

- [ ] **Step 7: Verify the build compiles**

Run: `cd F:/DieJiaTai/diyUseCanvans/DIY_crystal_bus && npx taro build --type weapp 2>&1 | tail -5`
Expected: Build succeeds (no TypeScript errors)

- [ ] **Step 8: Commit**

```bash
git add src/components/DesignCanvas/index.tsx
git commit -m "feat: add property data rendering to toolbox expansion"
```

---

### Task 2: Add Toolbox Data Section Styles

**Files:**
- Modify: `src/components/DesignCanvas/index.scss`

- [ ] **Step 1: Update toolbox-content for vertical expansion**

In `src/components/DesignCanvas/index.scss`, replace the existing `&-content` and `&--open &-content` rules inside `&__toolbox` with:

```scss
&-content {
  display: flex;
  flex-direction: column;
  max-width: 0;
  max-height: 0;
  opacity: 0;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

&--open &-content {
  max-width: 600rpx;
  max-height: 400rpx;
  opacity: 1;
  padding: 16rpx 20rpx 16rpx 0;
}
```

- [ ] **Step 2: Add toolbox data styles**

After the `&__toolbox` block (before `&--empty`), add:

```scss
.toolbox-data {
  margin-bottom: 12rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);

  &__row {
    display: flex;
    gap: 16rpx;
    white-space: nowrap;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rpx;
  }

  &__label {
    font-size: 18rpx;
    color: #999;
  }

  &__value {
    font-size: 22rpx;
    font-weight: 600;
    color: #333;

    &--price {
      color: #ff6b6b;
    }
  }
}

.toolbox-actions {
  display: flex;
  gap: 12rpx;
}
```

- [ ] **Step 3: Update toolbox-btn margin**

The existing `&-btn` has `margin-left: 10rpx` and `&:first-child { margin-left: 0 }`. Since buttons are now inside `.toolbox-actions`, update the `&-btn` rule:

```scss
&-btn {
  padding: 0 24rpx;
  height: 52rpx;
  line-height: 52rpx;
  font-size: 24rpx;
  color: #333;
  background-color: #f0f0f0;
  border-radius: 26rpx;

  &::after {
    border: none;
  }
}
```

- [ ] **Step 4: Verify the build compiles**

Run: `cd F:/DieJiaTai/diyUseCanvans/DIY_crystal_bus && npx taro build --type weapp 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/DesignCanvas/index.scss
git commit -m "feat: add toolbox data section styles"
```

---

### Task 3: Update DiyPage - Pass Props and Remove PropertyPanel

**Files:**
- Modify: `src/pages/diy/index.tsx`
- Modify: `src/pages/diy/index.scss`

- [ ] **Step 1: Remove PropertyPanel import**

In `src/pages/diy/index.tsx`, remove this line:

```typescript
import PropertyPanel from '../../components/PropertyPanel'
```

- [ ] **Step 2: Pass new props to DesignCanvas**

In the `DesignCanvas` component usage (both empty and non-empty state), add the new props:

```tsx
<DesignCanvas
  bracelet={bracelet}
  selectedBeadIndex={selectedBeadIndex}
  onBeadSelect={handleBeadSelect}
  onBeadDelete={handleBeadDelete}
  onBeadMove={handleBeadMove}
  onSettingClick={() => setShowWristModal(true)}
  onClear={handleClearDesign}
  onSave={handleSaveDesign}
  onAddToCart={handleAddToCart}
  isSaving={isSavingDesign}
  isAddingToCart={isAddingToCart}
  disabled={bracelet.beads.length === 0}
  properties={properties}
  wristSize={wristSize}
  wearingStyle={wearingStyle}
/>
```

This applies to both the empty state `DesignCanvas` (around line 483) and the non-empty state `DesignCanvas` (around line 483 in the main return).

- [ ] **Step 3: Remove PropertyPanel section from JSX**

Remove this block from the JSX:

```tsx
{/* 属性面板 - 中间 */}
<View className='diy-page__properties'>
  <PropertyPanel properties={properties} />
</View>
```

- [ ] **Step 4: Remove PropertyPanel styles from DiyPage SCSS**

In `src/pages/diy/index.scss`, remove the `&__properties` block:

```scss
// 属性面板区域 - 紧凑的一行
&__properties {
  flex-shrink: 0;
  background: $bg-primary;
  margin: $spacing-sm $spacing-md 0;
  border-radius: $radius-sm;
  box-shadow: $shadow-sm;
}
```

- [ ] **Step 5: Verify the build compiles**

Run: `cd F:/DieJiaTai/diyUseCanvans/DIY_crystal_bus && npx taro build --type weapp 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/pages/diy/index.tsx src/pages/diy/index.scss
git commit -m "feat: pass property data to DesignCanvas, remove PropertyPanel"
```

---

### Task 4: Manual Verification

- [ ] **Step 1: Run dev server**

Run: `cd F:/DieJiaTai/diyUseCanvans/DIY_crystal_bus && npx taro build --type weapp --watch`
Expected: Dev server starts without errors

- [ ] **Step 2: Verify in WeChat DevTools**

1. Open the DIY page
2. Click the "工具箱" button
3. Verify the expansion shows: data row (数量/价格/重量/长度/最大周长) on top, buttons (清空/分享) below
4. Add beads and verify data updates in real-time
5. Click "清空" and verify it still works
6. Verify the PropertyPanel below the canvas is gone
7. Verify the "手围设置" button still works

- [ ] **Step 3: Final commit if any fixes needed**

If any adjustments were needed during verification, commit them:

```bash
git add -A
git commit -m "fix: toolbox data display adjustments"
```
