"use client";

import { useTournament } from "@/lib/context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, ArrowRightLeft, Timer, UserPlus as UserPlusIcon, AlertCircle, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification, NotificationType } from "@/lib/types";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "redraw":
      return <ArrowRightLeft className="h-4 w-4 text-amber-400" />;
    case "level":
      return <Timer className="h-4 w-4 text-blue-400" />;
    case "registration":
      return <UserPlusIcon className="h-4 w-4 text-emerald-400" />;
    case "action":
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    case "alert":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  return (
    <button
      onClick={onRead}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex gap-3",
        !notification.read && "bg-accent/20"
      )}
    >
      <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn("text-sm", !notification.read ? "font-medium" : "text-muted-foreground")}>
            {notification.title}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatTimeAgo(notification.timestamp)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
      </div>
      {!notification.read && (
        <div className="mt-2 shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
        </div>
      )}
    </button>
  );
}

export function NotificationPanel() {
  const {
    tournamentNotifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useTournament();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
          {unreadNotificationCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-blue-500 text-white border-0"
            >
              {unreadNotificationCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] sm:max-w-[400px] p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadNotificationCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 h-7"
                onClick={markAllNotificationsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {tournamentNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {/* Unread */}
              {tournamentNotifications.filter((n) => !n.read).length > 0 && (
                <>
                  <p className="px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    New
                  </p>
                  {tournamentNotifications
                    .filter((n) => !n.read)
                    .map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={() => markNotificationRead(n.id)}
                      />
                    ))}
                </>
              )}

              {/* Read */}
              {tournamentNotifications.filter((n) => n.read).length > 0 && (
                <>
                  <Separator />
                  <p className="px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Earlier
                  </p>
                  {tournamentNotifications
                    .filter((n) => n.read)
                    .map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={() => {}}
                      />
                    ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
