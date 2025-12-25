"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ChatContainer } from "@/components/messages/ChatContainer";
import { DesktopContainer } from "@/components/ui/desktop-container";
import { useChatSession } from "@/hooks/useChatSession";
import { useScrollScreenshot } from "@/hooks/useScrollScreenshot";
import { useParams, useRouter } from "next/navigation";
import { Role, TaskStatus } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalCircle01Icon,
  WavingHand01Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { VirtualDesktopStatus } from "@/components/VirtualDesktopStatusHeader";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    groupedMessages,
    taskStatus,
    control,
    input,
    setInput,
    isLoading,
    isLoadingSession,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    handleAddMessage,
    handleTakeOverTask,
    handleResumeTask,
    handleCancelTask,
    currentTaskId,
  } = useChatSession({ initialTaskId: taskId });

  // Determine if task is inactive (show screenshot) or active (show VNC)
  const isTaskInactive = useCallback((): boolean => {
    return (
      control === Role.ASSISTANT &&
      (taskStatus === TaskStatus.COMPLETED ||
        taskStatus === TaskStatus.FAILED ||
        taskStatus === TaskStatus.CANCELLED)
    );
  }, [control, taskStatus]);

  // Determine if user can take control
  function canTakeOver(): boolean {
    return control === Role.ASSISTANT && taskStatus === TaskStatus.RUNNING;
  }

  // Determine if user has control or is in takeover mode
  function hasUserControl(): boolean {
    return (
      control === Role.USER &&
      (taskStatus === TaskStatus.RUNNING ||
        taskStatus === TaskStatus.NEEDS_HELP)
    );
  }

  // Determine if task can be cancelled
  function canCancel(): boolean {
    return (
      taskStatus === TaskStatus.RUNNING || taskStatus === TaskStatus.NEEDS_HELP
    );
  }

  // Determine VNC mode - interactive when user has control, view-only otherwise
  function vncViewOnly(): boolean {
    return !hasUserControl();
  }

  // Use scroll screenshot hook for inactive tasks
  const { currentScreenshot } = useScrollScreenshot({
    messages,
    scrollContainerRef: chatContainerRef,
  });

  // For inactive tasks, auto-load all messages for proper screenshot navigation
  useEffect(() => {
    if (isTaskInactive() && hasMoreMessages && !isLoadingMoreMessages) {
      loadMoreMessages();
    }
  }, [
    isTaskInactive,
    hasMoreMessages,
    isLoadingMoreMessages,
    loadMoreMessages,
  ]);

  // Map each message ID to its flat index for screenshot scroll logic
  const messageIdToIndex = React.useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((msg, idx) => {
      map[msg.id] = idx;
    });
    return map;
  }, [messages]);

  // Redirect if task ID doesn't match current task
  useEffect(() => {
    if (currentTaskId && currentTaskId !== taskId) {
      router.push(`/tasks/${currentTaskId}`);
    }
  }, [currentTaskId, taskId, router]);

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(180deg, rgba(16,49,69,0.6) 0%, rgba(8,25,38,0.65) 100%), url('/home-bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }),
    [],
  );

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden px-4 py-6"
      style={backgroundStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/25" />

      <div className="drag-region relative z-10 w-full rounded-[36px] border border-white/20 bg-white/12 p-4 backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-2 text-white shadow-inner shadow-white/10">
            <span className="text-sm font-semibold">Navigation</span>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {[
              { href: "/", label: "Home" },
              { href: "/tasks", label: "Tasks" },
              { href: "/desktop", label: "Desktop" },
              { href: "/settings", label: "Settings" },
            ].map((item) => {
              const isActive = item.href === "/tasks";
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`no-drag rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#0f2d3c] shadow-lg shadow-white/50"
                      : "text-white/80 hover:bg-white/15"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-7">
          {/* Main container */}
          <div className="lg:col-span-4">
            <DesktopContainer
              screenshot={isTaskInactive() ? currentScreenshot : null}
              viewOnly={vncViewOnly()}
              status={
                (() => {
                  if (
                    taskStatus === TaskStatus.RUNNING &&
                    control === Role.USER
                  )
                    return "user_control";
                  if (taskStatus === TaskStatus.RUNNING) return "running";
                  if (taskStatus === TaskStatus.NEEDS_HELP)
                    return "needs_attention";
                  if (taskStatus === TaskStatus.FAILED) return "failed";
                  if (taskStatus === TaskStatus.CANCELLED) return "canceled";
                  if (taskStatus === TaskStatus.COMPLETED) return "completed";
                  return "pending";
                })() as VirtualDesktopStatus
              }
            >
              {canTakeOver() && (
                <Button
                  onClick={handleTakeOverTask}
                  variant="default"
                  size="sm"
                  icon={
                    <HugeiconsIcon
                      icon={WavingHand01Icon}
                      className="h-5 w-5"
                    />
                  }
                >
                  Take Over
                </Button>
              )}
              {hasUserControl() && (
                <Button onClick={handleResumeTask} variant="default" size="sm">
                  Proceed
                </Button>
              )}
              {canCancel() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <HugeiconsIcon
                        icon={MoreVerticalCircle01Icon}
                        className="text-bytebot-bronze-light-11 h-5 w-5"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleCancelTask}
                      className="text-red-600 focus:bg-red-50"
                    >
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </DesktopContainer>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex h-full min-h-0 flex-col rounded-[20px] border border-white/20 bg-white/10 backdrop-blur-xl shadow-inner shadow-white/10">
            <div
              ref={chatContainerRef}
              className="hide-scrollbar min-h-0 flex-1 overflow-scroll px-4 py-3"
            >
              <ChatContainer
                scrollRef={chatContainerRef}
                messageIdToIndex={messageIdToIndex}
                taskId={taskId}
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleAddMessage={handleAddMessage}
                groupedMessages={groupedMessages}
                taskStatus={taskStatus}
                control={control}
                isLoadingSession={isLoadingSession}
                isLoadingMoreMessages={isLoadingMoreMessages}
                hasMoreMessages={hasMoreMessages}
                loadMoreMessages={loadMoreMessages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
