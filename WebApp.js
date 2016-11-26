import './WebApp.css';
import {API_URL} from './config';
import fetch from 'isomorphic-fetch';
import React, {PropTypes} from 'react';
import uuid from 'node-uuid';
import botSendsImage from './bot-sends.svg';

// ------------------------------------------------------------
// helpers

function user(text) {
  return {type: 'user', payload: {text}};
}

function bot(payload) {
  return {type: 'bot', payload};
}

function forChat({type, payload}) {
  return (type === 'user') || (type === 'bot' && payload.name === 'send');
}

// ------------------------------------------------------------
// API

function sendText(text, sessionId) {
  return fetch(
    `${API_URL}/chat?text=${text}&sessionId=${sessionId}`
  ).then(x => x.json());
}

// ------------------------------------------------------------
// Components

class Header extends React.Component {
  render() {
    return (
      <div className="WebApp-header">
        <h1 className="WebApp-header-title">wittyweather</h1>
        <h3 className="WebApp-header-subtitle">
          A 5 minute bot built with &nbsp;
          <a
            className="WebApp-header-link"
            href="https://wit.ai/docs/quickstart">
            BotEngine
          </a>
        </h3>
        <a
          className="WebApp-button"
          href="https://github.com/stopachka/witty-weather">
          View on Github
        </a>
      </div>
    );
  }
}

class ChatMessage extends React.Component {
  static propTypes = {
    message: PropTypes.object.isRequired,
  };
  render() {
    const {type, payload} = this.props.message;
    switch (type) {
      case 'user':
        return <div className="WebApp-user-bubble">{payload.text}</div>;
      case 'bot':
        // eslint-disable-next-line
        const [_req, res] = payload.args;
        return <div className="WebApp-bot-bubble">{res.text}</div>;
      default:
        return null;
    }
  }
}

class LogItem extends React.Component {
  static propTypes = {
    comment: PropTypes.string.isRequired,
    value: PropTypes.object.isRequired,
  }
  render() {
    const {comment, value} = this.props;
    return (
      <div className="WebApp-log-item">
        <div className="WebApp-log-comment">
          // {comment}
        </div>
        <div className="WebApp-log-value">
          {
            typeof value === 'string'
              ? value
              : JSON.stringify(value)
          }
        </div>
      </div>
    );
  }
}

class LogMessage extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired,
  }
  render() {
    const {type, payload} = this.props.message;
    switch (type) {
      case 'user':
        return (
          <div>
            <LogItem comment="user sends:" value={payload} />
            <div className="WebApp-log-break">
              asking wit what to do next...
            </div>
          </div>
        );
      case 'bot':
        // eslint-disable-next-line
        const [_req, res] = payload.args;
        return payload.name === 'send'
          ? <LogItem comment="bot sends:" value={res} />
          : <LogItem comment="bot executes:" value={`> ${payload.name}()`} />
        ;
      default:
        return null;
    }
  }
}

class EmptyMessage extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired,
  }
  render() {
    const {message} = this.props;
    return (
      <div className="WebApp-empty-message">{message}</div>
    );
  }
}

class Chat extends React.Component {
  static propTypes = {
    inputValue: PropTypes.string.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onInputKeyDown: PropTypes.func.isRequired,
    messages: PropTypes.array.isRequired,
  }
  componentDidMount() {
    this.focus();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.messages !== this.props.messages) {
      this.scrollToBottom();
    }
  }
  focus() {
    if (this._input) { this._input.focus(); }
  }
  scrollToBottom() {
    if (this._list) { this._list.scrollTop = this._list.scrollHeight; }
  }
  render() {
    const {inputValue, messages, onInputChange, onInputKeyDown} = this.props;
    return (
      <div className="WebApp-chat-root">
        {
          messages.length
          ? <div ref={x => {this._list = x}} className="WebApp-chat-list">
              {
                messages
                  .filter(forChat)
                  .map((m, idx) => <ChatMessage key={idx} message={m} />)
              }
            </div>
          : <EmptyMessage message="Type something..." />
        }
        <div>
          <input
            ref={x => {this._input = x}}
            className="WebApp-chat-composer"
            placeholder="Chat with your bot here..."
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
            value={inputValue}
          />
          <div className="WebApp-chat-composer-info">
            * Send <strong>/reset</strong> to start fresh
          </div>
        </div>
      </div>
    );
  }
}

