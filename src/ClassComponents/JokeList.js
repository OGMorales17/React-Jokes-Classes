import React, { Component } from "react";
import axios from "axios";
import Joke from "./Joke";
import "./JokeList.css";


export default class JokeList extends Component {
  constructor(props) {
    super(props)
    this.state = { jokes: [] }
    this.generateNewJokes = this.generateNewJokes.bind(this)
    this.vote = this.vote.bind(this)

    this.resetVotes = this.resetVotes.bind(this);
    this.toggleLock = this.toggleLock.bind(this);
  }

  // Set 10 jokes as default render
  static defaultProps = {
    numJokesToGet: 10
  };

  // componentDidMount() and componentDidUpdate() will do the work of useEffect that will only work on functional Components

  componentDidMount() {
    if (this.state.jokes.length < this.props.numJokesToGet) this.getJokes();
  }

  componentDidUpdate() {
    if (this.state.jokes.length < this.props.numJokesToGet) this.getJokes();
  }

  async getJokes() {
    try {
      let jokes = this.state.jokes
      /**
       * Store the list of jokes, with votes in local storage. When users visit the app, 
       * it should show saved jokes, rather than fetching new jokes. However, 
       * the user should still be able to generate new jokes via the button, 
       * and these new jokes should replace the ones in local storage.
       */
      let jokeVotes = JSON.parse(
        window.localStorage.getItem("jokeVotes") || "{}"
      );

      let seenJokes = new Set(jokes.map(j => j.id));

      while (jokes.length < this.props.numJokesToGet) {
        let res = await axios.get("https://icanhazdadjoke.com", {
          headers: { Accept: "application/json" }
        });
        let { status, ...jokeObj } = res.data;

        if (!seenJokes.has(jokeObj.id)) {
          seenJokes.add(jokeObj.id);

          jokeVotes[jokeObj.id] = jokeVotes[jokeObj.id] || 0;

          jokes.push({ ...jokeObj, votes: jokeVotes[jokeObj.id], locked: false });
        } else {
          console.error("duplicate found!");
        }
      }

      this.setState({ jokes })

      window.localStorage.setItem("jokeVotes", JSON.stringify(jokeVotes));
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Whenever you use this.setState and you pass a callback function to it, 
   * the argument in the callback function is the previous state
   */

  generateNewJokes() {
    this.setState(st => ({ jokes: st.jokes.filter(j => j.locked) }));
  }

  resetVotes() {
    window.localStorage.setItem("jokeVotes", "{}");
    this.setState(st => ({
      jokes: st.jokes.map(joke => ({ ...joke, votes: 0 }))
    }));
  }

  vote(id, delta) {
    let jokeVotes = JSON.parse(window.localStorage.getItem("jokeVotes"));
    jokeVotes[id] = (jokeVotes[id] || 0) + delta;
    window.localStorage.setItem("jokeVotes", JSON.stringify(jokeVotes));
    this.setState(st => ({
      jokes: st.jokes.map(j =>
        j.id === id ? { ...j, votes: j.votes + delta } : j
      )
    }));

  }

  toggleLock(id) {
    this.setState(st => ({
      jokes: st.jokes.map(j => (j.id === id ? { ...j, locked: !j.locked } : j))
    }));

  }

  render() {
    let sortedJokes = [...this.state.jokes].sort((a, b) => b.votes - a.votes);
    let allLocked =
      sortedJokes.filter(j => j.locked).length === this.props.numJokesToGet;

    return (
      <div className="JokeList">
        <button
          className="JokeList-getmore"
          onClick={this.generateNewJokes}
          disabled={allLocked}
        >
          Get New Jokes
        </button>
        <button className="JokeList-getmore" onClick={this.resetVotes}>
          Reset Vote Counts
        </button>

        {sortedJokes.map(j => (
          <Joke
            text={j.joke}
            key={j.id}
            id={j.id}
            votes={j.votes}
            vote={this.vote}
            locked={j.locked}
            toggleLock={this.toggleLock}
          />
        ))}

        {sortedJokes.length < this.props.numJokesToGet ? (
          <div className="loading">
            <i className="fas fa-4x fa-spinner fa-spin" />
          </div>
        ) : null}
      </div>
    );
  }
}
