import { html, useState, useEffect } from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,preact-render-to-string"
import List from "./List.js"
import { useLocalState } from "../hooks/useLocalstate.js"

const App = () => {
  const [dataArray, setDataArray] = useLocalState('dataArray')
  const [latestEvent, setLatestEvent] = useState(0)
  
  useEffect(() => {
    const sse = new EventSource("/sse")
    sse.onmessage = (e) => {
      const eventData = JSON.parse(e.data)
      setLatestEvent(eventData.detail)
      console.log(e)
    }
    sse.onerror = (e) => {
      sse.close()
      console.log(e)
    }
    document.body.addEventListener("unload", () => sse.close())
    return () => sse.close()
  }, [])

  return html`
    <div style="margin: 2rem 0;">
      <p><strong>Latest random number from server: </strong> ${latestEvent}</p>

      <${List} data=${dataArray} />

      <button 
        style=${btnLgStyle} 
        onClick=${() => setDataArray(dataArray => [...dataArray, `Item ${dataArray.length}`])}
      >
        add item
      </button>
      <button 
        style=${btnLgStyle} 
        onClick=${() => setDataArray(dataArray => dataArray.slice(0, dataArray.length-1))}
      >
        remove item
      </button>
    </div>
  `
}

const btnLgStyle = `
    margin: 0.5rem;  
    padding: 0.5rem;
    font-size: 1rem;
`

export default App
