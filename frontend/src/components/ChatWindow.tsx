import { ChatMsg } from "../hooks/useChat";

export default function ChatWindow({ messages }: { messages: ChatMsg[] }) {
  return (
    <div className="chat">
      {messages.map((m, i) => (
        <div key={i} className={`bubble ${m.role}`}>
          <pre className="bubble-text">{m.text}</pre>
        </div>
      ))}
    </div>
  );
}
