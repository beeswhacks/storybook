import { useCallback, useEffect, useMemo, useRef } from 'react';

import { debounce } from 'es-toolkit/function';
import store from 'store2';

import type { Selection, StoryRef } from './types';

const save = debounce((value) => store.set('lastViewedStoryIds', value), 1000);

export const useLastViewed = (selection: Selection) => {
  const initialLastViewedStoryIds = useMemo((): StoryRef[] => {
    const items = store.get('lastViewedStoryIds');

    if (!items || !Array.isArray(items)) {
      return [];
    }

    if (!items.some((item) => typeof item === 'object' && item.storyId && item.refId)) {
      return [];
    }
    return items;
  }, [store]);

  const lastViewedRef = useRef(initialLastViewedStoryIds);

  const updateLastViewed = useCallback(
    (story: StoryRef) => {
      const items = lastViewedRef.current;
      const index = items.findIndex(
        ({ storyId, refId, anchor }) =>
          storyId === story.storyId && refId === story.refId && anchor === story.anchor
      );

      if (index === 0) {
        return;
      }
      if (index === -1) {
        // When arriving from URL selection (no anchor), don't duplicate an existing
        // anchor-bearing entry that already sits at position 0 for this story.
        if (
          !story.anchor &&
          items[0]?.storyId === story.storyId &&
          items[0]?.refId === story.refId &&
          items[0]?.anchor
        ) {
          return;
        }
        lastViewedRef.current = [story, ...items];
      } else {
        lastViewedRef.current = [story, ...items.slice(0, index), ...items.slice(index + 1)];
      }
      save(lastViewedRef.current);
    },
    [lastViewedRef]
  );

  useEffect(() => {
    if (selection) {
      updateLastViewed(selection);
    }
  }, [selection]);

  return {
    getLastViewed: useCallback(() => lastViewedRef.current, [lastViewedRef]),
    updateLastViewed,
    clearLastViewed: useCallback(() => {
      lastViewedRef.current = lastViewedRef.current.slice(0, 1);
      save(lastViewedRef.current);
    }, [lastViewedRef]),
  };
};
