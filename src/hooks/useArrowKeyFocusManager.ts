import {useCallback, useEffect, useMemo, useState} from 'react';
import CONST from '@src/CONST';
import useKeyboardShortcut from './useKeyboardShortcut';

type Config = {
    maxIndex: number;
    onFocusedIndexChange?: (index: number) => void;
    initialFocusedIndex?: number;
    disabledIndexes?: readonly number[];
    shouldExcludeTextAreaNodes?: boolean;
    isActive?: boolean;
    itemsPerRow?: number;
    disableCyclicTraversal?: boolean;
};

type UseArrowKeyFocusManager = [number, (index: number) => void];

/**
 * A hook that makes it easy to use the arrow keys to manage focus of items in a list
 *
 * Recommendation: To ensure stability, wrap the `onFocusedIndexChange` function with the useCallback hook before using it with this hook.
 *
 * @param config.maxIndex – typically the number of items in your list
 * @param [config.onFocusedIndexChange] – optional callback to execute when focusedIndex changes
 * @param [config.initialFocusedIndex] – where to start in the list
 * @param [config.disabledIndexes] – An array of indexes to disable + skip over
 * @param [config.shouldExcludeTextAreaNodes] – Whether arrow keys should have any effect when a TextArea node is focused
 * @param [config.isActive] – Whether the component is ready and should subscribe to KeyboardShortcut
 * @param [config.itemsPerRow] – The number of items per row. If provided, the arrow keys will move focus horizontally as well as vertically
 * @param [config.disableCyclicTraversal] – Whether to disable cyclic traversal of the list. If true, the arrow keys will have no effect when the first or last item is focused
 */
