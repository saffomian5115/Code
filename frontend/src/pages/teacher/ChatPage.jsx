import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  MessageSquare,
  Loader2,
  Users,
  BookOpen,
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
  GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length];

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
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

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
        <p
          style={{
            fontSize: "0.68rem",
            color: "var(--neu-text-ghost)",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Users size={10} /> {group.member_count || 0} members
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
  const lastMsgIdRef = useRef(null);

  /* Load groups */
  useEffect(() => {
    teacherAPI
      .getChatGroups()
      .then((r) => setGroups(r.data.data?.groups || []))
      .catch(() => toast.error("Failed to load groups"))
      .finally(() => setGroupsLoading(false));
  }, []);

  /* Fetch messages */
  const fetchMessages = useCallback(async (gid, init = false) => {
    if (!gid) return;
    if (init) setMsgLoading(true);
    try {
      const res = await teacherAPI.getChatMessages(gid);
      const msgs = res.data.data?.messages || [];
      setMessages(msgs);
      if (msgs.length) lastMsgIdRef.current = msgs[msgs.length - 1]?.id;
      setOnline(true);
    } catch {
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
  }, [selected]);

  /* Auto scroll */
  // Replace your existing auto-scroll useEffect with this:

  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const messagesContainerRef = useRef(null);

  // Track if user has scrolled up manually
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsUserScrolledUp(!isAtBottom);
    }
  }, []);

  // Auto-scroll only when new message arrives AND user is not scrolled up
  useEffect(() => {
    const hasNewMessage = messages.length !== prevMessagesLength;

    // Only scroll if:
    // 1. There's a new message
    // 2. User is NOT intentionally scrolled up
    // 3. Or it's the first message (prevLength was 0)
    if (hasNewMessage && !isUserScrolledUp) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    setPrevMessagesLength(messages.length);
  }, [messages, isUserScrolledUp]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  /* Send */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    const optimistic = {
      id: `opt_${Date.now()}`,
      message: text,
      sender_id: currentUserId,
      sender_name: user?.name || "You",
      sent_at: new Date().toISOString(),
      message_type: "text",
      _optimistic: true,
    };
    setMessages((p) => [...p, optimistic]);
    setInput("");
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
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
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
    (g) => !searchQ || g.name?.toLowerCase().includes(searchQ.toLowerCase()),
  );

  /* Group messages by date for dividers */
  const groupedMessages = messages.reduce((acc, msg, idx) => {
    const prevDate =
      idx > 0 ? new Date(messages[idx - 1].sent_at).toDateString() : null;
    const thisDate = new Date(msg.sent_at).toDateString();
    if (thisDate !== prevDate)
      acc.push({ type: "divider", date: msg.sent_at, id: `d_${msg.sent_at}` });
    acc.push(msg);
    return acc;
  }, []);

  const selectedColor = selected
    ? getGroupColor(selected.name || "")
    : "#5b8af0";

  return (
    <div style={{ maxWidth: "100vw", margin: "0 auto" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        textarea::-webkit-scrollbar { width:4px }
        textarea::-webkit-scrollbar-track { background: transparent }
        textarea::-webkit-scrollbar-thumb { background: var(--neu-shadow-dark); border-radius:4px }
        .msg-scroll::-webkit-scrollbar { width:5px }
        .msg-scroll::-webkit-scrollbar-track { background: transparent }
        .msg-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius:5px }
      `}</style>

      {/* ── Main container ── */}
      <div
        style={{
          padding: 0,
          overflow: "hidden",
          display: "flex",
          height: "85vh",
          minHeight: 500,
        }}
      >
        {/* ════ LEFT: Group Sidebar ════ */}
        <div
          style={{
            width: 280,
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
              padding: "1.1rem 1rem 0.75rem",
              borderBottom: "1px solid var(--neu-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "0.65rem",
                  background: "rgba(91,138,240,0.12)",
                  color: "#5b8af0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)",
                }}
              >
                <MessageSquare size={15} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.85rem",
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
                  {groups.length} groups
                </p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: "0.7rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--neu-text-ghost)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search groups…"
                style={{
                  width: "100%",
                  paddingLeft: "2rem",
                  paddingRight: "0.7rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                  borderRadius: "0.65rem",
                  border: "none",
                  background: "var(--neu-surface)",
                  boxShadow:
                    "inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)",
                  fontSize: "0.78rem",
                  color: "var(--neu-text-primary)",
                  outline: "none",
                  fontFamily: "'DM Sans',sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Group list */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "0.6rem 0.65rem" }}
          >
            {groupsLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "2rem",
                }}
              >
                <Loader2
                  size={22}
                  style={{
                    color: "#5b8af0",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            ) : visibleGroups.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--neu-text-ghost)",
                  }}
                >
                  No groups found
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
        </div>

        {/* ════ RIGHT: Chat Area ════ */}
        {!selected ? (
          /* Empty state */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "1.5rem",
                ...neuInset({ borderRadius: "1.5rem" }),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5b8af0",
              }}
            >
              <MessageSquare size={30} />
            </div>
            <p
              style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--neu-text-secondary)",
                fontFamily: "Outfit,sans-serif",
              }}
            >
              Select a Chat
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--neu-text-ghost)" }}>
              Choose a class group from the sidebar
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.25rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {groups.slice(0, 3).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    background: "var(--neu-surface)",
                    boxShadow: "var(--neu-raised)",
                    color: "var(--neu-text-secondary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    transition: "transform 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {/* ── Chat Header ── */}
            <div
              style={{
                padding: "0.9rem 1.25rem",
                borderBottom: "1px solid var(--neu-border)",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                background: "var(--neu-surface)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
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
                {selected.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: "var(--neu-text-primary)",
                    fontFamily: "Outfit,sans-serif",
                  }}
                >
                  {selected.name}
                </p>
                
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.65rem",
                  color: "var(--neu-text-ghost)",
                }}
              >
                <Clock size={11} />
                Polls every 5s
              </div>
            </div>

            {/* ── Messages ── */}

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
                background: "var(--neu-surface-deep)",
              }}
            >
              {msgLoading ? (
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
                    size={26}
                    style={{
                      color: "#5b8af0",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--neu-text-ghost)",
                    }}
                  >
                    Loading messages…
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
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "1rem",
                      background: `${selectedColor}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow:
                        "inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)",
                    }}
                  >
                    <Hash size={22} style={{ color: selectedColor }} />
                  </div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: "var(--neu-text-secondary)",
                    }}
                  >
                    No messages yet
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--neu-text-ghost)",
                    }}
                  >
                    Say something to start the conversation!
                  </p>
                </div>
              ) : (
                groupedMessages.map((item, idx) => {
                  if (item.type === "divider")
                    return <DateDivider key={item.id} date={item.date} />;

                  const isOwn = item.sender_id === currentUserId;
                  const prev = messages[messages.indexOf(item) - 1];
                  const next = messages[messages.indexOf(item) + 1];
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

            {/* ── Input Bar ── */}
            <div
              style={{
                padding: "0.85rem 1.1rem",
                borderTop: "1px solid var(--neu-border)",
                background: "var(--neu-surface)",
                display: "flex",
                alignItems: "flex-end",
                gap: "0.65rem",
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
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKey}
                  placeholder={`Message ${selected.name}…`}
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
                  color:
                    input.trim() && !sending ? "#fff" : "var(--neu-text-ghost)",
                  cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.18s",
                  transform: "translateY(0)",
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !sending)
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.05)";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
              >
                {sending ? (
                  <Loader2
                    size={18}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
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
