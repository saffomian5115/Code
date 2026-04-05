import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  MessageSquare,
  Loader2,
  Users,
  Trash2,
  X,
  Search,
  Hash,
  ChevronRight,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { teacherAPI } from "../../api/teacher.api";
import { authStore } from "../../store/authStore";

const POLL_MS = 5000;

/* ─── helpers ─────────────────────────────────────────────── */
function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function formatTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(d) {
  const dt = new Date(d);
  const today = new Date();
  const diff = Math.floor((today - dt) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return dt.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/* Color per group initial */
const GROUP_COLORS = [
  "#5b8af0",
  "#a78bfa",
  "#34d399",
  "#f59e0b",
  "#f87171",
  "#38bdf8",
  "#fb923c",
  "#ec4899",
];
const getGroupColor = (name = "") =>
  GROUP_COLORS[Math.abs((name.charCodeAt(0) || 0) % GROUP_COLORS.length)];

const AVATAR_COLORS = [
  "#5b8af0",
  "#a78bfa",
  "#3ecf8e",
  "#f97316",
  "#f26b6b",
  "#38bdf8",
  "#f59e0b",
];
const getAvatarColor = (name = "") =>
  AVATAR_COLORS[Math.abs((name.charCodeAt(0) || 0) % AVATAR_COLORS.length)];

/* ─── Neu helpers ─────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: "var(--neu-surface)",
  boxShadow: "var(--neu-raised)",
  border: "1px solid var(--neu-border)",
  borderRadius: "1.25rem",
  ...extra,
});
const neuInset = (extra = {}) => ({
  background: "var(--neu-surface-deep)",
  boxShadow:
    "inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)",
  border: "1px solid var(--neu-border)",
  borderRadius: "0.875rem",
  ...extra,
});

/* ─── Message Bubble ──────────────────────────────────────── */
function MessageBubble({ msg, isOwn, showAvatar, showName, onDelete }) {
  const [hov, setHov] = useState(false);

  if (msg.message_type === "system")
    return (
      <div style={{ textAlign: "center", margin: "0.25rem 0" }}>
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--neu-text-ghost)",
            background: "var(--neu-surface-deep)",
            padding: "0.25rem 0.85rem",
            borderRadius: "999px",
            boxShadow:
              "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)",
          }}
        >
          {msg.message}
        </span>
      </div>
    );

  const avatarColor = getAvatarColor(msg.sender_name || "");

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "0.5rem",
        marginBottom: showAvatar ? "0.15rem" : "0.05rem",
        animation: "fadeUp 0.25s ease both",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          flexShrink: 0,
          background: isOwn ? "transparent" : avatarColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 800,
          color: "#fff",
          opacity: showAvatar && !isOwn ? 1 : 0,
          boxShadow: `3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)`,
          fontFamily: "Outfit,sans-serif",
        }}
      >
        {(msg.sender_name || "?")[0].toUpperCase()}
      </div>

      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
          gap: "0.2rem",
        }}
      >
        {/* Sender name */}
        {showName && !isOwn && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: avatarColor,
              marginLeft: "0.3rem",
              letterSpacing: "0.02em",
            }}
          >
            {msg.sender_name}
          </span>
        )}

        {/* Bubble */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            gap: "0.4rem",
            flexDirection: isOwn ? "row-reverse" : "row",
          }}
        >
          <div
            style={{
              padding: "0.6rem 0.95rem",
              borderRadius: isOwn
                ? "1.1rem 1.1rem 0.3rem 1.1rem"
                : "1.1rem 1.1rem 1.1rem 0.3rem",
              fontSize: "0.84rem",
              lineHeight: 1.55,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              ...(isOwn
                ? {
                    background: "linear-gradient(145deg,#5b8af0,#3a6bd4)",
                    color: "#fff",
                    boxShadow:
                      "5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 3px 12px rgba(91,138,240,0.35)",
                  }
                : {
                    background: "var(--neu-surface)",
                    color: "var(--neu-text-primary)",
                    boxShadow:
                      "5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                    border: "1px solid var(--neu-border)",
                  }),
            }}
          >
            {msg.message}
          </div>

          {/* Delete btn */}
          {isOwn && (
            <button
              onClick={() => onDelete(msg.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "none",
                background: "rgba(242,107,107,0.15)",
                color: "#f26b6b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: hov ? 1 : 0,
                transition: "opacity 0.15s, transform 0.12s",
                flexShrink: 0,
                marginBottom: "0.1rem",
                boxShadow:
                  "2px 2px 6px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.15)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Time */}
        <span
          style={{
            fontSize: "0.62rem",
            color: "var(--neu-text-ghost)",
            margin: isOwn ? "0 0.3rem 0 0" : "0 0 0 0.3rem",
          }}
        >
          {formatTime(msg.sent_at)}
        </span>
      </div>
    </div>
  );
}

/* ─── Date Divider ────────────────────────────────────────── */
function DateDivider({ date }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        margin: "0.75rem 0",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "var(--neu-border)" }} />
      <span
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          color: "var(--neu-text-ghost)",
          background: "var(--neu-surface-deep)",
          padding: "0.2rem 0.75rem",
          borderRadius: "999px",
          boxShadow:
            "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)",
          whiteSpace: "nowrap",
        }}
      >
        {formatDateDivider(date)}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--neu-border)" }} />
    </div>
  );
}

