I will implement the interactive drag-and-drop feature for beads using a **data-driven React approach** that strictly follows your three-layer architecture (Interaction, Drawing, Animation).

### **Plan Details**

#### **1. Interaction Layer (Touch Logic)**
I will refactor the `DesignCanvas` component to centralize touch handling on the container level, implementing your specific algorithms:
-   **Touch Start**:
    -   Bind to container `onTouchStart`.
    -   **Hit Test**: Calculate Euclidean distance between touch point and each bead's center. If `distance ≤ radius`, identify the target bead.
    -   **Long Press Timer**: Set a 300ms timer. If movement stays within 10px, trigger "Selection Mode" (vibrate + semi-transparent visual).
-   **Touch Move**:
    -   **Drag Follow**: If a bead is selected, update its coordinates to `Touch (x, y) - Offset (0, 20px)` directly.
    -   **Boundary Check**: Clamp coordinates within the canvas radius.
    -   **Force Render**: Trigger a re-render immediately to update the bead's position.
-   **Touch End (Release)**:
    -   **Reorder Logic**: Calculate the angle of the drop point relative to the center.
    -   **Data Manipulation**: Remove the bead from the old index and insert it at the new index based on the angle.
    -   **Target Calculation**: Recalculate the ideal "Target Coordinates" for *all* beads based on uniform distribution ($360^\circ / N$).
    -   **Trigger Animation**: Enter the "Animation State".

#### **2. Drawing Layer (Rendering)**
I will replace the current CSS-based transition logic with a pure data-mapping render function:
-   **State Structure**: Maintain a `visualBeads` state that holds `{ x, y, opacity, scale }` for every bead.
-   **Render Function**: Map `visualBeads` to `<View>` components.
    -   **Normal**: Render at current `(x, y)` with full opacity.
    -   **Selected**: Render at drag `(x, y)` with lower opacity.
    -   **Animating**: Render at the interpolated `(x, y)` from the animation loop.
-   **Clean Rendering**: Remove all `transition` CSS properties to ensure the JS loop has full control.

#### **3. Animation Layer (JS Interpolation)**
I will implement a custom animation loop to replace CSS transitions:
-   **Animation Loop**: Use `requestAnimationFrame` (or `setTimeout` fallback for Taro).
-   **Interpolation**: On each frame, update every bead's position:
    $$Current = Current + (Target - Current) \times 0.1$$
-   **Termination**: Stop the loop when `|Target - Current| ≤ 1px` for all beads.

### **Files to Modify**
-   `src/components/DesignCanvas/index.tsx`: Major refactor of touch handlers and rendering logic.
-   `src/components/DesignCanvas/index.scss`: Remove CSS transitions and simplify styles.
