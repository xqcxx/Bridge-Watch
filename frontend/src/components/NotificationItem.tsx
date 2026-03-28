import React from "react";
import { Link } from "react-router-dom";
import { Notification } from "../context/NotificationContext";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const typeIcons = {
  alert: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  system: (
    <svg className="w-5 h-5 text-stellar-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const content = (
    <div 
      className={`p-4 transition-colors hover:bg-stellar-card-hover border-b border-stellar-border ${notification.read ? "opacity-75" : ""}`}
      onClick={() => onRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {typeIcons[notification.type]}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <h4 className={`text-sm font-semibold truncate ${notification.read ? "text-stellar-text-secondary" : "text-white"}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="w-2 h-2 mt-1.5 bg-stellar-blue rounded-full"></span>
            )}
          </div>
          <p className="text-sm text-stellar-text-secondary mt-1 line-clamp-2">
            {notification.message}
          </p>
          <span className="text-xs text-stellar-text-muted mt-2 block">
            {new Date(notification.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
