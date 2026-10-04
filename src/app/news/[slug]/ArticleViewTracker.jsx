'use client';

import { useEffect } from 'react';

export default function ArticleViewTracker({ slug }) {
  useEffect(() => {
    if (slug) {
      fetch(`/api/articles/${slug}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [slug]);

  return null;
}