/* ─── Group List Item ─────────────────────────────────────── */
function GroupItem({ group, active, onClick }) {
  const [hov, setHov] = useState(false);
  const color = getGroupColor(group.name || "");
  const isActive = active?.id === group.id;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        padding: "0.75rem 1rem",
        borderRadius: "0.875rem",
        fontFamily: "'DM Sans',sans-serif",
        transition: "all 0.18s",
        background: isActive ? "var(--neu-surface)" : "transparent",
        boxShadow: isActive
          ? `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.5)`
          : hov
            ? "2px 2px 6px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)"
            : "none",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        transform: hov && !isActive ? "translateX(2px)" : "",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "0.875rem",
          flexShrink: 0,
          background: isActive ? color : `${color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          fontWeight: 800,
          color: isActive ? "#fff" : color,
          fontFamily: "Outfit,sans-serif",
          boxShadow: isActive
            ? `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 2px 10px ${color}44`
            : "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)",
          transition: "all 0.18s",
        }}
      >
        {(group.name || "?")[0].toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.82rem",
            fontWeight: isActive ? 700 : 600,
            color: isActive
              ? "var(--neu-text-primary)"
              : "var(--neu-text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "0.15rem",
          }}
        >
          {group.name}
        </p>
        
      </div>

      {isActive && <ChevronRight size={14} style={{ color, flexShrink: 0 }} />}
    </button>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function ChatPage() {
  const user = authStore.getUser();
  const currentUserId = user?.user_id;

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);

  const endRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  /* Load groups - FIXED: Better error handling and logging */
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const response = await teacherAPI.getChatGroups();
        console.log("Groups response:", response.data);
        const groupsData = response.data.data?.groups || [];
        setGroups(groupsData);
        if (groupsData.length === 0) {
          toast.error("No groups found");
        }
      } catch (error) {
        console.error("Failed to load groups:", error);
        toast.error(error.response?.data?.message || "Failed to load groups");
      } finally {
        setGroupsLoading(false);
      }
    };
    loadGroups();
  }, []);

  /* Fetch messages */
  const fetchMessages = useCallback(async (gid, init = false) => {
    if (!gid) return;
    if (init) setMsgLoading(true);
    try {
      const res = await teacherAPI.getChatMessages(gid);
      const msgs = res.data.data?.messages || [];
      setMessages(msgs);
      setOnline(true);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setOnline(false);
    } finally {
      if (init) setMsgLoading(false);
    }
  }, []);

  /* Poll on group select */
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selected) return;
    fetchMessages(selected.id, true);
    pollRef.current = setInterval(() => fetchMessages(selected.id), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [selected, fetchMessages]);

  /* Handle scroll - user scrolled up manually */
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsUserScrolledUp(!isAtBottom);
    }
  }, []);

  /* Auto-scroll logic - FIXED: Only scroll when user is at bottom */
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  useEffect(() => {
    const hasNewMessage = messages.length !== prevMessagesLength;
    
    // Auto-scroll only if:
    // 1. There's a new message AND
    // 2. User is NOT scrolled up (or it's the first load)
    if (hasNewMessage && !isUserScrolledUp && messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    setPrevMessagesLength(messages.length);
  }, [messages, isUserScrolledUp, prevMessagesLength]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  /* Send message */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    
    setSending(true);
    const optimistic = {
      id: `opt_${Date.now()}`,
      message: text,
      sender_id: currentUserId,
      sender_name: user?.full_name || user?.name || "You",
      sent_at: new Date().toISOString(),
      message_type: "text",
      _optimistic: true,
    };
    
    setMessages((p) => [...p, optimistic]);
    setInput("");
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    
    try {
      await teacherAPI.sendMessage(selected.id, {
        message: text,
        message_type: "text",
      });
      await fetchMessages(selected.id);
      inputRef.current?.focus();
    } catch (err) {
      setMessages((p) => p.filter((m) => m.id !== optimistic.id));
      setInput(text);
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await teacherAPI.deleteMessage(msgId);
      setMessages((p) => p.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Filtered groups */
  const visibleGroups = groups.filter(
    (g) => !searchQ || g.name?.toLowerCase().includes(searchQ.toLowerCase())
  );

  /* Group messages by date for dividers */
  const groupedMessages = messages.reduce((acc, msg, idx) => {
    const prevDate = idx > 0 ? new Date(messages[idx - 1].sent_at).toDateString() : null;
    const thisDate = new Date(msg.sent_at).toDateString();
    if (thisDate !== prevDate) {
      acc.push({ type: "divider", date: msg.sent_at, id: `d_${msg.sent_at}` });
    }
    acc.push(msg);
    return acc;
  }, []);

  const selectedColor = selected ? getGroupColor(selected.name || "") : "#5b8af0";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--neu-bg)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: var(--neu-shadow-dark); border-radius: 4px; }
        .msg-scroll::-webkit-scrollbar { width: 5px; }
        .msg-scroll::-webkit-scrollbar-track { background: transparent; }
        .msg-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 5px; }
      `}</style>

      {/* Main container - Full height chat layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* ════ LEFT: Group Sidebar ════ */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--neu-border)",
            background: "var(--neu-surface-deep)",
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: "1.25rem 1rem 0.85rem",
              borderBottom: "1px solid var(--neu-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "0.75rem",
                  background: "rgba(91,138,240,0.12)",
                  color: "#5b8af0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)",
                }}
              >
                <MessageSquare size={16} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: "var(--neu-text-primary)",
                    fontFamily: "Outfit,sans-serif",
                  }}
                >
                  Class Chats
                </p>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--neu-text-ghost)",
                  }}
                >
                  {groups.length} {groups.length === 1 ? "group" : "groups"}
                </p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--neu-text-ghost)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search groups..."
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem 0.55rem 2rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "var(--neu-surface)",
                  boxShadow:
                    "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)",
                  fontSize: "0.8rem",
                  color: "var(--neu-text-primary)",
                  outline: "none",
                  fontFamily: "'DM Sans',sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Group list - THIS IS WHERE GROUPS ARE DISPLAYED */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.65rem" }}
            className="msg-scroll"
          >
            {groupsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Loader2 size={24} style={{ color: "#5b8af0", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : visibleGroups.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <MessageSquare size={28} style={{ color: "var(--neu-text-ghost)", marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.8rem", color: "var(--neu-text-ghost)" }}>
                  {searchQ ? "No matching groups" : "No groups available"}
                </p>
              </div>
            ) : (
              visibleGroups.map((g) => (
                <GroupItem
                  key={g.id}
                  group={g}
                  active={selected}
                  onClick={() => setSelected(g)}
                />
              ))
            )}
          </div>
          
          {/* Connection status */}
          <div
            style={{
              padding: "0.6rem 1rem",
              borderTop: "1px solid var(--neu-border)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {online ? (
              <>
                <Wifi size={12} style={{ color: "#34d399" }} />
                <span style={{ fontSize: "0.65rem", color: "var(--neu-text-ghost)" }}>Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={12} style={{ color: "#f87171" }} />
                <span style={{ fontSize: "0.65rem", color: "#f87171" }}>Reconnecting...</span>
              </>
            )}
          </div>
        </div>

        {/* ════ RIGHT: Chat Area ════ */}
        {!selected ? (
          /* Empty state - No group selected */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              background: "var(--neu-surface-deep)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "1.5rem",
                background: "rgba(91,138,240,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)",
              }}
            >
              <MessageSquare size={34} style={{ color: "#5b8af0" }} />
            </div>
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--neu-text-secondary)",
                fontFamily: "Outfit,sans-serif",
              }}
            >
              Select a Chat
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--neu-text-ghost)" }}>
              Choose a class group from the sidebar to start chatting
            </p>
            {groups.length > 0 && groups.length <= 3 && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                {groups.slice(0, 3).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g)}
                    style={{
                      padding: "0.4rem 0.9rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      background: "var(--neu-surface)",
                      boxShadow: "var(--neu-raised)",
                      color: "var(--neu-text-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Active Chat View */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              background: "var(--neu-surface-deep)",
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: "0.9rem 1.25rem",
                borderBottom: "1px solid var(--neu-border)",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                background: "var(--neu-surface)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "0.875rem",
                  background: selectedColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "Outfit,sans-serif",
                  boxShadow: `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 3px 12px ${selectedColor}44`,
                  flexShrink: 0,
                }}
              >
                {(selected.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--neu-text-primary)",
                    fontFamily: "Outfit,sans-serif",
                  }}
                >
                  {selected.name}
                </p>
                
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="msg-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.1rem",
              }}
            >
              {msgLoading && messages.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    gap: "0.65rem",
                  }}
                >
                  <Loader2
                    size={28}
                    style={{ color: "#5b8af0", animation: "spin 0.8s linear infinite" }}
                  />
                  <p style={{ fontSize: "0.78rem", color: "var(--neu-text-ghost)" }}>
                    Loading messages...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "1rem",
                      background: `${selectedColor}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow:
                        "inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)",
                    }}
                  >
                    <Hash size={24} style={{ color: selectedColor }} />
                  </div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "var(--neu-text-secondary)",
                    }}
                  >
                    No messages yet
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--neu-text-ghost)" }}>
                    Be the first to say something!
                  </p>
                </div>
              ) : (
                groupedMessages.map((item, idx) => {
                  if (item.type === "divider")
                    return <DateDivider key={item.id} date={item.date} />;

                  const isOwn = item.sender_id === currentUserId;
                  // Find prev and next for avatar/name logic
                  const msgIndex = messages.findIndex(m => m.id === item.id);
                  const prev = msgIndex > 0 ? messages[msgIndex - 1] : null;
                  const next = msgIndex < messages.length - 1 ? messages[msgIndex + 1] : null;
                  const showAvatar =
                    !next ||
                    next.sender_id !== item.sender_id ||
                    next.message_type === "system";
                  const showName =
                    !prev ||
                    prev.sender_id !== item.sender_id ||
                    prev.message_type === "system";

                  return (
                    <MessageBubble
                      key={item.id || idx}
                      msg={item}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showName}
                      onDelete={handleDelete}
                    />
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: "0.85rem 1.1rem",
                borderTop: "1px solid var(--neu-border)",
                background: "var(--neu-surface)",
                display: "flex",
                alignItems: "flex-end",
                gap: "0.65rem",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  ...neuInset({ borderRadius: "1rem", padding: 0 }),
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKey}
                  placeholder={`Message ${selected.name}...`}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    padding: "0.7rem 0.95rem",
                    fontSize: "0.85rem",
                    color: "var(--neu-text-primary)",
                    fontFamily: "'DM Sans',sans-serif",
                    lineHeight: 1.55,
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "0.875rem",
                  border: "none",
                  flexShrink: 0,
                  background:
                    input.trim() && !sending
                      ? `linear-gradient(145deg,${selectedColor},${selectedColor}cc)`
                      : "var(--neu-surface-deep)",
                  boxShadow:
                    input.trim() && !sending
                      ? `5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px ${selectedColor}44`
                      : "inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)",
                  color: input.trim() && !sending ? "#fff" : "var(--neu-text-ghost)",
                  cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !sending)
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
              >
                {sending ? (
                  <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <Send size={18} style={{ transform: "translateX(1px)" }} />
                )}
              </button>
            </div>
            
            
          </div>
        )}
      </div>
    </div>
  );
}