"use client";

import { useEffect } from "react";

export function ProjectViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    fetch(`/api/projects/${projectId}/view`, { method: "POST" }).catch(() => {});
  }, [projectId]);

  return null;
}
