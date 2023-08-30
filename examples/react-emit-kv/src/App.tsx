import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";

interface AppProps {
  tasks: string[]
}

export default function App({ tasks }: AppProps) {
  const [taskList, setTaskList] = useState(tasks);
  const [completed, setCompleted] = useState(0);

  const removeTask = (task: string) => {
    setTaskList(list => list.filter(x => x !== task))
  }

  useEffect(() => {
    setCompleted(tasks.length - taskList.length)
  }, [taskList])

  return <body>
    <ol>
      {taskList.map(task => <li key={task}>
        {task}
        <span>
          <button onClick={() => removeTask(task)}>done</button>
        </span>
      </li>)}
    </ol>
    <p>Completed: {completed}</p>

    <script type="module" dangerouslySetInnerHTML={{ __html: `
      import { hydrateRoot } from "https://esm.sh/react-dom@18.2.0/client";
      import App from "/src/App.tsx";
      hydrateRoot(document.body, App({ tasks: ${JSON.stringify(tasks)} }));
    `}} />
  </body>
}