export default function useArrowKeyFocusManager({
    maxIndex,
    onFocusedIndexChange = () => {},
    initialFocusedIndex = 0,

    // The "disabledIndexes" array needs to be stable to prevent the "useCallback" hook from being recreated unnecessarily.
    // Hence the use of CONST.EMPTY_ARRAY.
    disabledIndexes = CONST.EMPTY_ARRAY,
    shouldExcludeTextAreaNodes = true,
    isActive,
    itemsPerRow,
    disableCyclicTraversal = false,
}: Config): UseArrowKeyFocusManager {
    const allowHorizontalArrowKeys = !!itemsPerRow;
    const [focusedIndex, setFocusedIndex] = useState(initialFocusedIndex);
    const arrowConfig = useMemo(
        () => ({
            excludedNodes: shouldExcludeTextAreaNodes ? ['TEXTAREA'] : [],
            isActive,
        }),
        [isActive, shouldExcludeTextAreaNodes],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => onFocusedIndexChange(focusedIndex), [focusedIndex]);

    const arrowUpCallback = useCallback(() => {
        if (maxIndex < 0) {
            return;
        }
        const nextIndex = disableCyclicTraversal ? -1 : maxIndex;

        setFocusedIndex((actualIndex) => {
            let currentFocusedIndex = -1;
            if (allowHorizontalArrowKeys) {
                currentFocusedIndex = actualIndex > 0 ? actualIndex - itemsPerRow : nextIndex;
            } else {
                currentFocusedIndex = actualIndex > 0 ? actualIndex - 1 : nextIndex;
            }
            let newFocusedIndex = currentFocusedIndex;

            while (disabledIndexes.includes(newFocusedIndex)) {
                newFocusedIndex -= allowHorizontalArrowKeys ? itemsPerRow : 1;
                if (newFocusedIndex < 0) {
                    break;
                }
                if (newFocusedIndex === currentFocusedIndex) {
                    // all indexes are disabled
                    return actualIndex; // no-op
                }
            }
            return newFocusedIndex;
        });
    }, [allowHorizontalArrowKeys, disableCyclicTraversal, disabledIndexes, itemsPerRow, maxIndex]);

    useKeyboardShortcut(CONST.KEYBOARD_SHORTCUTS.ARROW_UP, arrowUpCallback, arrowConfig);

    const arrowDownCallback = useCallback(() => {
        if (maxIndex < 0) {
            return;
        }

        const nextIndex = disableCyclicTraversal ? maxIndex : 0;

        setFocusedIndex((actualIndex) => {
            let currentFocusedIndex = -1;

            if (actualIndex === -1) {
                currentFocusedIndex = 0;
            } else if (allowHorizontalArrowKeys) {
                currentFocusedIndex = actualIndex < maxIndex ? actualIndex + itemsPerRow : nextIndex;
            } else {
                currentFocusedIndex = actualIndex < maxIndex ? actualIndex + 1 : nextIndex;
            }

            if (disableCyclicTraversal && currentFocusedIndex > maxIndex) {
                return actualIndex;
            }

            let newFocusedIndex = currentFocusedIndex;
            while (disabledIndexes.includes(newFocusedIndex)) {
                if (actualIndex < 0) {
                    newFocusedIndex += 1;
                } else {
                    newFocusedIndex += allowHorizontalArrowKeys ? itemsPerRow : 1;
                }

                if (newFocusedIndex < 0) {
                    break;
                }
                if (newFocusedIndex === currentFocusedIndex) {
                    // all indexes are disabled
                    return actualIndex;
                }
            }
            return newFocusedIndex;
        });
    }, [allowHorizontalArrowKeys, disableCyclicTraversal, disabledIndexes, itemsPerRow, maxIndex]);

    useKeyboardShortcut(CONST.KEYBOARD_SHORTCUTS.ARROW_DOWN, arrowDownCallback, arrowConfig);

    const arrowLeftCallback = useCallback(() => {
        if (maxIndex < 0 || !allowHorizontalArrowKeys) {
            return;
        }

        const nextIndex = disableCyclicTraversal ? -1 : maxIndex;

        setFocusedIndex((actualIndex) => {
            let currentFocusedIndex = -1;
            currentFocusedIndex = actualIndex > 0 ? actualIndex - 1 : nextIndex;

            let newFocusedIndex = currentFocusedIndex;

            while (disabledIndexes.includes(newFocusedIndex)) {
                newFocusedIndex = newFocusedIndex > 0 ? newFocusedIndex - 1 : nextIndex;

                if (newFocusedIndex === currentFocusedIndex) {
                    // all indexes are disabled
                    return actualIndex; // no-op
                }
            }
            return newFocusedIndex;
        });
    }, [allowHorizontalArrowKeys, disableCyclicTraversal, disabledIndexes, maxIndex]);

    useKeyboardShortcut(CONST.KEYBOARD_SHORTCUTS.ARROW_LEFT, arrowLeftCallback, arrowConfig);

    const arrowRightCallback = useCallback(() => {
        if (maxIndex < 0 || !allowHorizontalArrowKeys) {
            return;
        }

        const nextIndex = disableCyclicTraversal ? maxIndex : 0;

        setFocusedIndex((actualIndex) => {
            let currentFocusedIndex = -1;
            currentFocusedIndex = actualIndex < maxIndex ? actualIndex + 1 : nextIndex;

            let newFocusedIndex = currentFocusedIndex;

            while (disabledIndexes.includes(newFocusedIndex)) {
                newFocusedIndex = newFocusedIndex < maxIndex ? newFocusedIndex + 1 : nextIndex;

                if (newFocusedIndex === currentFocusedIndex) {
                    // all indexes are disabled
                    return actualIndex;
                }
            }
            return newFocusedIndex;
        });
    }, [allowHorizontalArrowKeys, disableCyclicTraversal, disabledIndexes, maxIndex]);

    useKeyboardShortcut(CONST.KEYBOARD_SHORTCUTS.ARROW_RIGHT, arrowRightCallback, arrowConfig);

    // Note: you don't need to manually manage focusedIndex in the parent. setFocusedIndex is only exposed in case you want to reset focusedIndex or focus a specific item
    return [focusedIndex, setFocusedIndex];
}
