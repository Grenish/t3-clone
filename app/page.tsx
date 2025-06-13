"use client";

import DefaultPage from "@/layouts/default/default-page";
import ReworkPage from "@/layouts/rework/rework-page";
import { useLayout } from "@/util/layout-provider";

export default function Home() {
  const { currentLayout } = useLayout();
  
  return (
    <>
      {currentLayout === "default" ? <DefaultPage /> : <ReworkPage />}
    </>
  );
}
