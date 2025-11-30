import { ChatMsg } from "../hooks/useChat";

export default function ChatWindow({ messages }: { messages: ChatMsg[] }) {
  return (
    <div className="chat">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`bubble ${m.role === "user" ? "user" : "ai"}`}
        >
          <div className="bubble-text">{m.text}</div>
        </div>
      ))}
    </div>
  );
}
