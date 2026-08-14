'use client';

import type { Message } from '@/types';
import { formatTime } from '@/utils/date';

// ------------------------------------------------------------------
// TICK ICONS
// ------------------------------------------------------------------
//  Signal uses ticks to show delivery status:
//  - Single tick (clock/check): sent to server
//  - Double tick (gray): delivered to recipient's device
//  - Double tick (blue): read by recipient
// ------------------------------------------------------------------

function SingleTick() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-label="Sent">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}

function DoubleTick({ isRead }: { isRead: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${isRead ? 'text-blue-400' : ''}`}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label={isRead ? 'Read' : 'Delivered'}
    >
      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
    </svg>
  );
}

// ------------------------------------------------------------------
// MESSAGE TICKS
// ------------------------------------------------------------------
//  Renders the correct tick icon(s) based on message status.
//  Only shown on messages the current user sent.
// ------------------------------------------------------------------

function MessageTicks({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sending':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Sending">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'sent':
      return <SingleTick />;
    case 'delivered':
      return <DoubleTick isRead={false} />;
    case 'read':
      return <DoubleTick isRead={true} />;
    default:
      return null;
  }
}

// ------------------------------------------------------------------
// MESSAGE BUBBLE
// ------------------------------------------------------------------
//  The core chat bubble. Props:
//    message  - The message data
//    isOwn    - True if current user sent it (right-aligned, blue)
//    showName - True in groups to show the sender's name (received)
// ------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showName?: boolean;
}

export function MessageBubble({ message, isOwn, showName = false }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${
          isOwn ? 'bg-[#2c6bed] text-white' : 'bg-[#e4e6eb] text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {showName && (
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {message.sender_name}
          </p>
        )}

        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Timestamp + delivery ticks (Signal places these bottom-right) */}
        <div
          className={`mt-1 flex items-center justify-end gap-1 ${
            isOwn ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <span className="text-[11px] leading-none">
            {formatTime(message.timestamp)}
          </span>
          {isOwn && <MessageTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}
