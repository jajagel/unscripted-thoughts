import "./style.css";
import { useState, useEffect } from "react";
import { topics } from "./data";
import supabase from "./supabase";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [thoughts, setThoughts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("All");

  useEffect(
    function () {
      async function getThoughts() {
        setIsLoading(true);
        let query = supabase.from("thoughts").select("*");
        if (currentTopic != "All") {
          query = query.eq("topic", currentTopic);
        }
        let { data: thoughts, error } = await query
          .order("votesLike", {
            ascending: false,
          })
          .order("votesHeart", {
            ascending: false,
          })
          .limit(1000);

        if (!error) setThoughts(thoughts);
        else alert("There was a problem retrieving data from the database.");
        setIsLoading(false);
      }
      getThoughts();
    },
    [currentTopic]
  );
  return (
    <>
      <div className="container">
        <AppHeader showForm={showForm} setShowForm={setShowForm} />
        {showForm ? (
          <ThoughtForm setThoughts={setThoughts} setShowForm={setShowForm} />
        ) : null}
        <main className="main">
          <TopicFilter setCurrentTopic={setCurrentTopic} />
          {isLoading ? (
            <Loader />
          ) : (
            <ThoughtList thoughts={thoughts} setThoughts={setThoughts} />
          )}
        </main>
      </div>
    </>
  );
}

function AppHeader({ showForm, setShowForm }) {
  return (
    <header className="header">
      <div className="logo">
        <img src="/logo.svg" width="68" height="68" alt="kwento ko logo" />
        <h1>Unscripted Thoughts</h1>
      </div>
      <button
        onClick={() => setShowForm((show) => !show)}
        className="btn btn-action"
      >
        {showForm ? "Close" : "Share a thought"}
      </button>
    </header>
  );
}
function Loader() {
  return (
    <div className="loader">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
}
function ThoughtForm({ setThoughts, setShowForm }) {
  const [text, setText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    if (text && selectedTopic && text.length <= 300) {
      setIsUploading(true);
      const { data: newThought, error } = await supabase
        .from("thoughts")
        .insert([{ text, topic: selectedTopic }])
        .select();
      setIsUploading(false);

      if (!error) setThoughts((thoughts) => [newThought[0], ...thoughts]);

      setText("");
      setSelectedTopic("");
      setShowForm(false);
    }
  }
  return (
    <form action="" className="form" onSubmit={handleSubmit}>
      <div className="description">
        <input
          type="text"
          placeholder="Share a thought..."
          value={text}
          disabled={isUploading}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
        />
        <span>{300 - text.length}</span>
      </div>
      <div className="topic">
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          disabled={isUploading}
        >
          <option value="">Choose topic</option>
          {topics.map((topic, index) => (
            <option key={index} value={topic.name}>
              {topic.name}
            </option>
          ))}
        </select>
        <button className="btn btn-action" disabled={isUploading}>
          Post
        </button>
      </div>
    </form>
  );
}
function TopicFilter({ setCurrentTopic }) {
  return (
    <aside>
      <ul>
        <li>
          <button
            className="btn btn-all"
            onClick={() => setCurrentTopic("All")}
          >
            All
          </button>
        </li>
        {topics.map((topic, index) => (
          <Topic key={index} topic={topic} setCurrentTopic={setCurrentTopic} />
        ))}
      </ul>
    </aside>
  );
}
const Topic = ({ topic, setCurrentTopic }) => {
  return (
    <li>
      <button
        className="btn btn-category "
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = topic.color;
          e.target.style.color = "#1e1a23";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = topic.color;
        }}
        onClick={() => setCurrentTopic(topic.name)}
        style={{ borderColor: topic.color, color: topic.color }}
      >
        {topic.name}
      </button>
    </li>
  );
};
function ThoughtList({ thoughts, setThoughts }) {
  if (thoughts.length === 0) {
    return <div className="thought">No posts for this category yet.</div>;
  }
  return (
    <section>
      <ul>
        {thoughts.map((thought, index) => (
          <Thought thought={thought} setThoughts={setThoughts} key={index} />
        ))}
      </ul>
    </section>
  );
}
const Thought = ({ thought, setThoughts }) => {
  const [isUploading, setIsUploading] = useState(false);

  async function handleVote(voteCategory) {
    setIsUploading(true);
    const { data: updatedThought, error } = await supabase
      .from("thoughts")
      .update({ [voteCategory]: thought[voteCategory] + 1 })
      .eq("id", thought.id)
      .select();
    setIsUploading(false);

    if (!error)
      setThoughts((thoughts) =>
        thoughts.map((f) => (f.id === thought.id ? updatedThought[0] : f))
      );
  }

  const color = topics.find((topic) => topic.name === thought.topic).color;

  return (
    <li className="thought">
      <p>{thought.text}</p>
      <span className="tag" style={{ borderColor: color, color: color }}>
        {thought.topic}
      </span>
      <div className="vote-buttons">
        <button onClick={() => handleVote("votesLike")} disabled={isUploading}>
          👍<strong>{thought.votesLike}</strong>
        </button>
        <button onClick={() => handleVote("votesHeart")}>
          ❤️ <strong>{thought.votesHeart}</strong>
        </button>
      </div>
    </li>
  );
};

export default App;