class Log extends React.Component {
  static propTypes = {
    messages: PropTypes.array.isRequired,
  }
  componentDidUpdate(prevProps) {
    if (prevProps.messages !== this.props.messages) {
      this.scrollToBottom();
    }
  }
  scrollToBottom() {
    if (this._list) { this._list.scrollTop = this._list.scrollHeight; }
  }
  render() {
    const {messages} = this.props;
    return (
      <div ref={x => { this._list = x; }} className="WebApp-log-root">
        {
          messages.length
            ? messages.map((m, idx) => <LogMessage key={idx} message={m} />)
            : <EmptyMessage message="Logs..." />
        }
      </div>
    );
  }
}

class Error extends React.Component {
  render() {
    return (
      <div className="WebApp-error">
        <h1>We had an error :\</h1>
        <h3>This should not have happened. Look into your console, and ping us</h3>
        <button
          className="WebApp-button"
          onClick={_ => window.location.reload()}>Reload
        </button>
      </div>
    );
  }
}

class Container extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  }
  render() {
    return (
      <div className="WebApp-container-root">
        {this.props.children}
      </div>
    );
  }
}


class ContainerTitle extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  }
  render() {
    return (
      <h2 className="WebApp-container-title">
        {this.props.children}
      </h2>
    );
  }
}

class Arrows extends React.Component {
  static propTypes = {
    directions: PropTypes.arrayOf(
      PropTypes.oneOf(['right-to-left', 'left-to-right'])
    ),
    children: PropTypes.node.isRequired,
  }
  render() {
    const {directions, children} = this.props;
    return (
      <div className="WebApp-arrows-root">
        {
          directions.reduce(
            (child, dir) =>
              <div className={`WebApp-arrow-${dir}`}>
                {child}
              </div>
            ,
            children,
          )
        }
      </div>
    );
  }
}

const emptyState = () => ({
  inputValue: '',
  messages: [],
  sessionId: uuid.v4(),
  hasError: false,
});

export default class WebApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = emptyState();
  }
  render() {
    const {inputValue, messages, hasError} = this.state;
    if (hasError) return <Error />
    return (
      <div className="WebApp-root">
        <Header />
        <div className="WebApp-body">
          <Container>
            <Arrows directions={['right-to-left']}>
              <ContainerTitle>Chat Bot</ContainerTitle>
            </Arrows>
            <Chat
              inputValue={inputValue}
              onInputChange={this._onInputChange}
              onInputKeyDown={this._onInputKeyDown}
              messages={messages}
            />
          </Container>
          <Container>
            <Arrows directions={['right-to-left', 'left-to-right']}>
              <ContainerTitle>Server</ContainerTitle>
            </Arrows>
            <Log messages={messages} />
          </Container>
          <Container>
            <Arrows directions={['left-to-right']}>
              <ContainerTitle>Wit App</ContainerTitle>
            </Arrows>
            <a
              className="WebApp-wit-image-root"
              href="https://wit.ai/stopachka/wittyweather">
              <img
                className="WebApp-wit-image"
                src={botSendsImage}
                alt="See the stories"
              />
            </a>
          </Container>
        </div>
      </div>
    );
  }
  _onInputChange = (e) => {
    this.setState({inputValue: e.target.value});
  }
  _onInputKeyDown = (e) => {
    const value = this.state.inputValue.trim();
    if (e.key !== 'Enter') return;
    if (value === '/reset') {
      this.setState(emptyState());
    } else {
      this.setState({inputValue: ''});
      this._sendText(value, this.state.sessionId);
    }
  }
  _sendText = (userText, sessionId) => {
    const addMessages = (ms) => this.setState(
      ({messages}) => ({messages: [...messages, ...ms]}),
    );
    addMessages([user(userText)]);
    sendText(userText, sessionId).then(
      res => addMessages(res.actions.map(bot)),
      _error => this.setState({hasError: true})
    );
  }
}
