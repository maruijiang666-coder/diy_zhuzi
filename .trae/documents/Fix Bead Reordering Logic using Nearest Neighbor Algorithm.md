I will fix the bead reordering issues (unidirectional movement and inaccuracy) by replacing the "Sector-based" algorithm with a "Nearest Neighbor" algorithm in `handleContainerTouchEnd`.

### **Technical Plan**

#### **Problem Analysis**
The current implementation uses `Math.floor(normalizedAngle / sectorAngle)` to determine the insertion index. This approach has two flaws causing the reported bugs:
1.  **Inaccuracy**: It assumes beads are perfectly uniformly distributed and maps absolute angles to indices, ignoring the actual positions of the non-dragged beads.
2.  **Unidirectional Bias**: The sector mapping doesn't account for the "gap" nature of insertion. Moving a bead slightly clockwise into the next sector might map to the same index as before or skip an index depending on the `splice` behavior, creating a feeling that it "only works one way" or is unresponsive.

#### **Solution: Nearest Neighbor Algorithm**
I will rewrite the reordering logic in `src/components/DesignCanvas/index.tsx`:

1.  **Reference Frame**: Use the `visualBeadsRef.current` (which contains the stable, displayed positions of non-dragged beads) instead of theoretical angles.
2.  **Logic**:
    *   Iterate through all *other* beads (excluding the dragged one).
    *   Calculate the angular difference between the drop point and each bead.
    *   Identify the **closest bead**.
    *   Determine if the drop point is **clockwise** or **counter-clockwise** relative to that closest bead.
    *   Calculate `insertIndex` based on this relative position:
        *   If Clockwise: Insert *after* the closest bead.
        *   If Counter-Clockwise: Insert *before* the closest bead.
3.  **Edge Case Handling**: Properly handle the 0/360 degree boundary when calculating angular differences.

### **Implementation Steps**
1.  **Modify `handleContainerTouchEnd`**:
    *   Remove the `sectorAngle` calculation.
    *   Implement the loop to find `closestBeadIndex` (in the `otherBeads` array) and `minDiff`.
    *   Calculate `insertIndex` dynamically based on the sign of `diff`.
    *   Update `onBeadMove` and animation logic to use this robust index.

This change ensures that wherever the user drops the bead, it will snap to the visually most logical gap, fixing both the direction and accuracy issues.
